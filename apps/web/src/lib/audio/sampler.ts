import * as Tone from "tone";

interface SamplerCache {
    [url: string]: Tone.Player;
}

const cache: SamplerCache = {};

/**
 * Create or retrieve a player for a given URL (Blob URL)
 */
export async function getSampler(url: string, onLoad?: () => void): Promise<Tone.Player> {
    if (cache[url]) {
        if (onLoad) onLoad();
        return cache[url];
    }

    return new Promise((resolve) => {
        const player = new Tone.Player(url, () => {
            cache[url] = player;
            if (onLoad) onLoad();
            resolve(player);
        }).toDestination(); 
        // Note: We might want to NOT connect to destination by default if we use mixer channels later.
        // For now, consistent with other synths which generally assume connection logic elsewhere, 
        // but Tone.Player connects to destination by default if not specified otherwise? 
        // Actually Tone.Player(url) usually needs explicit .toDestination() or .connect().
    });
}

/**
 * Dispose a sampler
 */
export function disposeSampler(url: string) {
    if (cache[url]) {
        cache[url].dispose();
        delete cache[url];
    }
}
