import { create } from "zustand";
import { toast } from "sonner";
import { 
  initAudio, 
  setBpm as setGlobalBpm,
  startTransport,
  stopTransport,
  createSynth,
  createEffectsChain,
  type SynthPreset,
  applyPreset,
  mixer,
  setDrumKit,
  type DrumKit,
  getDrumFromPitch,
  playDrum,
  initLooper, 
  startRecording, 
  stopRecording, 
  playLoop as audioPlayLoop, 
  stopLoop as audioStopLoop, 
  clearLoop as audioClearLoop, 
  setLoopVolume, 
  muteLoop,
  exportProjectToWav,
  getSampler,
  Tone,
  p2p,
  saveProject as saveProjectToDb, 
  getProject as getProjectFromDb,
  generateId,
  saveSample, 
  getSample,
  type Note,
  type Collaborator,
} from "@notater/core";

// SynthParams can stay if not in core, or move it. Core has types?
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

// Note: MixerChannel comes from core now (if exported from mixer.ts)
// But mixer.ts in core exported `ChannelStrip` (Tone nodes), not the State interface.
// State interface `MixerChannel` was defined in Store. We should keep it here or move types to core/models.
// For now, re-define or keep if not in core.
// Note: MixerChannel type for UI state
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
let globalEffects: ReturnType<typeof createEffectsChain> | null = null; // createEffectsChain return type?
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
      masterEQ: {
        low: number;
        mid: number;
        high: number;
      };
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
  pianoRollInstrument: "synth" | "drums";
  activeDrumKit: DrumKit;
  looper: Record<string, LoopTrack>;
  collaborators: Collaborator[]; // P2P Presence
  
  
  // Actions
  setSynthParam: <K extends keyof SynthParams>(param: K, value: SynthParams[K]) => void;
  isLoading: boolean;
  currentTool: "pointer" | "pencil" | "eraser";

  // Actions
  initializeAudio: () => Promise<void>;
  togglePlay: () => void;
  toggleRecord: () => void;
  setBpm: (bpm: number) => void;
  setBarCount: (barCount: number) => void;
  setProjectName: (name: string) => void;
  setProjectNotes: (notes: string) => void;
  setTool: (tool: "pointer" | "pencil" | "eraser") => void;
  
  // Settings
  setTheme: (theme: "lofi" | "cyber" | "neo" | "forest" | "ocean" | "sunset" | "midnight") => void;
  setSynthPreset: (preset: SynthPreset) => void;
  setPianoRollInstrument: (instrument: "synth" | "drums") => void;
  setActiveDrumKit: (kit: DrumKit) => void;
  setMasterEffect: (field: string, value: number | string) => void;

  // Mixer Actions
  setTrackVolume: (trackId: string, volume: number) => void;
  setTrackPan: (trackId: string, pan: number) => void;
  setTrackEQ: (trackId: string, band: "low" | "mid" | "high", value: number) => void;
  setTrackSend: (trackId: string, type: "reverb" | "delay", value: number) => void;
  toggleTrackMute: (trackId: string, forceValue?: boolean) => void;
  toggleTrackSolo: (trackId: string) => void;
  
  // Editor Actions
  toggleSequencerStep: (rowId: string, step: number, forceValue?: boolean) => void;
  setSequencerGrid: (grid: Record<string, boolean[]>) => void;
  addPianoNote: (note: Note) => void;
  removePianoNote: (id: string) => void;
  clearPianoNotes: () => void;
  
  // Presence Actions
  addCollaborator: (user: Collaborator) => void;
  removeCollaborator: (id: string) => void;
  setCollaborators: (users: Collaborator[]) => void;

  // Persistence
  saveProject: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  loadDemoProject: () => void;
  
  // Synth Actions
  playNote: (note: string, duration?: string) => void;
  setAction: (action: string) => void; 
  setMasterEQ: (band: "low" | "mid" | "high", value: number) => void;
  // setMasterEffect removed from here (duplicate)
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
    name: "Notater Vibes",
    bpm: 120,
    barCount: 2,
    notes: ""
  },
  collaborators: [],
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
    compressorRatio: 4,
    masterEQ: {
        low: 0,
        mid: 0,
        high: 0
    },
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
  pianoRollInstrument: "synth",
  activeDrumKit: "standard",
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
      mixer.setMasterChain(globalEffects); // Set master chain

      // Initialize Mixer Channels
      // 1. Synth
      const melChannel = mixer.createChannel("melodic", "SYNTH");
      
      // 2. Drums
      ROWS.forEach(row => {
          mixer.createChannel(row.id, row.label);
          // Apply initial state from store if needed
          const storedCh = get().mixer[row.id];
          if (storedCh) {
               mixer.setVolume(row.id, storedCh.volume);
               mixer.setPan(row.id, storedCh.pan);
               mixer.setMute(row.id, storedCh.muted);
          }
      });
      // Also apply for melodic
      const storedMel = get().mixer["melodic"];
      if (storedMel) {
           mixer.setVolume("melodic", storedMel.volume);
           mixer.setPan("melodic", storedMel.pan);
           mixer.setMute("melodic", storedMel.muted);
      }

      globalSynth = createSynth(get().synthPreset);
      // Connect synth to Mixer Channel Input instead of dragging it through effects manually
      // globalEffects is now handled by mixer.setMasterChain
      globalSynth.connect(melChannel.input); 
      
       setGlobalBpm(get().project.bpm);
        
       // Ensure drum kit is set
       setDrumKit(get().activeDrumKit);

       set({ isAudioInitialized: true });
       console.log("🎹 Synth & Mixer initialized");
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

  toggleRecord: async () => {
      const wasRecording = get().isRecording;
      
      if (wasRecording) {
          // Stop Recording
          set({ isRecording: false });
          const blob = await mixer.stopRecording();
          const url = URL.createObjectURL(blob);
          
          // Auto-download
          const anchor = document.createElement("a");
          anchor.download = `recording-${new Date().toISOString()}.webm`; // Tone Record defaults to webm
          anchor.href = url;
          anchor.click();
      } else {
          // Start Recording
          await mixer.startRecording();
          set({ isRecording: true });
      }
  },

  setProjectName: (name) => {
      set(state => ({ project: { ...state.project, name } }));
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
    if (globalSynth) {
      // Apply preset to existing synth
      applyPreset(globalSynth, preset);
    } else {
       // Should not happen if initialized, but fall back
       // (Lazy init will handle it later if null)
    }
    set({ synthPreset: preset });
  },

  setPianoRollInstrument: (instrument) => {
      set({ pianoRollInstrument: instrument });
  },

  setActiveDrumKit: (kit) => {
      setDrumKit(kit);
      set({ activeDrumKit: kit });
  },

  setMasterEffect: (field, value) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, [field]: value }
    }));
    
    // Update audio engine
    if (globalEffects) {
        const numVal = typeof value === 'number' ? value : 0;
        
        // Reverb
        if (field === "reverbWet" && globalEffects.reverb) globalEffects.reverb.wet.value = numVal;
        
        // Delay
        else if (field === "delayWet" && globalEffects.delay) globalEffects.delay.wet.value = numVal;
        else if (field === "feedback" && globalEffects.delay) globalEffects.delay.feedback.value = numVal;
        else if (field === "delayTime" && globalEffects.delay) {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             globalEffects.delay.delayTime.value = value as any; 
        }
        
        // BitCrusher
        else if (field === "bitCrusherBits" && globalEffects.bitCrusher) {
            // Use set for read-only properties or signals
            globalEffects.bitCrusher.set({ bits: numVal });
        }
        else if (field === "bitCrusherWet" && globalEffects.bitCrusher) globalEffects.bitCrusher.wet.value = numVal;
        
        // Chorus
        else if (field === "chorusDepth" && globalEffects.chorus) {
             globalEffects.chorus.depth = numVal; 
        }
        else if (field === "chorusWet" && globalEffects.chorus) globalEffects.chorus.wet.value = numVal;
        
        // Filter
        else if (field === "filterFreq" && globalEffects.filter) globalEffects.filter.frequency.value = numVal;
        else if (field === "filterRes" && globalEffects.filter) globalEffects.filter.Q.value = numVal;
        
        // Compressor
        else if (field === "compressorThresh" && globalEffects.compressor) globalEffects.compressor.threshold.value = numVal;
        else if (field === "compressorRatio" && globalEffects.compressor) globalEffects.compressor.ratio.value = numVal;

        // Limiter
        else if (field === "limiterThresh" && globalEffects.limiter) globalEffects.limiter.threshold.value = numVal;

        // Distortion
        else if (field === "distortion" && globalEffects.distortion) globalEffects.distortion.distortion = numVal;
        else if (field === "distortionWet" && globalEffects.distortion) globalEffects.distortion.wet.value = numVal;
    }
    
    p2p.broadcast({ type: "MASTER_FX_UPDATE", field, value });
  },

  setMasterEQ: (band, value) => {
      set((state) => ({
          masterEffects: {
              ...state.masterEffects,
              masterEQ: {
                  ...state.masterEffects.masterEQ,
                  [band]: value
              }
          }
      }));

      if (globalEffects && globalEffects.eq) {
          globalEffects.eq[band].value = value;
      }
      
      p2p.broadcast({ type: "MASTER_FX_UPDATE", effect: "eq", param: band, value });
  },
  
  setSynthParam: (param, value) => {
    set(state => ({ synthParams: { ...state.synthParams, [param]: value } }));
    
    if (globalSynth) {
        if (param === "oscillatorType") {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             globalSynth.set({ oscillator: { type: value as any } });
        } else if (["attack", "decay", "sustain", "release"].includes(param)) {
             // Grab fresh state for full envelope update
             const s = get().synthParams;
             globalSynth.set({ envelope: { attack: s.attack, decay: s.decay, sustain: s.sustain, release: s.release } });
        } else if (param === "detune") {
             globalSynth.set({ detune: value as number });
        }
    }
  },

  // Mixer Actions
  setTrackVolume: (trackId, volume) => {
    mixer.setVolume(trackId, volume); // Update Audio
    set((state) => ({
        mixer: {
            ...state.mixer,
            [trackId]: { ...state.mixer[trackId], volume }
        }
    }));
    p2p.broadcast({ type: "MIXER_UPDATE", trackId, field: "volume", value: volume });
  },

  setTrackPan: (trackId, pan) => {
    mixer.setPan(trackId, pan); // Update Audio
    set((state) => ({
        mixer: {
            ...state.mixer,
            [trackId]: { ...state.mixer[trackId], pan }
        }
    }));
    p2p.broadcast({ type: "MIXER_UPDATE", trackId, field: "pan", value: pan });
  },

  setTrackEQ: (trackId, band, value) => {
    mixer.setEQ(trackId, band, value); // Update Audio
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
    mixer.setSend(trackId, type, value); // Update Audio
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

  toggleTrackMute: (trackId, forceValue) => {
    set((state) => {
        const newMuted = forceValue !== undefined ? forceValue : !state.mixer[trackId].muted;
        mixer.setMute(trackId, newMuted); 
        
        if (forceValue === undefined) {
            p2p.broadcast({ type: "MIXER_UPDATE", trackId, field: "muted", value: newMuted }); 
        }

        return {
            mixer: {
                ...state.mixer,
                [trackId]: { ...state.mixer[trackId], muted: newMuted }
            }
        };
    });
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
  toggleSequencerStep: (rowId, step, forceValue) => {
    set((state) => {
        const current = state.sequencerGrid[rowId][step];
        const next = forceValue !== undefined ? forceValue : !current;

        // Broadcast if this is a local user action (forceValue usually undefined from UI)
        // If forceValue IS defined, it might be from P2P. We need to avoid loops.
        // We will separate "receiveP2P" from "userAction".
        // For now, if called from UI (no forceValue), we broadcast the *result*.
        if (forceValue === undefined) {
             p2p.broadcast({ type: "SEQUENCER_UPDATE", rowId, step, value: next });
        }

        return {
            sequencerGrid: {
            ...state.sequencerGrid,
            [rowId]: state.sequencerGrid[rowId].map((val, i) => i === step ? next : val)
            }
        };
    });
  },

  setSequencerGrid: (grid) => set({ sequencerGrid: grid }),

  setAction: (action) => {
      console.log("Internal Action:", action);
      // Placeholder for generic actions if needed, or update project notes/status
  },

  addPianoNote: (note) => {
    set((state) => ({ 
      pianoRollNotes: [...state.pianoRollNotes, note] 
    }));
    p2p.broadcast({ type: "PIANOROLL_UPDATE", action: "add", note });
  },

  removePianoNote: (id) => {
    set((state) => ({
      pianoRollNotes: state.pianoRollNotes.filter(n => n.id !== id)
    }));
    p2p.broadcast({ type: "PIANOROLL_UPDATE", action: "remove", id });
  },

  clearPianoNotes: () => {
    set({ pianoRollNotes: [] });
    p2p.broadcast({ type: "PIANOROLL_UPDATE", action: "clear" });
  },

  // Presence Actions
  addCollaborator: (user) => set((state) => {
    if (state.collaborators.find(c => c.id === user.id)) return state;
    return { collaborators: [...state.collaborators, user] };
  }),
  removeCollaborator: (id) => set((state) => ({
    collaborators: state.collaborators.filter(c => c.id !== id)
  })),
  setCollaborators: (users) => set({ collaborators: users }),

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

        // 1.5 Load Drum Kit if present (or default)
        if (data.activeDrumKit) {
            setDrumKit(data.activeDrumKit);
            set({
                activeDrumKit: data.activeDrumKit,
                pianoRollInstrument: data.pianoRollInstrument || "synth"
            });
        }

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
            // Reconnect
             const melChannel = mixer.getChannel("melodic");
             if (melChannel) globalSynth.connect(melChannel.input);
        }

        // Broadcast change to peers
        p2p.broadcast({ 
            type: "FULL_SYNC", 
            data: {
                project: get().project,
                sequencerGrid: get().sequencerGrid,
                mixer: get().mixer,
                synthPreset: get().synthPreset,
                pianoRollNotes: get().pianoRollNotes,
                collaborators: get().collaborators
            }
        });
        p2p.broadcastLog(`Host loaded project: ${p.name}`);
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
    const state = get();
    if (state.pianoRollInstrument === "drums") {
        const drumType = getDrumFromPitch(note);
        playDrum(drumType);
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

// Initialize P2P Handler
p2p.setHandler({
    getState: () => {
        const state = useStore.getState();
        return {
            project: state.project,
            sequencerGrid: state.sequencerGrid,
            mixer: state.mixer,
            synthPreset: state.synthPreset,
            pianoRollNotes: state.pianoRollNotes,
            collaborators: state.collaborators
        };
    },
    setState: (data) => {
        // Apply state including UI state
        useStore.setState({ 
            project: data.project,
            sequencerGrid: data.sequencerGrid,
            mixer: data.mixer,
            synthPreset: data.synthPreset,
            pianoRollNotes: data.pianoRollNotes,
            collaborators: data.collaborators
        });

        const store = useStore.getState();
        
        // Sync Audio Engine to new State
        if (data.project.bpm) setGlobalBpm(data.project.bpm);
        if (data.synthPreset) store.setSynthPreset(data.synthPreset);
        
        // Mixer Sync (Apply to Audio Engine)
        Object.entries(data.mixer).forEach(([id, ch]) => {
             const mch = ch as MixerChannel;
             mixer.setVolume(id, mch.volume);
             mixer.setPan(id, mch.pan);
             mixer.setMute(id, mch.muted);
             mixer.setEQ(id, "low", mch.eq.low);
             mixer.setEQ(id, "mid", mch.eq.mid);
             mixer.setEQ(id, "high", mch.eq.high);
             // Sends might need direct access if mixer.setSend exists
             if (mixer.setSend) {
                  mixer.setSend(id, "reverb", mch.sends.reverb);
                  mixer.setSend(id, "delay", mch.sends.delay);
             }
        });
    },
    
    // Collaborator Events
    onCollaboratorJoin: (user) => useStore.getState().addCollaborator(user),
    onCollaboratorLeave: (id) => useStore.getState().removeCollaborator(id),
    onCollaboratorsUpdate: (users) => useStore.getState().setCollaborators(users),
    
    // State Updates
    onSequencerUpdate: (row, step, val) => useStore.getState().toggleSequencerStep(row, step, val !== undefined ? !!val : undefined),
    
    onMixerUpdate: (trackId, field, value) => {
       const store = useStore.getState();
       if (field === 'volume') store.setTrackVolume(trackId, value as number);
       if (field === 'pan') store.setTrackPan(trackId, value as number);
       if (field === 'muted') store.toggleTrackMute(trackId, value as boolean);
       if (field === 'solo') store.toggleTrackSolo(trackId);
       if (field.startsWith('eq-')) store.setTrackEQ(trackId, field.split('-')[1] as any, value as number);
       if (field.startsWith('send-')) store.setTrackSend(trackId, field.split('-')[1] as any, value as number);
    },
    
    onTransportUpdate: (playing) => {
         if (useStore.getState().isPlaying !== playing) useStore.getState().togglePlay();
    },
    
    onBpmUpdate: (bpm) => useStore.getState().setBpm(bpm),
    
    onMasterEffectUpdate: (field, effect, param, value) => {
        const store = useStore.getState();
        if (effect === 'eq') store.setMasterEQ(param as any, value as number);
        else if (field) store.setMasterEffect(field, value as string | number);
    },
    
    onPianoRollUpdate: (action, note, id) => {
        const store = useStore.getState();
        if (action === 'add' && note) store.addPianoNote(note);
        if (action === 'remove' && id) store.removePianoNote(id);
        if (action === 'clear') store.clearPianoNotes();
    },
    
    onLog: (msg, type) => {
        if (type === 'error') toast.error(msg);
        else if (type === 'success') toast.success(msg);
        else toast.info(msg);
    }
});
