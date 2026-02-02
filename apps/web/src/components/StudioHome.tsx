
import { useState } from "react";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import {
    Music,
    Piano,
    Disc,
    Sliders,
    Sparkles,
    Clock,
    FileAudio,
    ArrowRight,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import type { ViewMode } from "./StudioNav";

interface StudioHomeProps {
    onNavigate: (view: ViewMode) => void;
}

export function StudioHome({ onNavigate }: StudioHomeProps) {
    const { project } = useStore();
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<{
        title: string;
        description: string;
        bpm: number;
        key: string;
        genre: string;
        instruments: string[];
        chordProgression?: string;
    } | null>(null);

    const handleAiSuggest = async (type: "inspire" | "chord" | "trap") => {
        setAiLoading(true);
        try {
            const res = await fetch("/api/ai/suggest", {
                method: "POST",
                body: JSON.stringify({ promptType: type }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setAiSuggestion(data);
            toast.success("AI Idea Generated!", { icon: "✨" });
        } catch {
            toast.error("Failed to get AI suggestion");
        } finally {
            setAiLoading(false);
        }
    };

    const timeOfDay = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <div className="h-full w-full overflow-y-auto p-6 pb-24 space-y-8">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-br from-primary to-purple-400">
                        Hello, Producer
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        {timeOfDay()}. Ready to create something new?
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-4">
                    <div className="bg-muted/30 p-3 rounded-xl border border-border/50 flex flex-col items-center min-w-[100px]">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-bold">
                            <Clock size={12} /> Session
                        </div>
                        <div className="text-xl font-mono font-bold mt-1">00:42</div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-xl border border-border/50 flex flex-col items-center min-w-[100px]">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-bold">
                            <FileAudio size={12} /> BPM
                        </div>
                        <div className="text-xl font-mono font-bold mt-1">{project.bpm}</div>
                    </div>
                </div>
            </div>

            {/* Main Navigation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <NavCard
                    title="Drum Machine"
                    icon={<Disc size={32} />}
                    color="bg-orange-500"
                    desc="Finger drumming & samples"
                    onClick={() => onNavigate("drums")}
                />
                <NavCard
                    title="Sequencer"
                    icon={<Music size={32} />}
                    color="bg-blue-500"
                    desc="Program beats & patterns"
                    onClick={() => onNavigate("seq")}
                />
                <NavCard
                    title="Piano Roll"
                    icon={<Piano size={32} />}
                    color="bg-purple-500"
                    desc="Compose melodies & chords"
                    onClick={() => onNavigate("piano")}
                />
                <NavCard
                    title="Mixer"
                    icon={<Sliders size={32} />}
                    color="bg-emerald-500"
                    desc="Balance & polish your sound"
                    onClick={() => onNavigate("mix")}
                />
            </div>

            {/* AI Assistant Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* AI Controls */}
                <div className="lg:col-span-1 bg-linear-to-br from-indigo-900/20 to-purple-900/20 rounded-2xl p-6 border border-indigo-500/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors" />
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                            <Sparkles className="text-indigo-400" />
                            AI Inspiration
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            Stuck? Let Gemini generate a creative starting point for you.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleAiSuggest("inspire")}
                                disabled={aiLoading}
                                className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {aiLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
                                Random Idea
                            </button>
                            <button
                                onClick={() => handleAiSuggest("chord")}
                                disabled={aiLoading}
                                className="w-full py-3 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {aiLoading ? <Loader2 className="animate-spin" /> : <Music size={16} />}
                                Chord Progression
                            </button>
                        </div>
                    </div>
                </div>

                {/* AI Result Display */}
                <div className="lg:col-span-2 bg-muted/20 border border-border/50 rounded-2xl p-6 relative min-h-[200px] flex flex-col justify-center">
                    {!aiSuggestion ? (
                        <div className="text-center text-muted-foreground opacity-50 flex flex-col items-center gap-2">
                            <Sparkles size={48} strokeWidth={1} />
                            <p>AI suggestions will appear here...</p>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                                            {aiSuggestion.genre}
                                        </span>
                                        <span className="text-xs font-mono opacity-50">
                                            {aiSuggestion.bpm} BPM • {aiSuggestion.key}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold">{aiSuggestion.title}</h3>
                                </div>
                                <button
                                    onClick={() => {
                                        const store = useStore.getState();
                                        // Apply all available AI suggestions
                                        store.setProjectName(aiSuggestion.title);
                                        store.setBpm(aiSuggestion.bpm);

                                        // Build comprehensive notes from the AI suggestion
                                        const noteLines = [
                                            `🎵 ${aiSuggestion.title}`,
                                            `Genre: ${aiSuggestion.genre} | Key: ${aiSuggestion.key}`,
                                            ``,
                                            aiSuggestion.description,
                                            ``,
                                            `Instruments: ${aiSuggestion.instruments?.join(", ")}`,
                                        ];
                                        if (aiSuggestion.chordProgression) {
                                            noteLines.push(`Chords: ${aiSuggestion.chordProgression}`);
                                        }
                                        store.setProjectNotes(noteLines.join("\n"));

                                        toast.success(`Applied: "${aiSuggestion.title}" @ ${aiSuggestion.bpm} BPM`, { icon: "🚀" });
                                    }}
                                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Use This Idea
                                </button>
                            </div>

                            <p className="text-lg text-foreground/80 leading-relaxed">
                                {aiSuggestion.description}
                            </p>

                            <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Suggested Instruments</h4>
                                <div className="flex flex-wrap gap-2">
                                    {aiSuggestion.instruments?.map((inst: string, i: number) => (
                                        <span key={i} className="px-3 py-1 bg-surface border border-border rounded-md text-sm">
                                            {inst}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {aiSuggestion.chordProgression && (
                                <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Chord Progression</h4>
                                    <p className="font-mono text-lg tracking-wider text-primary">
                                        {aiSuggestion.chordProgression}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

function NavCard({ title, icon, color, desc, onClick }: {
    title: string;
    icon: React.ReactNode;
    color: string;
    desc: string;
    onClick: () => void;
}) {
    return (
        <motion.button
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="group relative overflow-hidden rounded-2xl bg-muted/40 border border-border/50 p-6 text-left transition-colors hover:bg-muted/60 hover:border-primary/30"
        >
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color} rounded-bl-3xl`}>
                {icon}
            </div>

            <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-20 text-white flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>

            <h3 className="text-xl font-bold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>

            <div className="absolute bottom-4 right-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <ArrowRight size={20} className="text-primary" />
            </div>
        </motion.button>
    );
}
