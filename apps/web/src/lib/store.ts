import { create } from "zustand";
import { Track, Step } from "notater";
import * as Tone from "tone";
import { 
  initAudio, 
  setBpm as setGlobalBpm,
  startTransport,
  stopTransport,
  createSynth,
  createEffectsChain,
  type SynthPreset,
} from "./audio";
import { 
    initLooper, startRecording, stopRecording, playLoop as audioPlayLoop, stopLoop as audioStopLoop, clearLoop as audioClearLoop, setLoopVolume, muteLoop 
} from "./audio/looper";
import { 
  saveProject as saveProjectToDb, 
  getProject as getProjectFromDb,
  generateId, 
} from "./db";
import { exportProjectToWav } from "./audio/export";
import { getSampler } from "./audio/sampler";
import { saveSample, getSample } from "./db";
import { p2p } from "./p2p";
import { toast } from "sonner";

// Types
export interface SynthParams {
    oscillatorType: "triangle" | "sine" | "square" | "sawtooth" | "fatsawtooth" | "pulse" | "pwm";
    attack: number;
    decay: number;
    sustain: number;
    release: number;
    filterCutoff: number; // Hz
    filterResonance: number; // Q
    detune: number; // cents
}

export interface LoopTrack {
    id: string;
    state: "empty" | "recording" | "playing" | "stopped";
    volume: number; // dB
    muted: boolean;
    url?: string;
}


const ROWS = [
  { id: "kick", label: "KICK", note: "C2", color: "bg-primary" },
  { id: "snare", label: "SNARE", note: "D2", color: "bg-secondary" },
  { id: "hihat", label: "HI-HAT", note: "F#2", color: "bg-accent" },
  { id: "clap", label: "CLAP", note: "D#2", color: "bg-destructive" },
];

export type Note = {
  id: string;
  pitch: string;
  step: number;
  duration: number;
};

export interface MixerChannel {
  id: string;
  name: string;
  volume: number; // dB (-60 to +6)
  pan: number;    // -1 to 1
  muted: boolean;
  solo: boolean;
  sends: {
      reverb: number; // 0 to 1
      delay: number;
  };
  eq: {
      low: number; // -12 to 12
      mid: number;
      high: number;
  };
}

// Global synth instance (lazy initialized)
let globalSynth: Tone.PolySynth | null = null;
let globalEffects: ReturnType<typeof createEffectsChain> | null = null;
const trackPlayers: Record<string, Tone.Player> = {};

interface AppState {
  // Core Data
  project: {
    id: string;
    name: string;
    bpm: number;
    barCount: number;
    notes: string;
  };

  // Editor State
  masterEffects: {
      reverbWet: number;
      delayWet: number;
      delayTime: string;
      feedback: number;
      filterFreq: number;
      filterRes: number;
      bitCrusherBits: number;
      bitCrusherWet: number;
      chorusDepth: number;
      chorusWet: number;
      compressorThresh: number;
      compressorRatio: number;
  };
  sequencerGrid: Record<string, boolean[]>;
  pianoRollNotes: Note[];
  mixer: Record<string, MixerChannel>;
  trackSampleIds: Record<string, string>; // trackId -> sampleId (Persistent)
  trackSamples: Record<string, string>; // trackId -> blob URL (Ephemeral)

  // UI State
  isPlaying: boolean;
  isRecording: boolean;
  isAudioInitialized: boolean;
  currentStep: number;
  activeView: "pianoroll" | "pads" | "sequencer" | "piano" | "mix";
  theme: "lofi" | "cyber" | "neo" | "forest" | "ocean" | "sunset" | "midnight";
  synthPreset: SynthPreset;
  synthParams: SynthParams; 
  looper: Record<string, LoopTrack>;
  
  // Actions
  setSynthParam: (param: keyof SynthParams, value: any) => void;
  isLoading: boolean;
  currentTool: "pointer" | "pencil" | "eraser";

