import { useStore, MixerChannel } from "@/lib/store";
import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { FolderOpen, Zap, Activity } from "lucide-react";

// ... (existing Mixer code) ...

interface KnobProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
    unit?: string;
    disabled?: boolean;
}

// Helper Knob Component (Simple range for now)
const Knob = ({ label, value, min, max, step, onChange, unit, disabled }: KnobProps) => (
    <div className={`space-y-1 ${disabled ? "opacity-50" : ""}`}>
        <div className="flex justify-between items-baseline">
            <span className="text-[9px] font-bold text-muted-foreground">{label}</span>
            <span className="text-[9px] font-mono opacity-70">{value}{unit || ""}</span>
        </div>
        <input
            type="range"
            min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-muted rounded-full cursor-pointer accent-primary"
            disabled={disabled}
        />
    </div>
);

export function Mixer() {
    const {
        mixer,
        setTrackVolume,
        setTrackPan,
        setTrackEQ,
        setTrackSend,
        toggleTrackMute,
        toggleTrackSolo,
        importSample,
        masterEffects,
        setMasterEffect
    } = useStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

    const handleImportClick = (trackId: string) => {
        setSelectedTrack(trackId);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && selectedTrack) {
            await importSample(selectedTrack, file);
            e.target.value = ""; // Reset
        }
    };

    // Define order consistently
    const order = ["kick", "snare", "hihat", "clap", "melodic"];
    const channels = order.map(id => mixer[id]).filter(Boolean);

    return (
        <div className="flex bg-background/50 h-full rounded-xl border border-border backdrop-blur-sm overflow-hidden">
            {/* Channels Section */}
            <div className="flex-1 flex flex-col p-4 border-r border-border min-w-0">
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Activity className="text-primary" /> Mixer
                    </h2>
                    <div className="flex items-center gap-2 px-3 py-1 bg-surface rounded-full border border-border">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <div className="text-[10px] uppercase tracking-widest font-mono font-bold text-muted-foreground">Output</div>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto custom-scrollbar">
                    <div className="flex h-full gap-2 md:gap-4 items-end pb-2 mx-auto w-max">
                        {channels.map((channel) => (
                            <ChannelStrip
                                key={channel.id}
                                channel={channel}
                                setVolume={(v) => setTrackVolume(channel.id, v)}
                                setPan={(p) => setTrackPan(channel.id, p)}
                                setEQ={(band, v) => setTrackEQ(channel.id, band, v)}
                                setSend={(type, v) => setTrackSend(channel.id, type, v)}
                                toggleMute={() => toggleTrackMute(channel.id)}
                                toggleSolo={() => toggleTrackSolo(channel.id)}
                                onImport={() => handleImportClick(channel.id)}
                                isSynth={channel.id === "melodic"}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Master FX Rack */}
            <div className="w-80 flex flex-col bg-zinc-950/30 shrink-0 border-l border-border">
                <div className="p-3 border-b border-border bg-zinc-900/50">
                    <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                        <Zap size={16} className="text-yellow-500" /> MASTER RACK
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
                    {/* Dynamics */}
                    <div className="space-y-2 p-3 bg-zinc-900/40 rounded-lg border border-border/50">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div> DYNAMICS
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Knob label="THRESH" value={masterEffects.compressorThresh} min={-60} max={0} step={1} onChange={(v: number) => setMasterEffect("compressorThresh", v)} unit="dB" />
                            <Knob label="RATIO" value={masterEffects.compressorRatio} min={1} max={20} step={0.5} onChange={(v: number) => setMasterEffect("compressorRatio", v)} unit=":1" />
                        </div>
                    </div>

                    {/* Color / Filter */}
                    <div className="space-y-2 p-3 bg-zinc-900/40 rounded-lg border border-border/50">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div> COLOR & FILTER
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <Knob label="CRUSH" value={masterEffects.bitCrusherBits} min={1} max={16} step={1} onChange={(v: number) => setMasterEffect("bitCrusherBits", v)} unit="bit" />
                            <Knob label="WET" value={masterEffects.bitCrusherWet} min={0} max={1} step={0.05} onChange={(v: number) => setMasterEffect("bitCrusherWet", v)} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2">
                                <label className="text-[9px] text-muted-foreground font-bold mb-1 block">CUTOFF</label>
                                <input
                                    type="range"
                                    min="20" max="20000" step="100"
                                    value={masterEffects.filterFreq}
                                    onChange={(e) => setMasterEffect("filterFreq", parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-muted rounded-full cursor-pointer accent-orange-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Modulation */}
                    <div className="space-y-2 p-3 bg-zinc-900/40 rounded-lg border border-border/50">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div> MODULATION
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Knob label="DEPTH" value={masterEffects.chorusDepth} min={0} max={1} step={0.05} onChange={(v: number) => setMasterEffect("chorusDepth", v)} />
                            <Knob label="MIX" value={masterEffects.chorusWet} min={0} max={1} step={0.05} onChange={(v: number) => setMasterEffect("chorusWet", v)} />
                        </div>
                    </div>

                    {/* Space */}
                    <div className="space-y-2 p-3 bg-zinc-900/40 rounded-lg border border-border/50">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div> SPACE
                        </div>
                        {/* Delay */}
                        <div className="grid grid-cols-3 gap-1 mb-3">
                            <Knob label="D.TIME" value={0} min={0} max={0} step={0} onChange={() => { }} unit="1/8" disabled />
                            <Knob label="F.BACK" value={masterEffects.feedback} min={0} max={0.9} step={0.05} onChange={(v: number) => setMasterEffect("feedback", v)} />
                            <Knob label="D.MIX" value={masterEffects.delayWet} min={0} max={1} step={0.05} onChange={(v: number) => setMasterEffect("delayWet", v)} />
                        </div>
                        {/* Reverb */}
                        <div className="border-t border-border/30 pt-2">
                            <Knob label="REVERB MIX" value={masterEffects.reverbWet} min={0} max={1} step={0.05} onChange={(v: number) => setMasterEffect("reverbWet", v)} />
                        </div>
                    </div>

                </div>
            </div>

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="audio/*"
                onChange={handleFileChange}
                aria-label="Import Audio Sample"
            />
        </div>
    );
}

function ChannelStrip({
    channel,
    setVolume,
    setPan,
    setEQ,
    setSend,
    toggleMute,
    toggleSolo,
    onImport,
    isSynth
}: {
    channel: MixerChannel;
    setVolume: (v: number) => void;
    setPan: (p: number) => void;
    setEQ: (band: "low" | "mid" | "high", v: number) => void;
    setSend: (type: "reverb" | "delay", v: number) => void;
    toggleMute: () => void;
    toggleSolo: () => void;
    onImport: () => void;
    isSynth: boolean;
}) {
    return (
        <div className="flex flex-col items-center gap-3 p-3 bg-card rounded-lg border border-border w-28 md:w-24 h-[95%] shadow-sm relative group hover:border-primary/50 transition-colors shrink-0">
            {/* Label */}
            <div className="w-full text-center border-b border-border pb-2 mb-1 flex justify-between items-center">
                <div className="text-xs font-bold uppercase truncate w-full text-primary tracking-wider">{channel.name}</div>
                {!isSynth && (
                    <button
                        onClick={onImport}
                        className="text-[8px] opacity-70 hover:opacity-100 hover:text-primary flex items-center gap-1 transition-all"
                        title="Import Sample"
                    >
                        <FolderOpen size={12} />
                    </button>
                )}
            </div>

            {/* Aux Sends */}
            <div className="flex w-full gap-1">
                <div className="flex-1 flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full border border-blue-500/30 flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 transform"
                            style={{ transform: `rotate(${(channel.sends.reverb * 270) - 135}deg)` }}></div>
                        <input type="range" min="0" max="1" step="0.1" value={channel.sends.reverb}
                            onChange={(e) => setSend("reverb", parseFloat(e.target.value))}
                            className="absolute inset-0 opacity-0 cursor-pointer" title="Reverb Send" />
                    </div>
                    <span className="text-[7px] font-mono text-muted-foreground mt-0.5">REV</span>
                </div>
                <div className="flex-1 flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full border border-purple-500/30 flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 transform"
                            style={{ transform: `rotate(${(channel.sends.delay * 270) - 135}deg)` }}></div>
                        <input type="range" min="0" max="1" step="0.1" value={channel.sends.delay}
                            onChange={(e) => setSend("delay", parseFloat(e.target.value))}
                            className="absolute inset-0 opacity-0 cursor-pointer" title="Delay Send" />
                    </div>
                    <span className="text-[7px] font-mono text-muted-foreground mt-0.5">DLY</span>
                </div>
            </div>

            {/* Pan Knob */}
            <div className="w-full flex flex-col items-center gap-1 my-1">
                <div className="flex justify-between w-full px-1">
                    <span className="text-[9px] text-muted-foreground font-mono">L</span>
                    <span className="text-[9px] text-muted-foreground font-mono">PAN</span>
                    <span className="text-[9px] text-muted-foreground font-mono">R</span>
                </div>
                <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={channel.pan}
                    onChange={(e) => setPan(parseFloat(e.target.value))}
                    className="w-full h-1 accent-primary cursor-pointer bg-white/50 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
                    aria-label={`Pan for ${channel.name}`}
                />
            </div>

            {/* EQ Section */}
            <div className="w-full flex flex-col gap-1 bg-muted/30 p-1.5 rounded border border-border/50">
                <div className="text-[8px] font-bold text-center text-muted-foreground tracking-widest mb-0.5">EQ</div>
                <div className="flex justify-between items-end h-16 gap-1">
                    {/* Low */}
                    <div className="flex flex-col items-center flex-1 gap-1 h-full">
                        <div className="flex-1 w-1.5 bg-white/50 rounded-full relative">
                            <div
                                className="absolute bottom-0 w-full bg-blue-500 rounded-full opacity-50"
                                style={{ height: `${((channel.eq.low + 12) / 24) * 100}%` }}
                            />
                            <input
                                type="range"
                                min="-12" max="12" step="1"
                                value={channel.eq.low}
                                onChange={(e) => setEQ("low", parseFloat(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize"
                                title={`Low: ${channel.eq.low}dB`}
                            />
                        </div>
                        <span className="text-[7px] font-mono text-muted-foreground">LO</span>
                    </div>
                    {/* Mid */}
                    <div className="flex flex-col items-center flex-1 gap-1 h-full">
                        <div className="flex-1 w-1.5 bg-white/50 rounded-full relative">
                            <div
                                className="absolute bottom-0 w-full bg-green-500 rounded-full opacity-50"
                                style={{ height: `${((channel.eq.mid + 12) / 24) * 100}%` }}
                            />
                            <input
                                type="range"
                                min="-12" max="12" step="1"
                                value={channel.eq.mid}
                                onChange={(e) => setEQ("mid", parseFloat(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize"
                                title={`Mid: ${channel.eq.mid}dB`}
                            />
                        </div>
                        <span className="text-[7px] font-mono text-muted-foreground">MID</span>
                    </div>
                    {/* High */}
                    <div className="flex flex-col items-center flex-1 gap-1 h-full">
                        <div className="flex-1 w-1.5 bg-white/50 rounded-full relative">
                            <div
                                className="absolute bottom-0 w-full bg-orange-500 rounded-full opacity-50"
                                style={{ height: `${((channel.eq.high + 12) / 24) * 100}%` }}
                            />
                            <input
                                type="range"
                                min="-12" max="12" step="1"
                                value={channel.eq.high}
                                onChange={(e) => setEQ("high", parseFloat(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize"
                                title={`High: ${channel.eq.high}dB`}
                            />
                        </div>
                        <span className="text-[7px] font-mono text-muted-foreground">HI</span>
                    </div>
                </div>
            </div>

            {/* Volume Fader Area */}
            <div className="flex-1 w-full bg-muted/20 rounded-md relative flex items-center justify-center p-2">
                {/* Fader Track */}
                <div className="relative w-2 h-full bg-white/50 rounded-full overflow-hidden">
                    {/* Level Meter (Fake for now, just volume level) */}
                    <div
                        className={cn(
                            "absolute bottom-0 w-full transition-all duration-100 ease-out",
                            channel.muted ? "bg-muted-foreground/30" : "bg-primary"
                        )}
                        style={{ height: `${((channel.volume + 60) / 66) * 100}%` }}
                    />
                </div>

                {/* Vertical Range Input Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* The Handle */}
                    <div
                        className="w-8 h-4 bg-card border-2 border-primary rounded shadow-md z-10 box-border transition-all duration-75"
                        style={{
                            position: 'absolute',
                            bottom: `${Math.max(0, Math.min(100, ((channel.volume + 60) / 66) * 100))}%`,
                            marginBottom: '-8px' // Center handle
                        }}
                    >
                        <div className="w-full h-px bg-primary/50 mt-[7px]"></div>
                    </div>
                </div>

                {/* The actual input */}
                <input
                    type="range"
                    min="-60"
                    max="6"
                    step="0.1"
                    value={channel.volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize"
                    // Standard way to make vertical slider without transform mess if supported, but transform is safer for cross-browser visual
                    style={{
                        appearance: 'none',
                        // Rotate to match vertical movement to value
                        transform: 'rotate(-90deg) translateX(0%)', // Rotate 90 deg?
                        // Actually, keeping it as a huge box that captures clicks and using custom logic is hard with just input type=range default.
                        // Best approach for CSS-only vertical slider:
                        width: '150px', // taller than wide
                        height: '40px',
                        top: '50%',
                        left: '50%',
                        marginTop: '-20px',
                        marginLeft: '-75px',
                        // This is getting hacky. Let's trust the previous implementation or simple rotation.
                        // Previous implementation used rotation. Let's stick to that but ensure it maps correctly.
                    }}
                    aria-label={`Volume for ${channel.name}`}
                />
            </div>

            <div className="text-[10px] font-mono tabular-nums text-muted-foreground font-bold">{channel.volume > -60 ? `${channel.volume.toFixed(1)} dB` : '-inf'}</div>

            {/* Mute/Solo */}
            <div className="flex gap-2 w-full mt-2">
                <button
                    onClick={toggleMute}
                    className={cn(
                        "flex-1 py-1.5 text-[10px] font-bold rounded border transition-colors hover:scale-105 active:scale-95",
                        channel.muted
                            ? "bg-destructive text-destructive-foreground border-destructive"
                            : "bg-muted/50 hover:bg-white/50 text-muted-foreground border-transparent"
                    )}
                >
                    M
                </button>
                <button
                    onClick={toggleSolo}
                    className={cn(
                        "flex-1 py-1.5 text-[10px] font-bold rounded border transition-colors hover:scale-105 active:scale-95",
                        channel.solo
                            ? "bg-yellow-500 text-yellow-950 border-yellow-500"
                            : "bg-muted/50 hover:bg-white/50 text-muted-foreground border-transparent"
                    )}
                >
                    S
                </button>
            </div>
        </div>
    );
}


