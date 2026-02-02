import { toast } from "sonner"; // Import sonner
import Peer, { DataConnection } from "peerjs";
import { useStore, type Note, type Collaborator } from "./store";

interface SyncState {
    project: ReturnType<typeof useStore.getState>['project'];
    sequencerGrid: ReturnType<typeof useStore.getState>['sequencerGrid'];
    mixer: ReturnType<typeof useStore.getState>['mixer'];
    synthPreset: ReturnType<typeof useStore.getState>['synthPreset'];
    pianoRollNotes: ReturnType<typeof useStore.getState>['pianoRollNotes'];
    collaborators: ReturnType<typeof useStore.getState>['collaborators'];
}

type SyncMessage = 
    | { type: "FULL_SYNC"; data: SyncState }
    | { type: "SEQUENCER_UPDATE"; rowId: string; step: number; value?: boolean }
    | { type: "MIXER_UPDATE"; trackId: string; field: string; value: number | boolean | string }
    | { type: "TRANSPORT"; playing: boolean }
    | { type: "BPM"; bpm: number }
    | { type: "EVENT_LOG"; message: string }
    | { type: "MASTER_FX_UPDATE"; field?: string; effect?: string; param?: string; value: number | string }
    | { type: "PIANOROLL_UPDATE"; action: "add" | "remove" | "clear"; note?: Note; id?: string }
    | { type: "JOIN"; user: Collaborator }
    | { type: "LEAVE"; userId: string }
    | { type: "PRESENCE_SYNC"; users: Collaborator[] };

class P2PManager {
    peer: Peer | null = null;
    connections: DataConnection[] = [];
    isHost = false;
    myId = "";
    me: Collaborator | null = null; // New: Store my own user info

    async initialize(userInfo: Collaborator, host = false): Promise<string> {
        this.isHost = host;
        this.me = userInfo; // Store my user info
        this.peer = new Peer(); // Auto-generate ID

        return new Promise((resolve, reject) => {
            this.peer!.on("open", (id) => {
                console.log("My Peer ID:", id);
                this.myId = id;
                this.me!.id = id; // Set my ID to peer ID
                useStore.getState().addCollaborator(this.me!); // Add myself to collaborators
                resolve(id);
            });

            this.peer!.on("connection", (conn) => {
                this.handleConnection(conn);
            });

            this.peer!.on("error", (err) => {
                console.error("Peer error:", err);
                reject(err);
            });
        });
    }

    connect(hostId: string) {
        if (!this.peer) return;
        const conn = this.peer.connect(hostId);
        this.handleConnection(conn);
    }

    private handleConnection(conn: DataConnection) {
        this.connections.push(conn);
        
        conn.on("open", () => {
             // Notify connection
             toast.success(`Connected to peer: ${conn.peer.slice(0, 5)}...`);
             this.broadcastLog(`Peer ${this.myId.slice(0, 5)}... joined.`);

            console.log("Connected to:", conn.peer);
            
            // If I am host, send full sync immediately
            if (this.isHost && this.me) {
                const state = useStore.getState();
                const syncData: SyncState = {
                    project: state.project,
                    sequencerGrid: state.sequencerGrid,
                    mixer: state.mixer,
                    synthPreset: state.synthPreset,
                    pianoRollNotes: state.pianoRollNotes,
                    collaborators: state.collaborators
                };
                conn.send({ type: "FULL_SYNC", data: syncData });
                // Host also broadcasts its own presence to the new client
                conn.send({ type: "JOIN", user: this.me });
            } else if (this.me) {
                // I am client connecting to host -> Send my presence
                conn.send({ type: "JOIN", user: this.me });
            }
        });

        conn.on("data", (data: unknown) => {
            this.handleMessage(data as SyncMessage, conn); // Pass conn to handleMessage
        });

        conn.on("close", () => {
            this.connections = this.connections.filter(c => c !== conn);
            console.log("Connection closed:", conn.peer);
            toast.info(`Peer disconnected: ${conn.peer.slice(0, 5)}...`);
            // Broadcast LEAVE message for the disconnected peer
            this.broadcast({ type: "LEAVE", userId: conn.peer });
            useStore.getState().removeCollaborator(conn.peer);
        });
    }

