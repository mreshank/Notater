
import { useEffect } from "react";
import { useStore } from "@/lib/store";

// Map MIDI note numbers to Note names
const noteMap = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function midiToNote(midi: number) {
    const octave = Math.floor(midi / 12) - 1;
    const note = noteMap[midi % 12];
    return `${note}${octave}`;
}

export function useMidi() {
    // We access the synth via the store's audio engine reference if possible,
    // but the store keeps audio logic encapsulated. 
    // Ideally, we add a `triggerNote` action to the store or access the exported synth.
    // The previous implementation had `globalSynth` exported from `lib/audio/index.ts`?
    // Let's check imports. `lib/store.ts` imports `createSynth` but `globalSynth` is lazy.
    
    // Actually, `store.ts` has `setSynthPreset` but maybe not direct trigger actions exposed appropriately for real-time play 
    // without React overhead.
    
    // For low latency, direct access is better.
    // Let's assume we can import `globalSynth` or use a store action.
    
    // If I use `useStore` actions, it might trigger state updates which is fine for UI but maybe slow for audio?
    // Not necessarily.
    
    // However, `lib/audio/index.ts` exports `globalSynth` variable? 
    // Let's verify. If not, I'll update store to handle "noteOn" / "noteOff".
    
    useEffect(() => {
        if (!navigator.requestMIDIAccess) return;

        const handleMidiMessage = (event: any) => {
            const [command, note, velocity] = event.data;
            
            // Note On
            if (command === 144 && velocity > 0) {
                const noteName = midiToNote(note);
                // Trigger Store Action
                useStore.getState().triggerAttack(noteName);
            }
            
            // Note Off
            if (command === 128 || (command === 144 && velocity === 0)) {
                 const noteName = midiToNote(note);
                 useStore.getState().triggerRelease(noteName);
            }
        };

        navigator.requestMIDIAccess().then((access) => {
            const inputs = access.inputs.values();
            for (const input of inputs) {
                input.onmidimessage = handleMidiMessage;
            }

            access.onstatechange = (e: any) => {
                // creating/removing connections
                 console.log(e.port.name, e.port.state, e.port.connection);
            };
        });

    }, []);
}
