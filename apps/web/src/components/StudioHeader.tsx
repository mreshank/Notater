"use client";

import { useStore } from "@/lib/store";
import {
    Play, Pause, Square, Circle, Save, Download,
    Music, FileText, Moon, Sun, Trees, Waves, Sunset, MoonStar, Zap,
    ChevronLeft, ChevronRight, Loader2, XIcon
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectControl } from "@/components/ProjectControl";

export function StudioHeader() {
    const { project, isPlaying, setBpm, setBarCount, togglePlay, toggleRecord, isRecording, isLoading, saveProject, exportAudio, theme, setTheme, setProjectNotes } = useStore();

    const [showNotes, setShowNotes] = useState(false);
    const [showThemeMenu, setShowThemeMenu] = useState(false);

    return (
        <>
            <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-50">
                {/* Left: Project Info & Actions */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="group relative w-9 h-9 cursor-pointer">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-xl blur-sm opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative w-full h-full bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-inner border border-white/10">
                                <Music className="text-white w-4.5 h-4.5" />
                            </div>
                        </div>
                        <div className="hidden md:flex flex-col">
                            <input
                                type="text"
                                value={project.name}
                                onChange={(e) => useStore.setState(s => ({ project: { ...s.project, name: e.target.value } }))}
                                className="bg-transparent font-bold text-sm outline-none w-40 focus:w-56 transition-all text-foreground placeholder:text-muted-foreground/50 truncate"
                                placeholder="Untitled Project"
                            />
                            <div className="text-[10px] text-muted-foreground/70 font-medium">
                                Last edited just now
                            </div>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-border/50 hidden sm:block"></div>

                    <div className="flex items-center gap-1">
                        <button onClick={saveProject} disabled={isLoading} className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50" title="Save Project (To DB)">
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        </button>
                        <button onClick={exportAudio} className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors" title="Export Audio (WAV)">
                            <Download size={16} />
                        </button>
                        <button
                            onClick={() => setShowNotes(!showNotes)}
                            className={`p-2 rounded-md transition-colors ${showNotes ? "bg-primary/20 text-primary" : "hover:bg-muted text-muted-foreground"}`}
                            title="Project Notes"
                        >
                            <FileText size={16} />
                        </button>
                    </div>
                </div>

                {/* Center: Transport & Scope */}
                <div className="flex-1 flex justify-center items-center gap-6 mx-4">
                    <div className="relative flex items-center gap-4 bg-muted/30 px-2 py-0.5 rounded-full border border-border/50 backdrop-blur-sm overflow-hidden shrink-0">
                        {/* Visualizer Scope (Global) */}
                        <div className="hidden absolute z-0 pointer-events-none -translate-x-2 translate-y-2 md:flex items-end gap-0.5 h-8 w-full opacity-50">
                            {/* Static CSS animation for now as requested "Oscilloscope" placeholder */}
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1.5 bg-primary rounded-t-sm transition-all duration-300 ${isPlaying ? "animate-pulse" : "h-1 opacity-20"}`}
                                    style={{
                                        height: isPlaying ? `${40 + (Math.sin(i * 0.5) * 30)}%` : "10%",
                                        animationDelay: `${i * 0.05}s`
                                    }}
                                />
                            ))}
                        </div>
                        <button
                            onClick={toggleRecord}
                            className={`w-8 h-8 z-10 flex items-center justify-center rounded-full transition-all ${isRecording ? "bg-destructive text-white shadow-lg shadow-destructive/40 animate-pulse" : "hover:bg-destructive/10 text-destructive"
                                }`}
                            title="Record"
                        >
                            <Circle size={14} fill={isRecording ? "currentColor" : "none"} />
                        </button>

                        <button
                            onClick={togglePlay}
                            className={`w-10 h-10 z-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-all ${isPlaying ? "shadow-lg shadow-primary/40 scale-105" : ""
                                }`}
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                        </button>

                        <button
                            onClick={() => {
                                if (isPlaying) togglePlay();
                            }}
                            className="w-8 h-8 z-10 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Square size={14} fill="currentColor" />
                        </button>
                    </div>
                </div>

                {/* Right: Controls & Settings */}
                <div className="flex items-center gap-3">
                    {/* BPM Control */}
                    <div className="hidden md:flex group relative items-center bg-muted/40 hover:bg-muted/60 border border-border/50 rounded-lg p-0.5 transition-all focus-within:ring-1 focus-within:ring-primary/50 focus-within:bg-background/80">
                        <button
                            onClick={() => setBpm(Math.max(15, Math.floor((project.bpm - 5) / 5) * 5))}
                            className="p-1 hover:bg-background/50 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <div className="flex flex-col items-center px-2 w-16">
                            <div className="px-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors">BPM</div>
                            <input
                                type="text"
                                value={project.bpm}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val)) {
                                        setBpm(Number(val));
                                    }
                                }}
                                className="bg-transparent w-full text-center text-sm font-mono font-bold outline-none text-foreground"
                            />
                        </div>
                        <button
                            onClick={() => setBpm(Math.min(300, Math.ceil((project.bpm + 5) / 5) * 5))}
                            className="p-1 hover:bg-background/50 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>

                    {/* Bars Control */}
                    <div className="hidden md:flex group relative items-center bg-muted/40 hover:bg-muted/60 border border-border/50 rounded-lg p-0.5 transition-all focus-within:ring-1 focus-within:ring-primary/50 focus-within:bg-background/80">
                        <button
                            onClick={() => {
                                const options = [1, 2, 4, 8, 16];
                                const currentIdx = options.indexOf(project.barCount || 4);
                                if (currentIdx > 0) setBarCount(options[currentIdx - 1]);
                            }}
                            className="p-1 hover:bg-background/50 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <div className="flex flex-col items-center px-1 w-12">
                            <div className="px-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors">Bar</div>
                            <div className="text-sm font-mono font-bold text-foreground">{project.barCount || 4}</div>
                        </div>
                        <button
                            onClick={() => {
                                const options = [1, 2, 4, 8, 16];
                                const currentIdx = options.indexOf(project.barCount || 4);
                                if (currentIdx < options.length - 1) setBarCount(options[currentIdx + 1]);
                            }}
                            className="p-1 hover:bg-background/50 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="hidden sm:block h-5 w-px bg-border/50 mx-1"></div>

                    {/* Theme Toggle & Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setTheme(theme === 'cyber' ? 'lofi' : 'cyber')}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setShowThemeMenu(!showThemeMenu);
                            }}
                            className="p-2 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all active:scale-95 border border-transparent hover:border-border/50"
                            title="Left Click: Toggle Mode | Right Click: Theme Menu"
                        >
                            {(() => {
                                switch (theme) {
                                    case 'cyber': return <Moon size={18} className="fill-current text-indigo-400" />;
                                    case 'lofi': return <Sun size={18} className="fill-current text-amber-500" />;
                                    case 'neo': return <Zap size={18} className="fill-current text-cyan-500" />;
                                    case 'forest': return <Trees size={18} className="text-emerald-500" />;
                                    case 'ocean': return <Waves size={18} className="text-blue-500" />;
                                    case 'sunset': return <Sunset size={18} className="text-orange-500" />;
                                    case 'midnight': return <MoonStar size={18} className="text-indigo-300" />;
                                    default: return <Sun size={18} className="fill-current text-amber-500" />;
                                }
                            })()}
                        </button>

                        <AnimatePresence>
                            {showThemeMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    className="absolute top-full right-0 mt-2 w-32 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden"
                                >
                                    <div className="flex flex-col p-1 text-sm">
                                        <span className="px-2 py-1 text-[10px] uppercase font-bold text-muted-foreground/50">Select Theme</span>
                                        {['cyber', 'lofi', 'neo', 'forest', 'ocean', 'sunset', 'midnight'].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => {
                                                    setTheme(t as "cyber" | "lofi" | "neo" | "forest" | "ocean" | "sunset" | "midnight");
                                                    setShowThemeMenu(false);
                                                }}
                                                className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${theme === t ? "bg-primary/20 text-primary font-medium" : "hover:bg-muted/80"}`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${t === 'cyber' ? 'bg-purple-500' :
                                                    t === 'lofi' ? 'bg-orange-200' : t === 'neo' ? 'bg-cyan-400' :
                                                        t === 'forest' ? 'bg-emerald-500' : t === 'ocean' ? 'bg-blue-500' :
                                                            t === 'sunset' ? 'bg-orange-500' : 'bg-slate-800'}`} />
                                                <span className="capitalize">{t}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="hidden sm:block h-5 w-px bg-border/50 mx-1"></div>

                    {/* Main Menu (Replaced by ProjectControl) */}
                    <ProjectControl />
                </div>
            </header>
            {/* Project Notes Overlay */}
            <AnimatePresence>
                {
                    showNotes && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className="absolute top-16 right-4 w-[90vw] max-w-sm bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-xl z-50 p-4 flex flex-col gap-2"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-sm flex items-center gap-2">
                                    <FileText size={14} className="text-primary" />
                                    Project Notes
                                </h3>
                                <span className="text-[10px] text-muted-foreground cursor-pointer flex gap-0.5 w-fit">Markdown supported<XIcon size={14} className="text-primary ml-4 cursor-pointer" onClick={() => setShowNotes(false)} /></span>
                            </div>
                            <textarea
                                value={project.notes || ""}
                                onChange={(e) => setProjectNotes(e.target.value)}
                                placeholder="Jot down lyrics, ideas, or structure..."
                                className="w-full h-48 bg-muted/50 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                            />
                        </motion.div>
                    )
                }
            </AnimatePresence>
        </>
    );
}
