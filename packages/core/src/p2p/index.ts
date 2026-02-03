import Peer, { DataConnection } from "peerjs";
import { Collaborator, Note } from "../models/types";

// Re-defining internal types if explicit models/types not fully ready or to be self-contained
// But optimally we use shared types.
// Assuming "../models/types" exists, otherwise define here.

export interface SyncState {
    project: any;
    sequencerGrid: any;
    mixer: any;
    synthPreset: any;
    pianoRollNotes: any;
    collaborators: Collaborator[];
}

export type SyncMessage = 
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

export interface P2PHandler {
    getState: () => SyncState;
    setState: (state: SyncState) => void;
    onCollaboratorJoin: (user: Collaborator) => void;
    onCollaboratorLeave: (userId: string) => void;
    onCollaboratorsUpdate: (users: Collaborator[]) => void;
    onSequencerUpdate: (rowId: string, step: number, value?: boolean) => void;
    onMixerUpdate: (trackId: string, field: string, value: number | boolean | string) => void;
    onTransportUpdate: (playing: boolean) => void;
    onBpmUpdate: (bpm: number) => void;
    onMasterEffectUpdate: (field?: string, effect?: string, param?: string, value?: number | string) => void;
    onPianoRollUpdate: (action: "add" | "remove" | "clear", note?: Note, id?: string) => void;
    onLog: (message: string, type?: "info" | "success" | "error") => void;
}

export class P2PManager {
    peer: Peer | null = null;
    connections: DataConnection[] = [];
    isHost = false;
    myId = "";
    me: Collaborator | null = null;
    handler: P2PHandler | null = null;

    setHandler(handler: P2PHandler) {
        this.handler = handler;
    }

    async initialize(userInfo: Collaborator, host = false): Promise<string> {
        this.isHost = host;
        this.me = userInfo;
        this.peer = new Peer();

        return new Promise((resolve, reject) => {
            if (!this.peer) return reject("Peer not initialized");

            this.peer.on("open", (id) => {
                console.log("My Peer ID:", id);
                this.myId = id;
                if (this.me) this.me.id = id;
                
                // Notify local store about self
                if (this.handler && this.me) {
                    this.handler.onCollaboratorJoin(this.me);
                }
                
                resolve(id);
            });

            this.peer.on("connection", (conn) => {
                this.handleConnection(conn);
            });

            this.peer.on("error", (err) => {
                console.error("Peer error:", err);
                if (this.handler) this.handler.onLog(`Peer Error: ${err.message}`, "error");
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
             if (this.handler) this.handler.onLog(`Connected to peer: ${conn.peer.slice(0, 5)}...`, "success");
             this.broadcastLog(`Peer ${this.myId.slice(0, 5)}... joined.`);

            console.log("Connected to:", conn.peer);
            
            if (this.isHost && this.me && this.handler) {
                // Host sends full sync
                const syncData = this.handler.getState();
                conn.send({ type: "FULL_SYNC", data: syncData });
                conn.send({ type: "JOIN", user: this.me });
            } else if (this.me) {
                conn.send({ type: "JOIN", user: this.me });
            }
        });

        conn.on("data", (data: unknown) => {
            this.handleMessage(data as SyncMessage, conn);
        });

        conn.on("close", () => {
            this.connections = this.connections.filter(c => c !== conn);
            console.log("Connection closed:", conn.peer);
            if (this.handler) {
                this.handler.onLog(`Peer disconnected: ${conn.peer.slice(0, 5)}...`, "info");
                this.handler.onCollaboratorLeave(conn.peer);
            }
            this.broadcast({ type: "LEAVE", userId: conn.peer });
        });
    }

    broadcast(msg: SyncMessage, excludePeerId?: string) {
        this.connections.forEach(conn => {
            if (conn.open && conn.peer !== excludePeerId) conn.send(msg);
        });
    }

    broadcastLog(message: string) {
        this.broadcast({ type: "EVENT_LOG", message });
    }

    private handleMessage(msg: SyncMessage, senderConn?: DataConnection) {
        if (!this.handler) return;

        switch (msg.type) {
            case "FULL_SYNC":
                if (!this.isHost) {
                    this.handler.setState(msg.data);
                    this.handler.onLog("Received Full Project Sync", "success");
                }
                break;
            case "JOIN":
                this.handler.onCollaboratorJoin(msg.user);
                this.handler.onLog(`${msg.user.name} joined the session`, "info");
                if (this.isHost) {
                   this.broadcast(msg, senderConn?.peer);
                }
                break;
            case "LEAVE":
                this.handler.onCollaboratorLeave(msg.userId);
                this.handler.onLog(`Peer disconnected`, "info");
                if (this.isHost) {
                    this.broadcast(msg, senderConn?.peer);
                }
                break;
            case "PRESENCE_SYNC":
                this.handler.onCollaboratorsUpdate(msg.users);
                break;
            case "SEQUENCER_UPDATE":
                this.handler.onSequencerUpdate(msg.rowId, msg.step, msg.value);
                break;
            case "MIXER_UPDATE":
                this.handler.onMixerUpdate(msg.trackId, msg.field, msg.value);
                break;
            case "TRANSPORT":
                this.handler.onTransportUpdate(msg.playing);
                this.handler.onLog(`Peer ${msg.playing ? "started" : "stopped"} playback`, "info");
                break;
            case "BPM":
                this.handler.onBpmUpdate(msg.bpm);
                this.handler.onLog(`Peer set BPM to ${msg.bpm}`, "info");
                break;
            case "EVENT_LOG":
                this.handler.onLog(msg.message, "info");
                break;
            case "MASTER_FX_UPDATE":
                this.handler.onMasterEffectUpdate(msg.field, msg.effect, msg.param, msg.value);
                break;
            case "PIANOROLL_UPDATE":
                this.handler.onPianoRollUpdate(msg.action, msg.note, msg.id);
                break;
        }
    }
}

export const p2p = new P2PManager();
