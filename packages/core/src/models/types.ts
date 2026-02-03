export interface Note { id: string; pitch: string; step: number; duration: number; }
export interface Collaborator { id: string; name: string; color: string; isHost?: boolean; }

export type StepType = 'on' | 'off';
export interface Step {
    id: string;
    index: number;
    type: StepType;
    velocity: number;
    duration: number;
    microTiming: number;
}

export interface Instrument {
    id: string;
    name: string;
    type: 'synth' | 'sampler' | 'drum';
    source: string;
    volume: number;
    pan: number;
    muted: boolean;
    solo: boolean;
    color: string;
    effects?: any[]; // refine later
}

export interface Track {
    id: string;
    instrument: Instrument;
    steps: Record<number, Step>;
    length: number;
    mute?: boolean;
    solo?: boolean;
    volume?: number;
}

export interface Pattern {
    id: string;
    name: string;
    tracks: Track[];
    bars: number;
}
