"use client";

import { useStore } from "@/lib/store";
import {
    Play, Pause, Square, Circle, Save, Download,
    Music, FileText, Moon, Sun, Trees, Waves, Sunset, MoonStar, Zap,
    ChevronLeft, ChevronRight, Loader2, XIcon, Menu
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectControl } from "@/components/ProjectControl";

export function StudioHeader() {
    const { project, isPlaying, setBpm, setBarCount, togglePlay, toggleRecord, isRecording, isLoading, saveProject, exportAudio, theme, setTheme, setProjectNotes } = useStore();

    const [showNotes, setShowNotes] = useState(false);
    const [showThemeMenu, setShowThemeMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    return (
        <>
            <header className="h-14 sm:h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-2 sm:px-4 sticky top-0 z-50">
                {/* Left: Logo + Project Info */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Logo */}
                        <div className="group relative w-8 h-8 sm:w-9 sm:h-9 cursor-pointer shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-xl blur-sm opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative w-full h-full bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-inner border border-white/10">
                                <Music className="text-white w-4 h-4 sm:w-4.5 sm:h-4.5" />
                            </div>
                        </div>
                        {/* Project Name - Hidden on mobile */}
                        <div className="hidden sm:flex flex-col">
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

                    {/* Desktop Actions - Hidden on mobile */}
                    <div className="hidden sm:block h-6 w-px bg-border/50"></div>
                    <div className="hidden sm:flex items-center gap-1">
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

                {/* Center: Transport Controls - Always visible, larger on mobile */}
                <div className="flex-1 flex justify-center items-center">
                    <div className="relative flex items-center gap-2 sm:gap-4 bg-muted/30 px-2 sm:px-2 py-0.5 rounded-full border border-border/50 backdrop-blur-sm overflow-hidden shrink-0">
                        {/* Visualizer Scope - Hidden on mobile */}
                        <div className="hidden absolute z-0 pointer-events-none -translate-x-2 translate-y-2 md:flex items-end gap-0.5 h-8 w-full opacity-50">
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

                        {/* Record Button */}
                        <button
                            onClick={toggleRecord}
                            className={`w-9 h-9 sm:w-8 sm:h-8 z-10 flex items-center justify-center rounded-full transition-all ${isRecording ? "bg-destructive text-white shadow-lg shadow-destructive/40 animate-pulse" : "hover:bg-destructive/10 text-destructive"
                                }`}
                            title="Record"
                        >
                            <Circle size={16} className="sm:w-[14px] sm:h-[14px]" fill={isRecording ? "currentColor" : "none"} />
                        </button>

                        {/* Play Button */}
                        <button
                            onClick={togglePlay}
                            className={`w-11 h-11 sm:w-10 sm:h-10 z-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-all ${isPlaying ? "shadow-lg shadow-primary/40 scale-105" : ""
                                }`}
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <Pause size={22} className="sm:w-5 sm:h-5" fill="currentColor" /> : <Play size={22} className="sm:w-5 sm:h-5 ml-0.5" fill="currentColor" />}
                        </button>

                        {/* Stop Button */}
                        <button
                            onClick={() => {
                                if (isPlaying) togglePlay();
                            }}
                            className="w-9 h-9 sm:w-8 sm:h-8 z-10 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Square size={16} className="sm:w-[14px] sm:h-[14px]" fill="currentColor" />
                        </button>
                    </div>
                </div>

                {/* Right: Controls & Settings */}
                <div className="flex items-center gap-1 sm:gap-3">
                    {/* BPM Control - Hidden on mobile */}
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
                            title="Increase BPM"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>

                    {/* Bars Control - Hidden on mobile */}
                    <div className="hidden md:flex group relative items-center bg-muted/40 hover:bg-muted/60 border border-border/50 rounded-lg p-0.5 transition-all focus-within:ring-1 focus-within:ring-primary/50 focus-within:bg-background/80">
                        <button
                            onClick={() => {
                                const options = [1, 2, 4, 8, 16];
                                const currentIdx = options.indexOf(project.barCount || 4);
                                if (currentIdx > 0) setBarCount(options[currentIdx - 1]);
                            }}
                            className="p-1 hover:bg-background/50 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                            title="Decrease Bars"
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
                            title="Increase Bars"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="hidden sm:block h-5 w-px bg-border/50 mx-1"></div>

                    {/* Theme Toggle - Hidden on mobile, moved to drawer */}
                    <div className="hidden sm:block relative">
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

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="sm:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Desktop: ProjectControl */}
                    <div className="hidden sm:block">
                        <div className="hidden sm:block h-5 w-px bg-border/50 mx-1"></div>
                        <ProjectControl />
                    </div>
                </div>
            </header>

            {/* Mobile Menu Drawer */}
            <AnimatePresence>
                {showMobileMenu && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMobileMenu(false)}
                            className="fixed inset-0 bg-black/50 z-40 sm:hidden"
                        />
                        {/* Menu */}
                        <motion.div
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 100 }}
                            className="fixed top-0 right-0 w-64 h-full bg-background border-l border-border z-50 sm:hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                <span className="font-bold text-sm">Menu</span>
                                <span className="flex items-center gap-2">
                                    <ProjectControl />
                                    <button onClick={() => setShowMobileMenu(false)} className="p-1 rounded hover:bg-muted">
                                        <XIcon size={18} />
                                    </button>
                                </span>
                            </div>

                            <div className="flex-1 p-4 space-y-4">
                                {/* Project Name */}
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground uppercase font-bold">Project</label>
                                    <input
                                        type="text"
                                        value={project.name}
                                        onChange={(e) => useStore.setState(s => ({ project: { ...s.project, name: e.target.value } }))}
                                        className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                                        placeholder="Untitled Project"
                                    />
                                </div>

                                {/* BPM */}
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground uppercase font-bold">BPM</label>
                                    <div className="max-w-full flex items-center gap-2 overflow-hidden">
                                        <button
                                            onClick={() => setBpm(Math.max(15, project.bpm - 5))}
                                            className="p-2 bg-muted rounded-lg hover:bg-muted/80 border border-white/50"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <input
                                            type="text"
                                            value={project.bpm}
                                            onChange={(e) => {
                                                if (/^\d*$/.test(e.target.value)) setBpm(Number(e.target.value));
                                            }}
                                            className="md:flex-1 max-md:w-16 bg-muted/50 rounded-lg px-3 py-2 text-sm text-center font-mono font-bold outline-none focus:ring-1 focus:ring-primary"
                                        />
                                        <button
                                            onClick={() => setBpm(Math.min(300, project.bpm + 5))}
                                            className="p-2 bg-muted rounded-lg hover:bg-muted/80 border border-white/50"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Bars */}
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground uppercase font-bold">Bars</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 4, 8].map((bars) => (
                                            <button
                                                key={bars}
                                                onClick={() => setBarCount(bars)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${project.barCount === bars ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                                            >
                                                {bars}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-2 pt-4 border-t border-border">
                                    <button
                                        onClick={() => { saveProject(); setShowMobileMenu(false); }}
                                        disabled={isLoading}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 bg-muted/50 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                        <span className="text-sm font-medium">Save Project</span>
                                    </button>
                                    <button
                                        onClick={() => { exportAudio(); setShowMobileMenu(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <Download size={18} />
                                        <span className="text-sm font-medium">Export Audio</span>
                                    </button>
                                    <button
                                        onClick={() => { setShowNotes(!showNotes); setShowMobileMenu(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <FileText size={18} />
                                        <span className="text-sm font-medium">Project Notes</span>
                                    </button>
                                </div>

                                {/* Theme Selection */}
                                <div className="space-y-2 pt-4 border-t border-border flex flex-col gap-2 ">
                                    <label className="text-xs text-muted-foreground uppercase font-bold">Theme</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['cyber', 'lofi', 'neo', 'forest', 'ocean', 'sunset', 'midnight'].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setTheme(t as "cyber" | "lofi" | "neo" | "forest" | "ocean" | "sunset" | "midnight")}
                                                className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-colors ${theme === t ? "bg-primary/20 ring-1 ring-primary" : "bg-muted/50 hover:bg-muted"}`}
                                                title={t}
                                            >
                                                <div className={`w-4 h-4 rounded-full ${t === 'cyber' ? 'bg-purple-500' :
                                                    t === 'lofi' ? 'bg-orange-200' : t === 'neo' ? 'bg-cyan-400' :
                                                        t === 'forest' ? 'bg-emerald-500' : t === 'ocean' ? 'bg-blue-500' :
                                                            t === 'sunset' ? 'bg-orange-500' : 'bg-slate-800'}`} />
                                                <span className="text-[9px] capitalize">{t}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Project Notes Overlay */}
            <AnimatePresence>
                {
                    showNotes && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className="absolute top-14 sm:top-16 right-2 sm:right-4 w-[calc(100vw-1rem)] sm:w-[90vw] max-w-sm bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-xl z-50 p-4 flex flex-col gap-2"
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
