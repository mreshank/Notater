import * as Tone from "tone";

export interface MidiHandler {
    onNoteOn: (note: string, velocity: number) => void;
    onNoteOff: (note: string) => void;
}

export class MidiManager {
  private static instance: MidiManager;
  private access: MIDIAccess | null = null;
  private inputs: Map<string, MIDIInput> = new Map();
  private handler: MidiHandler | null = null;

  private constructor() {}

  static getInstance(): MidiManager {
    if (!MidiManager.instance) {
      MidiManager.instance = new MidiManager();
    }
    return MidiManager.instance;
  }

  setHandler(handler: MidiHandler) {
      this.handler = handler;
  }

  async initialize(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) {
      console.warn("Web MIDI API not supported in this browser.");
      return;
    }

    try {
      this.access = await navigator.requestMIDIAccess();
      
      // Initial Setup
      this.updateInputs();
      
      // Listen for connection changes
      this.access.onstatechange = () => {
        this.updateInputs();
      };

    } catch (err) {
      console.error("Failed to access Web MIDI API", err);
    }
  }

  private updateInputs() {
    if (!this.access) return;

    this.inputs.clear();

    for (const input of this.access.inputs.values()) {
      this.inputs.set(input.id, input);
      input.onmidimessage = (e) => this.handleMidiMessage(e as MIDIMessageEvent);
      console.log(`Attached listener to MIDI Input: ${input.name}`);
    }
  }

  private handleMidiMessage(event: MIDIMessageEvent) {
    if (!event.data) return;
    const data = event.data;
    const status = data[0];
    const data1 = data[1];
    const data2 = data[2];
    const command = status & 0xf0;

    // Note On
    if (command === 144) {
      const velocity = data2;
      if (velocity > 0) {
        this.noteOn(data1, velocity);
      } else {
        this.noteOff(data1);
      }
    }
    // Note Off
    else if (command === 128) {
      this.noteOff(data1);
    }
  }

  private noteOn(noteNumber: number, velocity: number) {
    const noteName = Tone.Frequency(noteNumber, "midi").toNote();
    if (this.handler) this.handler.onNoteOn(noteName, velocity);
  }

  private noteOff(noteNumber: number) {
    const noteName = Tone.Frequency(noteNumber, "midi").toNote();
    if (this.handler) this.handler.onNoteOff(noteName);
  }
}

export const midiManager = MidiManager.getInstance();
