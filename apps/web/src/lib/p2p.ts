import Peer, { DataConnection } from "peerjs";
import { useStore } from "./store";

interface SyncState {
    project: ReturnType<typeof useStore.getState>['project'];
    sequencerGrid: ReturnType<typeof useStore.getState>['sequencerGrid'];
    mixer: ReturnType<typeof useStore.getState>['mixer'];
    synthPreset: ReturnType<typeof useStore.getState>['synthPreset'];
}

type SyncMessage = 
    | { type: "FULL_SYNC"; data: SyncState }
    | { type: "SEQUENCER_UPDATE"; rowId: string; step: number }
    | { type: "MIXER_UPDATE"; trackId: string; field: string; value: number | boolean }
    | { type: "TRANSPORT"; playing: boolean }
    | { type: "BPM"; bpm: number };

class P2PManager {
    peer: Peer | null = null;
    connections: DataConnection[] = [];
    isHost = false;
    myId = "";

    async initialize(host = false): Promise<string> {
        this.isHost = host;
        this.peer = new Peer(); // Auto-generate ID

        return new Promise((resolve, reject) => {
            this.peer!.on("open", (id) => {
                console.log("My Peer ID:", id);
                this.myId = id;
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
            console.log("Connected to:", conn.peer);
            
            // If I am host, send full sync immediately
            if (this.isHost) {
                const state = useStore.getState();
                const syncData = {
                    project: state.project,
                    sequencerGrid: state.sequencerGrid,
                    mixer: state.mixer,
                    synthPreset: state.synthPreset
                };
                conn.send({ type: "FULL_SYNC", data: syncData });
            }
        });

        conn.on("data", (data: unknown) => {
            this.handleMessage(data as SyncMessage);
        });

        conn.on("close", () => {
            this.connections = this.connections.filter(c => c !== conn);
            console.log("Connection closed:", conn.peer);
        });
    }

    broadcast(msg: SyncMessage) {
        this.connections.forEach(conn => {
            if (conn.open) conn.send(msg);
        });
    }

    private handleMessage(msg: SyncMessage) {
        console.log("Received P2P Msg:", msg);
        const store = useStore.getState();

        // Apply without broadcasting loop?
        // We need a way to suppress "broadcast on change" when applying remote changes
        // For now, let's just apply directly. Ideally store actions separate "remote" vs "local".
        
        switch (msg.type) {
            case "FULL_SYNC":
                useStore.setState({
                    project: msg.data.project,
                    sequencerGrid: msg.data.sequencerGrid,
                    mixer: msg.data.mixer,
                    synthPreset: msg.data.synthPreset
                });
                break;
            case "SEQUENCER_UPDATE":
                // toggleSequencerStep toggles, so we must be careful.
                // ideally send explicit value.
                store.toggleSequencerStep(msg.rowId, msg.step);
                break;
            case "MIXER_UPDATE":
                if (msg.field === 'volume') store.setTrackVolume(msg.trackId, msg.value as number);
                if (msg.field === 'pan') store.setTrackPan(msg.trackId, msg.value as number);
                if (msg.field === 'muted') store.toggleTrackMute(msg.trackId); // Toggle might desync
                if (msg.field === 'solo') store.toggleTrackSolo(msg.trackId);
                break;
            case "TRANSPORT":
                if (msg.playing !== store.isPlaying) store.togglePlay();
                break;
            case "BPM":
                store.setBpm(msg.bpm);
                break;
        }
    }
}

export const p2p = new P2PManager();
