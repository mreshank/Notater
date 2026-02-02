"use client";
import { useCallback, useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
// import { useStore } from "@/lib/store"; // Removed unused import
import { StudioHeader } from "@/components/StudioHeader";
import { LooperPanel } from "@/components/LooperPanel";
import { StudioHome } from "@/components/StudioHome";
import { StudioNav, ViewMode } from "@/components/StudioNav";
import { StudioErrorBoundary } from "@/components/StudioErrorBoundary";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const LoadingState = () => (
    <div className="flex-1 flex items-center justify-center text-muted-foreground/50 animate-pulse">
        <Loader2 className="animate-spin mr-2" /> Loading Instrument...
    </div>
);

const MiniKeyboard = dynamic(() => import("@/components/MiniKeyboard").then(mod => mod.MiniKeyboard), {
    loading: () => <LoadingState />
});
const Drums = dynamic(() => import("@/components/Drums").then(mod => mod.Drums), {
    loading: () => <LoadingState />
});
const StepSequencer = dynamic(() => import("@/components/StepSequencer").then(mod => mod.StepSequencer), {
    loading: () => <LoadingState />
});
const PianoRoll = dynamic(() => import("@/components/PianoRoll").then(mod => mod.PianoRoll), {
    loading: () => <LoadingState />
});
const Mixer = dynamic(() => import("@/components/Mixer").then(mod => mod.Mixer), {
    loading: () => <LoadingState />
});

const VALID_VIEWS: ViewMode[] = ["home", "keys", "drums", "seq", "piano", "mix"];

export default function StudioPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [showShortcuts, setShowShortcuts] = useState(false);

    // Get the active view from URL, default to "home"
    const activeView = useMemo(() => {
        const tabParam = searchParams.get("tab");
        if (tabParam && VALID_VIEWS.includes(tabParam as ViewMode)) {
            return tabParam as ViewMode;
        }
        return "home";
    }, [searchParams]);

    // Update URL when view changes
    const setActiveView = useCallback((view: ViewMode) => {
        if (view === "home") {
            router.push("/studio", { scroll: false });
        } else {
            router.push(`/studio?tab=${view}`, { scroll: false });
        }
    }, [router]);

    // Looper panel visibility state
    const [showLooper, setShowLooper] = useState(true);

    // Initialize keyboard shortcuts
    const { shortcuts } = useKeyboardShortcuts({
        onNavigate: (view) => setActiveView(view as ViewMode),
        onShowShortcuts: () => setShowShortcuts(true),
        onToggleLooper: () => setShowLooper(prev => !prev),
        activeView,
    });

    // Close modal on Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && showShortcuts) {
                setShowShortcuts(false);
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [showShortcuts]);

    return (
        <div className="h-full w-full flex flex-col bg-background transition-colors duration-500">
            {/* Keyboard Shortcuts Modal */}
            <KeyboardShortcutsModal
                isOpen={showShortcuts}
                onClose={() => setShowShortcuts(false)}
                shortcuts={shortcuts}
            />

            {/* Global Studio Header */}
            <StudioHeader />

            <div className="flex-1 flex overflow-hidden relative">
                {/* Main Workspace */}
                <main className="flex-1 relative overflow-hidden flex flex-col min-w-0">
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_50%)]" />

                    {/* Instrument View */}
                    <div className="flex-1 flex items-center justify-center p-4 z-10 overflow-auto">
                        <AnimatePresence mode="wait">
                            {activeView === "home" && (
                                <motion.div
                                    key="home"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="w-full h-full max-w-7xl mx-auto"
                                >
                                    <StudioErrorBoundary componentName="Studio Home">
                                        <StudioHome onNavigate={(view) => setActiveView(view)} />
                                    </StudioErrorBoundary>
                                </motion.div>
                            )}
                            {activeView === "keys" && (
                                <motion.div
                                    key="keys"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="w-full max-w-3xl"
                                >
                                    <StudioErrorBoundary componentName="Keyboard">
                                        <MiniKeyboard />
                                    </StudioErrorBoundary>
                                </motion.div>
                            )}
                            {activeView === "drums" && (
                                <motion.div
                                    key="drums"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="w-full max-w-2xl"
                                >
                                    <StudioErrorBoundary componentName="Drum Machine">
                                        <Drums />
                                    </StudioErrorBoundary>
                                </motion.div>
                            )}
                            {activeView === "seq" && (
                                <motion.div
                                    key="seq"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="w-full"
                                >
                                    <StudioErrorBoundary componentName="Sequencer">
                                        <StepSequencer />
                                    </StudioErrorBoundary>
                                </motion.div>
                            )}
                            {activeView === "piano" && (
                                <motion.div
                                    key="piano"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="w-full h-full"
                                >
                                    <StudioErrorBoundary componentName="Piano Roll">
                                        <PianoRoll />
                                    </StudioErrorBoundary>
                                </motion.div>
                            )}
                            {activeView === "mix" && (
                                <motion.div
                                    key="mix"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="w-full h-full p-4"
                                >
                                    <StudioErrorBoundary componentName="Mixer">
                                        <Mixer />
                                    </StudioErrorBoundary>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>

                {/* Global Looper Panel - Toggle with 'L' key */}
                {showLooper && <LooperPanel />}
            </div>

            {/* Bottom Control / Nav */}
            <StudioNav activeView={activeView} setActiveView={setActiveView} />
        </div>
    );
}

