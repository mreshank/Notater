
import { useState } from "react";
import { p2p } from "@/lib/p2p";
import { Copy, Check, Share2, Radio, Users, Loader2, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useModal } from "./ui/ModalProvider";
import { useUser } from "@clerk/nextjs";
import { useStore, type Collaborator } from "@/lib/store";

const getRandomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16);

export function CollabMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [peerId, setPeerId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    const { user } = useUser();
    const collaborators = useStore(state => state.collaborators);
    const showCollaborators = isConnected && collaborators.length > 0;

    const getUserInfo = (): Collaborator => ({
        id: 'pending',
        name: user?.fullName || user?.firstName || "Guest",
        color: getRandomColor()
    });


    const { prompt } = useModal();

    const handleStartSession = async () => {
        try {
            setIsLoading(true);
            const userInfo = getUserInfo();
            const id = await p2p.initialize(userInfo, true);
            setPeerId(id);
            setIsConnected(true);
            toast.success("Session Live! Share your ID.");
        } catch (e) {
            console.error(e);
            toast.error("Failed to start session");
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinSession = async () => {
        const id = await prompt("Enter Host Session ID:");
        if (id) {
            try {
                setIsLoading(true);
                const userInfo = getUserInfo();
                await p2p.initialize(userInfo, false);
                p2p.connect(id);
                setPeerId("CONNECTED_AS_GUEST"); // Marker
                setIsConnected(true);
            } catch (e) {
                console.error(e);
                toast.error("Failed to join session");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const copyPeerId = () => {
        if (peerId && peerId !== "CONNECTED_AS_GUEST") {
            navigator.clipboard.writeText(peerId);
            setHasCopied(true);
            setTimeout(() => setHasCopied(false), 2000);
            toast.success("ID Copied to clipboard");
        }
    };

    const handleDisconnect = () => {
        // Since p2p singleton persists, a full cleanup is hard without reload.
        // We'll just reset UI state for this "mock" disconnect if logic isn't there.
        // Actually, let's just show a toast saying "Refresh to disconnect" or similar if we can't kill it.
        // But better: Just reset local state.
        setPeerId(null);
        setIsConnected(false);
        toast.info("Session disconnected (Visual only - refresh to fully reset)");
    };

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-center p-1.5 rounded-lg md:border transition-all ${isConnected
                    ? "md:bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
                    : "md:bg-surface border-border hover:bg-surface-hover text-muted-foreground"
                    }`}
                title="Real-time Collaboration"
            >
                {isConnected ? <Wifi size={20} /> : <Users size={20} />}
                {isConnected && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-72 bg-surface/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-sm flex items-center gap-2">
                                        <Users size={16} className="text-primary" />
                                        Session
                                    </h3>
                                    {isConnected && (
                                        <button
                                            onClick={handleDisconnect}
                                            className="text-[10px] text-destructive hover:underline"
                                        >
                                            Disconnect
                                        </button>
                                    )}
                                </div>

                                {!isConnected ? (
                                    <div className="space-y-3">
                                        <button
                                            onClick={handleStartSession}
                                            disabled={isLoading}
                                            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                                        >
                                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Radio size={16} />}
                                            Start Hosting
                                        </button>
                                        <div className="relative">
                                            <div className="absolute inset-x-0 top-1/2 h-px bg-border"></div>
                                            <div className="relative text-center"><span className="bg-surface px-2 text-[10px] text-muted-foreground font-medium">OR JOIN EXISTING</span></div>
                                        </div>
                                        <button
                                            onClick={handleJoinSession}
                                            disabled={isLoading}
                                            className="w-full py-2.5 bg-muted/50 hover:bg-muted text-foreground rounded-lg text-sm font-bold flex items-center justify-center gap-2 border border-border/50 disabled:opacity-50 transition-colors"
                                        >
                                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                                            Join Session
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
                                            <div className="p-2 bg-green-500 text-white rounded-full">
                                                <Wifi size={16} />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-green-600">Session Active</div>
                                                <div className="text-[10px] text-muted-foreground">Syncing in real-time</div>
                                            </div>
                                        </div>

                                        {peerId && peerId !== "CONNECTED_AS_GUEST" && (
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Session ID</label>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 bg-muted/50 p-2 rounded text-xs font-mono border border-border/50 truncate">
                                                        {peerId}
                                                    </code>
                                                    <button
                                                        onClick={copyPeerId}
                                                        className="p-2 bg-muted hover:bg-muted/80 rounded-md transition-colors"
                                                        title="Copy ID"
                                                    >
                                                        {hasCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground/70">
                                                    Share this ID with your bandmates.
                                                </p>
                                            </div>
                                        )}

                                        {/* Active Collaborators List */}
                                        {showCollaborators && (
                                            <div className="space-y-1 pt-2 border-t border-border/50">
                                                <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                                                    Collaborators ({collaborators.length})
                                                </div>
                                                <div className="space-y-1">
                                                    {collaborators.map(c => (
                                                        <div key={c.id} className="flex items-center gap-2 p-1.5 rounded bg-background/50 text-xs">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                                                            <div className="font-medium truncate flex-1">{c.name} {c.id === peerId ? "(You)" : ""}</div>
                                                            {c.isHost && <span className="text-[9px] bg-primary/20 text-primary px-1 rounded">HOST</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {peerId === "CONNECTED_AS_GUEST" && (
                                            <div className="text-xs text-center text-muted-foreground">
                                                You are connected to a host.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
