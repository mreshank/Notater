import * as Tone from "tone";

// We need a stable recorder instance
let recorder: Tone.Recorder | null = null;
const loopPlayers: Record<string, Tone.Player> = {};

// Initialize recorder connected to Master
export const initLooper = () => {
    if (!recorder) {
        recorder = new Tone.Recorder();
        Tone.getDestination().connect(recorder);
    }
};

export const startRecording = async () => {
    if (!recorder) initLooper();
    if (recorder?.state === "started") return;
    await recorder?.start();
};

export const stopRecording = async (trackId: string): Promise<string | null> => {
    if (!recorder || recorder.state !== "started") return null;
    
    const blob = await recorder.stop();
    const url = URL.createObjectURL(blob);
    
    // Create player for this loop
    if (loopPlayers[trackId]) {
        loopPlayers[trackId].dispose();
    }
    
    // We create a player that loops
    const player = new Tone.Player(url).toDestination();
    player.loop = true;
    loopPlayers[trackId] = player;
    
    return url;
};

export const playLoop = (trackId: string, sync = true) => {
    const player = loopPlayers[trackId];
    if (player) {
         if (sync && Tone.Transport.state === "started") {
             // Try to sync to next measure if transport running
             // simple start for now
             player.start(); 
         } else {
             player.start();
         }
    }
};

export const stopLoop = (trackId: string) => {
    loopPlayers[trackId]?.stop();
};

export const setLoopVolume = (trackId: string, db: number) => {
    if (loopPlayers[trackId]) {
        loopPlayers[trackId].volume.value = db;
    }
};

export const muteLoop = (trackId: string, muted: boolean) => {
    if (loopPlayers[trackId]) {
        loopPlayers[trackId].mute = muted;
    }
};

export const clearLoop = (trackId: string) => {
    if (loopPlayers[trackId]) {
        loopPlayers[trackId].stop();
        loopPlayers[trackId].dispose();
        delete loopPlayers[trackId];
    }
};
