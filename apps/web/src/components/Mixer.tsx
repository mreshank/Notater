import { useStore, MixerChannel } from "@/lib/store";
import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";

export function Mixer() {
    const {
        mixer,
        setTrackVolume,
        setTrackPan,
        toggleTrackMute,
        toggleTrackSolo,
        importSample
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
        <div className="flex flex-col h-full bg-background/50 p-4 rounded-xl border border-border backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight text-foreground">Mixer Console</h2>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse"></div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Master Output</div>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto custom-scrollbar">
                <div className="flex h-full gap-2 md:gap-4 items-end justify-center pb-2 min-w-max mx-auto">
                    {channels.map((channel) => (
                        <ChannelStrip
                            key={channel.id}
                            channel={channel}
                            setVolume={(v) => setTrackVolume(channel.id, v)}
                            setPan={(p) => setTrackPan(channel.id, p)}
                            toggleMute={() => toggleTrackMute(channel.id)}
                            toggleSolo={() => toggleTrackSolo(channel.id)}
                            onImport={() => handleImportClick(channel.id)}
                            isSynth={channel.id === "melodic"}
                        />
                    ))}
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
            </div>
        </div>
    );
}

function ChannelStrip({
    channel,
    setVolume,
    setPan,
    toggleMute,
    toggleSolo,
    onImport,
    isSynth
}: {
    channel: MixerChannel;
    setVolume: (v: number) => void;
    setPan: (p: number) => void;
    toggleMute: () => void;
    toggleSolo: () => void;
    onImport: () => void;
    isSynth: boolean;
}) {
    return (
        <div className="flex flex-col items-center gap-3 p-3 bg-card rounded-lg border border-border w-20 md:w-24 h-[calc(100%-2rem)] shadow-sm relative group hover:border-primary/50 transition-colors">
            {/* Label */}
            <div className="w-full text-center border-b border-border pb-2 mb-1 flex flex-col items-center">
                <div className="text-xs font-bold uppercase truncate w-full text-primary tracking-wider">{channel.name}</div>
                {!isSynth && (
                    <button
                        onClick={onImport}
                        className="mt-1 text-[8px] opacity-70 hover:opacity-100 hover:text-primary border border-border rounded px-1 flex items-center gap-1 transition-all"
                        title="Import Sample"
                    >
                        📂
                    </button>
                )}
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
                    className="w-full h-1 accent-primary cursor-pointer bg-muted rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
                    aria-label={`Pan for ${channel.name}`}
                />
            </div>

            {/* Volume Fader Area */}
            <div className="flex-1 w-full bg-muted/20 rounded-md relative flex items-center justify-center p-2">
                {/* Fader Track */}
                <div className="relative w-2 h-full bg-muted rounded-full overflow-hidden">
                    {/* Level Meter (Fake for now, just volume level) */}
                    <div
                        className={cn(
                            "absolute bottom-0 w-full transition-all duration-100 ease-out",
                            channel.muted ? "bg-muted-foreground/30" : "bg-primary"
                        )}
                        style={{ height: `${((channel.volume + 60) / 66) * 100}%` }}
                    />
                </div>

                {/* Invisible Vertical Range Input */}
                <input
                    type="range"
                    min="-60"
                    max="6"
                    step="0.1"
                    value={channel.volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize"
                    // Using rotate hack for vertical interaction if needed, but for "custom slider" behavior where you drag anywhere, a simple oversized input works if designed right,
                    // OR we map Y position.
                    // With generic input range, it's horizontal by default.
                    // Transform rotate is the standard way.
                    style={{
                        transform: 'rotate(-90deg)',
                        width: '30vh',
                        height: '60px',
                        // This centering is tricky without exact pixel values.
                        // Let's use the simpler 'appearance-slider-vertical' for WebKit if possible, otherwise rely on the rotation method which is standard.
                    }}
                    aria-label={`Volume for ${channel.name}`}
                />
                {/* We'll use a simpler layout for the input: make it size of container but rotated */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Handle Visual */}
                    <div
                        className="w-8 h-4 bg-card border-2 border-primary rounded shadow-md z-10 box-border transition-all duration-75"
                        style={{
                            position: 'absolute',
                            bottom: `${((channel.volume + 60) / 66) * 100}%`,
                            marginBottom: '-8px' // Half height
                        }}
                    >
                        <div className="w-full h-px bg-primary/50 mt-[7px]"></div>
                    </div>
                </div>

                {/* The actual input needs to be better positioned for interaction */}
                <input
                    type="range"
                    min="-60"
                    max="6"
                    step="0.1"
                    value={channel.volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="absolute w-[200px] h-[60px] opacity-0 cursor-pointer"
                    style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center',
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
                            ? "bg-destructive text-destructive-foreground border-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                            : "bg-muted/50 hover:bg-muted text-muted-foreground border-transparent"
                    )}
                >
                    MUTE
                </button>
                <button
                    onClick={toggleSolo}
                    className={cn(
                        "flex-1 py-1.5 text-[10px] font-bold rounded border transition-colors hover:scale-105 active:scale-95",
                        channel.solo
                            ? "bg-yellow-500 text-yellow-950 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                            : "bg-muted/50 hover:bg-muted text-muted-foreground border-transparent"
                    )}
                >
                    SOLO
                </button>
            </div>
        </div>
    );
}
