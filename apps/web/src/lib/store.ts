import { create } from "zustand";
import { Track, Step } from "notater";
import * as Tone from "tone";
import { 
  initAudio, 
  setBpm as setGlobalBpm,
  startTransport,
  stopTransport,
  createSynth,
  createMinimalChain,
  type SynthPreset,
} from "./audio";
import { 
  saveProject as saveProjectToDb, 
  getProject as getProjectFromDb,
  generateId, 
} from "./db";
import { exportProjectToWav } from "./audio/export";
import { getSampler } from "./audio/sampler";
import { StoredSample, saveSample, getSample } from "./db";
import { p2p } from "./p2p";

// Types
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
}

// Global synth instance (lazy initialized)
let globalSynth: Tone.PolySynth | null = null;
let globalEffects: ReturnType<typeof createMinimalChain> | null = null;
const trackPlayers: Record<string, Tone.Player> = {};

interface AppState {
  // Core Data
  project: {
    id: string;
    name: string;
    bpm: number;
  };

  // Editor State
  sequencerGrid: Record<string, boolean[]>;
  pianoRollNotes: Note[];
  mixer: Record<string, MixerChannel>;
  trackSampleIds: Record<string, string>; // trackId -> sampleId (Persistent)
  trackSamples: Record<string, string>; // trackId -> blob URL (Ephemeral)

  // UI State
  isPlaying: boolean;
  isAudioInitialized: boolean;
  currentStep: number; // Current playback step (0-15)
  activeView: "pianoroll" | "pads" | "sequencer" | "piano" | "mix";
  theme: "lofi" | "cyber" | "neo";
  synthPreset: SynthPreset;
  isLoading: boolean;

  // Actions
  initializeAudio: () => Promise<void>;
  togglePlay: () => void;
  setBpm: (bpm: number) => void;
  setTheme: (theme: "lofi" | "cyber" | "neo") => void;
  setSynthPreset: (preset: SynthPreset) => void;

  // Mixer Actions
  setTrackVolume: (trackId: string, volume: number) => void;
  setTrackPan: (trackId: string, pan: number) => void;
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
        solo: false
    };
});

// Add melodic track to mixer
INITIAL_MIXER["melodic"] = {
    id: "melodic",
    name: "SYNTH",
    volume: -6,
    pan: 0,
    muted: false,
    solo: false
};


export const useStore = create<AppState>((set, get) => ({
  project: {
    id: generateId(),
    name: "Untitled Vibes",
    bpm: 120,
  },
  sequencerGrid: INITIAL_GRID,
  pianoRollNotes: [],
  mixer: INITIAL_MIXER,
  trackSampleIds: {},
  trackSamples: {},
  
  isPlaying: false,
  currentStep: 0,
  isAudioInitialized: false,
  activeView: "sequencer",
  theme: "cyber",
  synthPreset: "basic",
  isLoading: false,

  initializeAudio: async () => {
    if (get().isAudioInitialized) return;
    try {
      await initAudio();
      globalEffects = createMinimalChain();
      globalSynth = createSynth(get().synthPreset);
      globalSynth.connect(globalEffects.reverb);
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

  setBpm: (bpm) => {
    setGlobalBpm(bpm);
    set((state) => ({ project: { ...state.project, bpm } }));
    p2p.broadcast({ type: "BPM", bpm });
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
      globalSynth.connect(globalEffects.reverb);
    }
    set({ synthPreset: preset });
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
  saveProject: async () => {
    set({ isLoading: true });
    const state = get();
    
    // Construct Pattern from editor state
    const tracks: Track[] = [];
    
    // 1. Drum Tracks
    ROWS.forEach(row => {
      const steps: Record<number, Step> = {};
      state.sequencerGrid[row.id].forEach((isActive, index) => {
        if (isActive) {
          steps[index] = {
            id: generateId(),
            index,
            type: "on",
            velocity: 0.8,
            duration: 0.25,
            microTiming: 0
          };
        }
      });
      
      tracks.push({
        id: row.id,
        length: 16,
        steps,
        instrument: {
          id: row.id,
          name: row.label,
          type: "sampler",
          source: row.note, // Storing note as source for now (simplified)
          volume: 0,
          pan: 0,
          muted: false,
          solo: false,
          color: row.color,
          effects: []
        }
      });
    });

    // 2. Melodic Track (Piano Roll)
    const melodicSteps: Record<number, Step> = {};
    state.pianoRollNotes.forEach(note => {
      melodicSteps[note.step] = {
        id: note.id,
        index: note.step,
        type: "on",
        velocity: 0.8,
        duration: note.duration * 0.25, // Convert steps to beats
        microTiming: 0,
        pitch: note.pitch
      };
    });

    tracks.push({
      id: "melodic",
      length: 16, // TODO: Dynamic length
      steps: melodicSteps,
      instrument: {
        id: "synth",
        name: "Main Synth",
        type: "synth",
        source: state.synthPreset,
        volume: 0,
        pan: 0,
        muted: false,
        solo: false,
        color: "#d946ef",
        effects: []
      }
    });

    // Save to DB
    const projectData = {
        sequencerGrid: state.sequencerGrid,
        pianoRollNotes: state.pianoRollNotes,
        synthPreset: state.synthPreset,
        trackSampleIds: state.trackSampleIds,
    };

    await saveProjectToDb({
      id: state.project.id,
      name: state.project.name,
      bpm: state.project.bpm,
      createdAt: Date.now(), // Will be ignored by update
      updatedAt: Date.now(),
      data: JSON.stringify(projectData)
    });
    
    set({ isLoading: false });
  },

  loadProject: async (id) => {
    set({ isLoading: true });
    try {
      const p = await getProjectFromDb(id);
      if (p) {
        const data = JSON.parse(p.data);
        
        // Update state
        set({
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
            globalSynth.connect(globalEffects.reverb);
        }
      }
    } catch (e) {
      console.error("Failed to load project", e);
    }
    set({ isLoading: false });
  },

  loadDemoProject: () => {
    set({
        project: { id: generateId(), name: "Demo Project", bpm: 128 },
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
        alert("Project is empty!"); 
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
        alert("Export failed. See console.");
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
  }
}));