    broadcast(msg: SyncMessage, excludePeerId?: string) { // Added excludePeerId
        this.connections.forEach(conn => {
            if (conn.open && conn.peer !== excludePeerId) conn.send(msg);
        });
    }

    broadcastLog(message: string) {
        this.broadcast({ type: "EVENT_LOG", message });
    }

    private handleMessage(msg: SyncMessage, senderConn?: DataConnection) { // Added senderConn
        console.log("Received P2P Msg:", msg);
        const store = useStore.getState();

        switch (msg.type) {
            case "FULL_SYNC":
                if (!this.isHost) { // Only clients should receive full sync from host
                    // We need to apply state without triggering broadcast in loop.
                    // For now, we manually set store state.
                    useStore.setState({ 
                        project: msg.data.project,
                        sequencerGrid: msg.data.sequencerGrid,
                        mixer: msg.data.mixer,
                        synthPreset: msg.data.synthPreset,
                        pianoRollNotes: msg.data.pianoRollNotes,
                        collaborators: msg.data.collaborators
                    });
                    toast.success("Received Full Project Sync");
                }
                break;
            case "JOIN":
                store.addCollaborator(msg.user);
                toast.info(`${msg.user.name} joined the session`);
                if (this.isHost) {
                   // Host receives JOIN from a new client.
                   // Host should broadcast this JOIN message to all *other* connected clients.
                   this.broadcast(msg, senderConn?.peer);
                   // Also, the host should send its current list of collaborators to the new client
                   // This is handled by FULL_SYNC, but if a client joins after initial FULL_SYNC,
                   // the host might need to send a PRESENCE_SYNC to the new client.
                   // For simplicity, we assume FULL_SYNC covers initial state.
                }
                break;
            case "LEAVE":
                store.removeCollaborator(msg.userId);
                toast.info(`Peer disconnected`);
                if (this.isHost) {
                    // Host receives LEAVE. Broadcast to others.
                    this.broadcast(msg, senderConn?.peer);
                }
                break;
            case "PRESENCE_SYNC":
                // This message is typically sent by the host to sync all collaborators
                store.setCollaborators(msg.users);
                break;
            case "SEQUENCER_UPDATE":
                // Use explicit value if provided
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                store.toggleSequencerStep(msg.rowId, msg.step, (msg as any).value);
                break;
            case "MIXER_UPDATE":
                if (msg.field === 'volume') store.setTrackVolume(msg.trackId, msg.value as number);
                if (msg.field === 'pan') store.setTrackPan(msg.trackId, msg.value as number);
                if (msg.field === 'muted') store.toggleTrackMute(msg.trackId, msg.value as boolean);
                if (msg.field === 'solo') store.toggleTrackSolo(msg.trackId); 
                break;
            case "TRANSPORT":
                if (msg.playing !== store.isPlaying) store.togglePlay();
                toast.info(`Peer ${msg.playing ? "started" : "stopped"} playback`);
                break;
            case "BPM":
                store.setBpm(msg.bpm);
                toast.info(`Peer set BPM to ${msg.bpm}`);
                break;
            case "EVENT_LOG":
                toast.info(msg.message, { icon: "📡" });
                break;
            case "MASTER_FX_UPDATE":
                if (msg.effect === 'eq' && msg.param) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    store.setMasterEQ(msg.param as any, msg.value as number);
                } else if (msg.field) {
                    store.setMasterEffect(msg.field, msg.value as number);
                }
                break;
            case "PIANOROLL_UPDATE":
                if (msg.action === "add" && msg.note) {
                    store.addPianoNote(msg.note);
                } else if (msg.action === "remove" && msg.id) {
                    store.removePianoNote(msg.id);
                } else if (msg.action === "clear") {
                    store.clearPianoNotes();
                }
                break;
        }
    }
}

export const p2p = new P2PManager();