  // Actions
  initializeAudio: () => Promise<void>;
  togglePlay: () => void;
  toggleRecord: () => void;
  setBpm: (bpm: number) => void;
  setBarCount: (barCount: number) => void;
  setProjectNotes: (notes: string) => void;
  setTool: (tool: "pointer" | "pencil" | "eraser") => void;
  
  // Settings
  setTheme: (theme: "lofi" | "cyber" | "neo" | "forest" | "ocean" | "sunset" | "midnight") => void;
  setSynthPreset: (preset: SynthPreset) => void;
  setMasterEffect: (param: keyof AppState['masterEffects'], value: number | string) => void;

  // Mixer Actions
  setTrackVolume: (trackId: string, volume: number) => void;
  setTrackPan: (trackId: string, pan: number) => void;
  setTrackEQ: (trackId: string, band: "low" | "mid" | "high", value: number) => void;
  setTrackSend: (trackId: string, type: "reverb" | "delay", value: number) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;
  
  // Editor Actions
  toggleSequencerStep: (rowId: string, step: number) => void;
  setSequencerGrid: (grid: Record<string, boolean[]>) => void;
  addPianoNote: (note: Note) => void;
  removePianoNote: (id: string) => void;
  clearPianoNotes: () => void;
  
  // Persistence
  saveProject: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  loadDemoProject: () => void;
  
  // Synth Actions
  playNote: (note: string, duration?: string) => void;
  playTrack: (trackId: string) => void;
  triggerAttack: (note: string) => void;
  triggerRelease: (note: string) => void;
  importSample: (trackId: string, file: File) => Promise<void>;
  
  // Export
  exportAudio: () => Promise<void>;

  // Looper Actions
  loopRecord: (trackId: string) => Promise<void>;
  loopStopRecord: (trackId: string) => Promise<void>;
  loopPlay: (trackId: string) => void;
  loopStop: (trackId: string) => void;
  loopClear: (trackId: string) => void;
  loopVolume: (trackId: string, val: number) => void;
  loopMute: (trackId: string) => void;
}

const INITIAL_GRID: Record<string, boolean[]> = {};
const INITIAL_MIXER: Record<string, MixerChannel> = {};

ROWS.forEach(row => {
    INITIAL_GRID[row.id] = Array(16).fill(false);
    INITIAL_MIXER[row.id] = {
        id: row.id,
        name: row.label,
        volume: -6,
        pan: 0,
        muted: false,
        solo: false,
        sends: { reverb: 0, delay: 0 },
        eq: { low: 0, mid: 0, high: 0 }
    };
});

// Add melodic track to mixer
INITIAL_MIXER["melodic"] = {
    id: "melodic",
    name: "SYNTH",
    volume: -6,
    pan: 0,
    muted: false,
    solo: false,
    sends: { reverb: 0, delay: 0 },
    eq: { low: 0, mid: 0, high: 0 }
};


