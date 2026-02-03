import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { Utils } from "@notater/core";

export function useMidi() {
    useEffect(() => {
        // Initialize Core MIDI Manager
        const midi = Utils.midiManager;
        midi.initialize();

        // Set Handler to trigger Store Actions
        midi.setHandler({
            onNoteOn: (note, velocity) => {
                useStore.getState().triggerAttack(note);
            },
            onNoteOff: (note) => {
                useStore.getState().triggerRelease(note);
            }
        });

        // Cleanup not strictly necessary for singleton, but good practice if we had unmount logic
        // For now, we leave the handler attached or allow it to be overwritten.
    }, []);
}
