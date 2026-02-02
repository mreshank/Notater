import * as Tone from "tone";
import { EffectsChain } from "./effects";

export interface ChannelStrip {
  input: Tone.Gain;
  eq: Tone.EQ3;
  panner: Tone.Panner;
  volume: Tone.Volume;
  sendReverb: Tone.Gain;
  sendDelay: Tone.Gain;
  output: Tone.Gain;
}

export class MixerManager {
  private channels: Record<string, ChannelStrip> = {};
  private masterChain: EffectsChain | null = null;
  private masterOutput: Tone.Gain;


  private recorder: Tone.Recorder;

  constructor() {
    this.masterOutput = new Tone.Gain(1).toDestination();
    this.recorder = new Tone.Recorder();
    this.masterOutput.connect(this.recorder);
  }

  setMasterChain(chain: EffectsChain) {
    this.masterChain = chain;
    // Connect master chain output to recorder
    this.masterChain.output.connect(this.recorder);
  }

  getChannel(id: string): ChannelStrip | undefined {
    return this.channels[id];
  }

  async startRecording() {
    if (this.recorder.state === "started") return;
    await this.recorder.start();
    console.log("🔴 Global Recording Started");
  }

  async stopRecording(): Promise<Blob> {
    if (this.recorder.state === "stopped") return new Blob([]);
    const recording = await this.recorder.stop();
    console.log("⬛ Global Recording Stopped");
    return recording;
  }


  createChannel(id: string, name: string): ChannelStrip {
    if (this.channels[id]) return this.channels[id];

    // 1. Create Nodes
    const input = new Tone.Gain(1);
    const eq = new Tone.EQ3(0, 0, 0);
    const panner = new Tone.Panner(0);
    const volume = new Tone.Volume(-6); // Default -6dB
    const output = new Tone.Gain(1);

    // Sends (Aux)
    const sendReverb = new Tone.Gain(0);
    const sendDelay = new Tone.Gain(0);

    // 2. Chain Logic: Input -> EQ -> Panner -> Volume -> Output
    input.connect(eq);
    eq.connect(panner);
    panner.connect(volume);
    volume.connect(output);

    // 3. Connect to Master Chain (if available) or Destination
    if (this.masterChain) {
        // Main Out -> Distortion (Start of Master Chain)
        output.connect(this.masterChain.distortion);
        
        // Aux Sends
        // We tap the signal *after* volume (Post-Fader) usually, or Pre-Fader.
        // Let's go Post-Fader (from volume node)
        volume.connect(sendReverb);
        volume.connect(sendDelay);

        sendReverb.connect(this.masterChain.reverb);
        sendDelay.connect(this.masterChain.delay);
    } else {
        // Fallback if no master chain yet
        output.toDestination();
    }

    const channel: ChannelStrip = {
      input, eq, panner, volume, sendReverb, sendDelay, output
    };

    this.channels[id] = channel;
    console.log(`🎚 Created Mixer Channel: ${name} (${id})`);
    
    return channel;
  }

  // Updates
  setVolume(id: string, val: number) {
    const ch = this.channels[id];
    if (ch) ch.volume.volume.rampTo(val, 0.1);
  }

  setPan(id: string, val: number) {
    const ch = this.channels[id];
    if (ch) ch.panner.pan.rampTo(val, 0.1);
  }

  setEQ(id: string, band: "low" | "mid" | "high", val: number) {
    const ch = this.channels[id];
    if (ch) ch.eq[band].value = val;
  }

  setSend(id: string, type: "reverb" | "delay", val: number) {
    const ch = this.channels[id];
    if (ch) {
        if (type === "reverb") ch.sendReverb.gain.rampTo(val, 0.1);
        if (type === "delay") ch.sendDelay.gain.rampTo(val, 0.1);
    }
  }

  setMute(id: string, muted: boolean) {
    const ch = this.channels[id];
    if (ch) ch.volume.mute = muted;
  }

  // Solo is trickier, requires muting others. 
  // For now simple implementation: Solo = mute all others? 
  // Or Tone.Solo? Tone.Solo is deprecated/removed in v14+.
  // We handle solo logic in store by muting others, so 'setMute' is sufficient.
}

export const mixer = new MixerManager();
