import { useState, useRef } from "react";
import { useStore, LoopTrack } from "@/lib/store";
import { Mic, Play, Square, Trash2, Volume2, VolumeX, Repeat, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function LooperPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const { looper, loopRecord, loopStopRecord, loopPlay, loopStop, loopClear, loopVolume, loopMute } = useStore();

    const tracks = Object.values(looper);

    return (
        <>
            {/* Floating Toggle Button */}
            {isOpen ? null : <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-24 right-6 z-30 w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-colors bg-primary text-primary-foreground `}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Toggle Looper"
            >
                <Repeat size={20} />
            </motion.button>}

            {/* Sidebar Panel (Part of Layout) */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "auto", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="h-full border-l border-border bg-background/95 backdrop-blur-xl shadow-2xl z-40 bg-background flex flex-col overflow-hidden w-full sm:w-auto sm:max-w-md"
                    >
                        <div className="w-screen sm:w-80 h-full flex flex-col p-4">
                            <div className="flex items-center justify-between mb-6 mt-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                    Looper
                                </h2>
                                <div className="flex items-center gap-2">
                                    <X size={24} onClick={() => setIsOpen(false)} className="border border-border rounded-full p-1 cursor-pointer hover:bg-muted" />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-20">
                                {tracks.map((track) => (
                                    <LoopTrackCard
                                        key={track.id}
                                        track={track}
                                        onRecord={() => loopRecord(track.id)}
                                        onStopRecord={() => loopStopRecord(track.id)}
                                        onPlay={() => loopPlay(track.id)}
                                        onStop={() => loopStop(track.id)}
                                        onClear={() => loopClear(track.id)}
                                        onVolume={(v) => loopVolume(track.id, v)}
                                        onMute={() => loopMute(track.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function LoopTrackCard({
    track, onRecord, onStopRecord, onPlay, onStop, onClear, onVolume, onMute
}: {
    track: LoopTrack,
    onRecord: () => void, onStopRecord: () => void, onPlay: () => void, onStop: () => void, onClear: () => void,
    onVolume: (v: number) => void, onMute: () => void
}) {
    const [showVolume, setShowVolume] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const isLongPress = useRef(false);

    const handleTouchStart = () => {
        isLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            setShowVolume(!showVolume);
        }, 400); // 400ms long press
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    const handleClick = () => {
        // Only trigger mute if it wasn't a long press
        if (!isLongPress.current) {
            onMute();
        }
    };
    const isRecording = track.state === "recording";
    const isPlaying = track.state === "playing";
    const hasLoop = track.state !== "empty" && track.state !== "recording";

    const handleDownload = () => {
        if (!track.url) return;
        const a = document.createElement("a");
        a.href = track.url;
        a.download = `loop-${track.id}-${Date.now()}.webm`;
        a.click();
    };

    return (
        <div className={`relative w-full rounded-xl p-4 flex flex-col justify-between gap-3 border transition-all ${isRecording ? "bg-red-500/10 border-red-500/50 shadow-inner" :
            isPlaying ? "bg-primary/10 border-primary/50" :
                "bg-muted/30 border-border opacity-80 hover:opacity-100"
            }`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-muted-foreground">LOOP {track.id}</span>
                <div className="flex items-center gap-2">
                    {hasLoop && track.url && (
                        <button onClick={handleDownload} className="text-muted-foreground hover:text-primary transition-colors" title="Download Loop">
                            <Download size={14} />
                        </button>
                    )}
                    {hasLoop && (
                        <button onClick={onClear} className="text-muted-foreground hover:text-destructive transition-colors" title="Clear Loop">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 justify-center relative">
                    {/* Record / Stop Record */}
                    {isRecording ? (
                        <button onClick={onStopRecord} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                            <Square size={12} fill="currentColor" />
                        </button>
                    ) : (
                        <button onClick={onRecord} disabled={hasLoop} className="w-8 h-8 rounded-full bg-background border border-border text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white disabled:opacity-20 disabled:hover:bg-background disabled:hover:text-red-500 transition-all">
                            <Mic size={14} />
                        </button>
                    )}

                    {/* Play / Stop */}
                    {hasLoop && (
                        isPlaying ? (
                            <button onClick={onStop} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                                <Square size={12} fill="currentColor" />
                            </button>
                        ) : (
                            <button onClick={onPlay} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                                <Play size={14} fill="currentColor" className="ml-0.5" />
                            </button>
                        )
                    )}

                    {/* Volume Button */}
                    <button
                        onClick={handleClick}
                        onContextMenu={(e) => { e.preventDefault(); setShowVolume(!showVolume); }}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchEnd}
                        className={`w-8 h-8 rounded-full border border-border flex items-center justify-center transition-all touch-manipulation ${track.muted ? "bg-destructive/20 text-destructive border-destructive/50" : "bg-background hover:bg-muted text-muted-foreground"}`}
                        title="Tap: Mute | Hold/Right-Click: Volume"
                    >
                        {track.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>



                    {/* Status Visual */}
                    <div className={`flex-1 justify-center ml-2 h-8 rounded-md flex items-end gap-0.5 overflow-hidden opacity-50 ${isRecording ? "animate-pulse" : ""}`}>
                        {/* Fake waveform viz */}
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className={`flex-1 rounded-t-sm transition-all duration-300 ${isRecording ? "bg-red-500" : isPlaying ? "bg-primary" : "bg-muted-foreground"}`}
                                style={{
                                    height: hasLoop || isRecording ? `${30 + (i % 3) * 20}%` : "10%",
                                    animationDelay: `${i * 0.1}s`
                                }}
                            />
                        ))}
                    </div>
                </div>

                <AnimatePresence>
                    {showVolume && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="bg-popover shadow-xl rounded-lg z-50 flex justify-between items-center gap-2 min-w-[40px]"
                        >
                            <input
                                type="range" min="-60" max="6" step="1"
                                value={track.volume}
                                onChange={(e) => onVolume(Number(e.target.value))}
                                className="w-full origin-center accent-primary cursor-pointer bg-white/20 rounded-full appearance-none"
                            />
                            <span className="text-[10px] font-mono font-bold">{track.volume}dB</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