export const useStore = create<AppState>((set, get) => ({
  project: {
    id: generateId(),
    name: "Untitled Vibes",
    bpm: 120,
    barCount: 2,
    notes: ""
  },
  masterEffects: {
      reverbWet: 0.25,
      delayWet: 0,
      delayTime: "8n",
      feedback: 0.3,
      filterFreq: 20000,
      filterRes: 0,
      bitCrusherBits: 4,
      bitCrusherWet: 0,
      chorusDepth: 0.5,
      chorusWet: 0,
      compressorThresh: -20,
      compressorRatio: 4
  },
  sequencerGrid: INITIAL_GRID,
  pianoRollNotes: [],
  mixer: INITIAL_MIXER,
  trackSampleIds: {},
  trackSamples: {},
  
  isPlaying: false,
  isRecording: false,
  currentStep: 0,
  isAudioInitialized: false,
  activeView: "sequencer",
  theme: "cyber",
  synthPreset: "basic",
  synthParams: {
      oscillatorType: "triangle",
      attack: 0.02,
      decay: 0.1,
      sustain: 0.5,
      release: 0.5,
      filterCutoff: 2000,
      filterResonance: 0,
      detune: 0
  },
  looper: {
      "1": { id: "1", state: "empty", volume: 0, muted: false },
      "2": { id: "2", state: "empty", volume: 0, muted: false },
      "3": { id: "3", state: "empty", volume: 0, muted: false },
      "4": { id: "4", state: "empty", volume: 0, muted: false },
  },
  isLoading: false,
  currentTool: "pointer",

  initializeAudio: async () => {
    if (get().isAudioInitialized) return;
    try {
      await initAudio();
      globalEffects = createEffectsChain();
      globalSynth = createSynth(get().synthPreset);
      // Connect synth to START of chain (distortion)
      if (globalEffects) globalSynth.connect(globalEffects.distortion);
      setGlobalBpm(get().project.bpm);
      set({ isAudioInitialized: true });
      console.log("🎹 Synth initialized");
    } catch (err) {
      console.error("Failed to initialize audio:", err);
    }
  },

  togglePlay: () => {
    const { isPlaying, isAudioInitialized, initializeAudio } = get();
    if (!isAudioInitialized) {
      initializeAudio().then(() => {
        // Schedule step counter
        Tone.getTransport().scheduleRepeat((time) => {
          Tone.getDraw().schedule(() => {
            set(state => ({ currentStep: state.currentStep + 1 }));
          }, time);
        }, "16n");
        startTransport();
        set({ isPlaying: true, currentStep: 0 });
      });
      return;
    }
    if (isPlaying) {
      stopTransport();
      set({ isPlaying: false, currentStep: 0 });
    } else {
      // Schedule step counter
      Tone.getTransport().scheduleRepeat((time) => {
        Tone.getDraw().schedule(() => {
          set(state => ({ currentStep: state.currentStep + 1 }));
        }, time);
      }, "16n");
      startTransport();
      set({ isPlaying: true, currentStep: 0 });
    }
    p2p.broadcast({ type: "TRANSPORT", playing: !isPlaying });
  },

  toggleRecord: () => {
      set(state => ({ isRecording: !state.isRecording }));
  },

  setProjectNotes: (notes) => {
      set(state => ({ project: { ...state.project, notes } }));
  },

  setTool: (tool) => {
      set({ currentTool: tool });
  },
  
  setBpm: (bpm) => {
    setGlobalBpm(bpm);
    set((state) => ({ project: { ...state.project, bpm } }));
    p2p.broadcast({ type: "BPM", bpm });
  },

  setBarCount: (barCount) => {
      set((state) => ({ project: { ...state.project, barCount } }));
  },

  setTheme: (theme) => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
    set({ theme });
  },

  setSynthPreset: (preset) => {
    if (globalSynth && globalEffects) {
      // Release old synth
      globalSynth.disconnect();
      globalSynth.dispose();
      
      // Create new one
      globalSynth = createSynth(preset);
      globalSynth.connect(globalEffects.distortion);
    }
    set({ synthPreset: preset });
  },

  setMasterEffect: (param, value) => {
    if (globalEffects) {
        if (param === "reverbWet") globalEffects.reverb.wet.value = value as number;
        else if (param === "delayWet") globalEffects.delay.wet.value = value as number;
        else if (param === "delayTime") globalEffects.delay.delayTime.value = value as string;
        else if (param === "feedback") globalEffects.delay.feedback.value = value as number;
        else if (param === "filterFreq") globalEffects.filter.frequency.value = value as number;
        else if (param === "filterRes") globalEffects.filter.Q.value = value as number;
        else if (param === "bitCrusherBits") globalEffects.bitCrusher.bits.value = value as number;
        else if (param === "bitCrusherWet") globalEffects.bitCrusher.wet.value = value as number;
        else if (param === "chorusDepth") globalEffects.chorus.depth = value as number; // accessor
        else if (param === "chorusWet") globalEffects.chorus.wet.value = value as number;
        else if (param === "compressorThresh") globalEffects.compressor.threshold.value = value as number;
        else if (param === "compressorRatio") globalEffects.compressor.ratio.value = value as number;
    }
    set(state => ({
        masterEffects: { ...state.masterEffects, [param]: value }
    }));
  },

  setSynthParam: (param, value) => {
    set(state => ({ synthParams: { ...state.synthParams, [param]: value } }));
    
    if (globalSynth) {
        if (param === "oscillatorType") {
             globalSynth.set({ oscillator: { type: value as any } });
        } else if (["attack", "decay", "sustain", "release"].includes(param)) {
             // Grab fresh state for full envelope update
             const s = get().synthParams;
             globalSynth.set({ envelope: { attack: s.attack, decay: s.decay, sustain: s.sustain, release: s.release } });
        } else if (param === "detune") {
             globalSynth.set({ detune: value });
        }
    }
  },

  // Mixer Actions
  setTrackVolume: (trackId, volume) => {
    set((state) => ({
        mixer: {
            ...state.mixer,
            [trackId]: { ...state.mixer[trackId], volume }
        }
    }));
    p2p.broadcast({ type: "MIXER_UPDATE", trackId, field: "volume", value: volume });
  },

  setTrackPan: (trackId, pan) => {
    set((state) => ({
        mixer: {
            ...state.mixer,
            [trackId]: { ...state.mixer[trackId], pan }
        }
    }));
    p2p.broadcast({ type: "MIXER_UPDATE", trackId, field: "pan", value: pan });
  },

  setTrackEQ: (trackId, band, value) => {
    set((state) => ({
        mixer: {
            ...state.mixer,
            [trackId]: { 
                ...state.mixer[trackId], 
                eq: {
                    ...state.mixer[trackId].eq,
                    [band]: value
                }
            }
        }
    }));
    p2p.broadcast({ type: "MIXER_UPDATE", trackId, field: `eq-${band}`, value: value });
  },

  setTrackSend: (trackId, type, value) => {
    set((state) => ({
        mixer: {
            ...state.mixer,
            [trackId]: { 
                ...state.mixer[trackId], 
                sends: {
                    ...state.mixer[trackId].sends,
                    [type]: value
                }
            }
        }
    }));
    p2p.broadcast({ type: "MIXER_UPDATE", trackId, field: `send-${type}`, value: value });
  },

  toggleTrackMute: (trackId) => {
    set((state) => ({
      mixer: {
        ...state.mixer,
        [trackId]: { ...state.mixer[trackId], muted: !state.mixer[trackId].muted }
      }
    }));
    p2p.broadcast({ type: "MIXER_UPDATE", trackId, field: "muted", value: 0 }); // Value ignored for toggle
  },

  toggleTrackSolo: (trackId) => {
    set((state) => {
      const newSolo = !state.mixer[trackId].solo;
      return {
          mixer: {
              ...state.mixer,
              [trackId]: { ...state.mixer[trackId], solo: newSolo }
          }
      };
    });
    p2p.broadcast({ type: "MIXER_UPDATE", trackId, field: "solo", value: 0 });
  },

  // Editor Actions
  toggleSequencerStep: (rowId, step) => {
    set((state) => ({
      sequencerGrid: {
        ...state.sequencerGrid,
        [rowId]: state.sequencerGrid[rowId].map((val, i) => i === step ? !val : val)
      }
    }));
    p2p.broadcast({ type: "SEQUENCER_UPDATE", rowId, step });
  },

  setSequencerGrid: (grid) => set({ sequencerGrid: grid }),

  addPianoNote: (note) => set((state) => ({ 
    pianoRollNotes: [...state.pianoRollNotes, note] 
  })),

  removePianoNote: (id) => set((state) => ({
    pianoRollNotes: state.pianoRollNotes.filter(n => n.id !== id)
  })),

  clearPianoNotes: () => set({ pianoRollNotes: [] }),

  // Persistence
  // Persistence
  saveProject: async () => {
    set({ isLoading: true });
    try {
        const state = get();
        
        // Save to DB
        // We save the raw editor state to make reloading easier
        const projectData = {
            sequencerGrid: state.sequencerGrid,
            pianoRollNotes: state.pianoRollNotes,
            synthPreset: state.synthPreset,
            trackSampleIds: state.trackSampleIds,
            barCount: state.project.barCount,
            notes: state.project.notes
        };

        await saveProjectToDb({
            id: state.project.id,
            name: state.project.name,
            bpm: state.project.bpm,
            createdAt: Date.now(), // Will be ignored by update
            updatedAt: Date.now(), // Updated
            data: JSON.stringify(projectData)
        });
        
        toast.success("Project saved successfully!");
    } catch (err) {
        console.error("Failed to save project:", err);
        toast.error("Failed to save project.");
    } finally {
        set({ isLoading: false });
    }
  },

  loadProject: async (id) => {
    set({ isLoading: true });
    try {
      const p = await getProjectFromDb(id);
      if (p) {
        const data = JSON.parse(p.data);
        
        // Update state
        set({
            project: {
                id: p.id,
                name: p.name,
                bpm: p.bpm,
                barCount: data.barCount || 4, // Load barCount
                notes: data.notes || "" 
            },
            sequencerGrid: data.sequencerGrid || INITIAL_GRID,
            pianoRollNotes: data.pianoRollNotes || [],
            synthPreset: data.synthPreset || "basic",
            trackSampleIds: data.trackSampleIds || {},
            trackSamples: {} // Will fill below
        });

        // 2. Load samples from DB
        if (data.trackSampleIds) {
             const newTrackSamples: Record<string, string> = {};
             
             await Promise.all(Object.entries(data.trackSampleIds as Record<string, string>).map(async ([trackId, sampleId]) => {
                 const sample = await getSample(sampleId);
                 if (sample && sample.data) {
                     const url = URL.createObjectURL(sample.data);
                     newTrackSamples[trackId] = url;
                     
                     // Helper: Pre-load player
                     const player = await getSampler(url);
                     trackPlayers[trackId] = player;
                 }
             }));
             
             set((s) => ({ trackSamples: { ...s.trackSamples, ...newTrackSamples } }));
        }
        
        // Sync Audio Engine
        setGlobalBpm(p.bpm);
        if (globalSynth && globalEffects && data.synthPreset) {
            globalSynth.disconnect();
            globalSynth.dispose();
            globalSynth = createSynth(data.synthPreset);
            globalSynth.connect(globalEffects.delay);
        }
      }
    } catch (e) {
      console.error("Failed to load project", e);
    }
    set({ isLoading: false });
  },

  loadDemoProject: () => {
    set({
        project: { id: generateId(), name: "Demo Project", bpm: 128, barCount: 2, notes: "" },
        sequencerGrid: INITIAL_GRID,
        pianoRollNotes: [],
        synthPreset: "basic",
        trackSampleIds: {},
        trackSamples: {}
    });
    setGlobalBpm(128);
  },

  playNote: (note, duration = "8n") => {
    const { isAudioInitialized, initializeAudio } = get();
    if (!isAudioInitialized) {
      initializeAudio().then(() => {
        if (globalSynth) globalSynth.triggerAttackRelease(note, duration);
      });
      return;
    }
    if (globalSynth) globalSynth.triggerAttackRelease(note, duration);
  },

  playTrack: (trackId) => {
    const { isAudioInitialized, initializeAudio } = get();
    if (!isAudioInitialized) { // Auto-init if needed
        initializeAudio().then(() => get().playTrack(trackId));
        return;
    }

    // 1. Try playing sample
    if (trackPlayers[trackId]) {
        if (trackPlayers[trackId].loaded) {
            trackPlayers[trackId].start();
        }
        return;
    }

    // 2. Fallback to default synth note
    const row = ROWS.find(r => r.id === trackId);
    if (row && globalSynth) {
        globalSynth.triggerAttackRelease(row.note, "16n");
    }
  },

  triggerAttack: (note) => {
    const { isAudioInitialized, initializeAudio } = get();
    if (!isAudioInitialized) {
      initializeAudio().then(() => {
        if (globalSynth) globalSynth.triggerAttack(note);
      });
      return;
    }
    if (globalSynth) globalSynth.triggerAttack(note);
  },

  triggerRelease: (note) => {
    if (globalSynth) globalSynth.triggerRelease(note);
  },

  exportAudio: async () => {
    const state = get();
    // Validate
    if (state.pianoRollNotes.length === 0 && Object.values(state.sequencerGrid).every(row => row.every(s => !s))) {
        toast.error("Project is empty! Add some notes first.");
        return;
    }

    set({ isLoading: true });
    try {
        const blob = await exportProjectToWav({
            project: state.project,
            sequencerGrid: state.sequencerGrid,
            pianoRollNotes: state.pianoRollNotes,
            synthPreset: state.synthPreset,
            mixer: state.mixer,
            trackSamples: state.trackSamples
        });
        
        // Trigger Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.project.name || 'project'}.wav`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Export failed", e);
        throw e;
    } finally {
        set({ isLoading: false });
    }
  },

  importSample: async (trackId, file) => {
      set({ isLoading: true });
      try {
          const id = generateId();
          const buffer = await file.arrayBuffer();
          const blob = new Blob([buffer], { type: file.type });
          
          await saveSample({
              id,
              name: file.name,
              data: blob,
              mimeType: file.type,
              createdAt: Date.now()
          });

          // Create object URL for immediate use
          const url = URL.createObjectURL(blob);
          
          set(state => ({
              trackSampleIds: { ...state.trackSampleIds, [trackId]: id },
              trackSamples: { ...state.trackSamples, [trackId]: url }
          }));

          // Load into audio engine immediately
          const player = await getSampler(url);
          trackPlayers[trackId] = player;
          
          console.log(`Sample imported for ${trackId}: ${url}`);
      } catch (e) {
          console.error("Import failed", e);
      } finally {
          set({ isLoading: false });
      }
  },

  // Looper Implementations
  loopRecord: async (trackId) => {
      // Ensure audio init
      const { isAudioInitialized, initializeAudio } = get();
      if (!isAudioInitialized) await initializeAudio();
      
      initLooper();
      await startRecording();
      
      set(state => ({
          looper: { ...state.looper, [trackId]: { ...state.looper[trackId], state: "recording" } }
      }));
  },

  loopStopRecord: async (trackId) => {
      const url = await stopRecording(trackId);
      if (url) {
           set(state => ({
              looper: { ...state.looper, [trackId]: { ...state.looper[trackId], state: "stopped", url } }
          }));
      } else {
           // Failed?
           set(state => ({
              looper: { ...state.looper, [trackId]: { ...state.looper[trackId], state: "empty" } }
          }));
      }
  },

  loopPlay: (trackId) => {
      const track = get().looper[trackId];
      if (track.url) {
          audioPlayLoop(trackId);
          set(state => ({
              looper: { ...state.looper, [trackId]: { ...state.looper[trackId], state: "playing" } }
          }));
      }
  },

  loopStop: (trackId) => {
      audioStopLoop(trackId);
      set(state => ({
          looper: { ...state.looper, [trackId]: { ...state.looper[trackId], state: "stopped" } }
      }));
  },

  loopClear: (trackId) => {
      audioClearLoop(trackId);
      set(state => ({
          looper: { ...state.looper, [trackId]: { ...state.looper[trackId], state: "empty", url: undefined } }
      }));
  },

  loopVolume: (trackId, val) => {
      setLoopVolume(trackId, val);
       set(state => ({
          looper: { ...state.looper, [trackId]: { ...state.looper[trackId], volume: val } }
      }));
  },

  loopMute: (trackId) => {
      const muted = !get().looper[trackId].muted;
      muteLoop(trackId, muted);
      set(state => ({
          looper: { ...state.looper, [trackId]: { ...state.looper[trackId], muted } }
      }));
  }
}));
