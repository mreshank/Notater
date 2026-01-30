import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { useProjects } from "@/lib/db-hooks";
import { exportProjectPackage, importProjectPackage } from "@/lib/sync";
import { pushProjectToCloud, pullProjectsFromCloud } from "@/lib/cloud-sync";
import { loginToGoogle, logoutFromGoogle, listDriveProjects, downloadFromDrive, syncProjectToDrive } from "@/lib/drive";
import { p2p } from "@/lib/p2p";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { SignInButton, UserButton, SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import {
    FolderOpen, Download, CloudUpload, CloudDownload,
    Share2, Radio, HardDrive, FileAudio, Package, Menu, LogIn, ExternalLink, Copy, Check, Loader2, RefreshCw
} from "lucide-react";
import { useToast } from "./ui/ToastProvider";
import { useModal } from "./ui/ModalProvider";

export function ProjectControl() {
    const { project, saveProject, loadProject, exportAudio } = useStore();
    const projects = useProjects();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'local' | 'cloud' | 'drive' | 'p2p'>('local');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isSignedIn } = useAuth();

    // P2P State
    const [peerId, setPeerId] = useState<string | null>(null);
    const [isP2PConnectLoading, setIsP2PConnectLoading] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);

    // Drive State
    const [isDriveAuth, setIsDriveAuth] = useState(false);
    const [isDriveSyncing, setIsDriveSyncing] = useState(false);

    const { toast, success, error } = useToast();
    const { alert, confirm, prompt } = useModal();

    // Check Drive Auth on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Basic check if token exists (logic in drive.ts could be improved to expose observable state)
            const token = localStorage.getItem("gdrive_token");
            if (token) setIsDriveAuth(true);
        }
    }, []);



    const handleLoad = async (id: string) => {
        await loadProject(id);
        setIsOpen(false);
        success("Project loaded");
    };

    const handleImportPackage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const newId = await importProjectPackage(file);
            await loadProject(newId);
            setIsOpen(false);
            success("Project imported successfully!");
        } catch (err) {
            console.error(err);
            error("Failed to import project package.");
        }
        if (e.target) e.target.value = ""; // Reset
    };

    const handleExportPackage = async () => {
        try {
            // Ensure saved first
            await saveProject();

            const blob = await exportProjectPackage(project.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.name}.notate`;
            a.click();
            URL.revokeObjectURL(url);
            success("Project exported!");
        } catch (e) {
            console.error(e);
            error("Failed to export package.");
        }
    };

    const handleExportAudio = async () => {
        try {
            await exportAudio();
            // Toast handled in store mostly, but we can add one here if store one is removed
        } catch (e) {
            console.error(e);
            error("Failed to export audio.");
        }
    };

    const handleSyncPush = async () => {
        try {
            await saveProject(); // Save local first
            const db = await import("@/lib/db");
            const dbProject = await db.getProject(project.id);
            if (dbProject) {
                await pushProjectToCloud(dbProject);
                success("Project pushed to cloud!");
            }
        } catch (e) {
            console.error(e);
            error("Failed to push to cloud.");
        }
    };

    const handleSyncPull = async () => {
        try {
            const clouds = await pullProjectsFromCloud();
            alert(`Found ${clouds.length} projects in cloud.`);
        } catch (e) {
            console.error(e);
            error("Failed to pull from cloud.");
        }
    };

    // --- Google Drive Handlers ---

    const handleDriveLogin = async () => {
        try {
            await loginToGoogle();
            setIsDriveAuth(true);
            success("Connected to Google Drive");
        } catch (e) {
            console.error(e);
            error("Drive connection failed");
        }
    };

    const handleDriveLogout = () => {
        logoutFromGoogle();
        setIsDriveAuth(false);
        success("Disconnected from Drive");
    };

    const handleDriveSync = async () => {
        try {
            setIsDriveSyncing(true);
            await saveProject(); // Save local
            const projectData = await import("@/lib/db").then(m => m.getProject(project.id));
            if (projectData) {
                await syncProjectToDrive(projectData);
                success("Synced to 'Notater Projects' in Drive!");
            }
        } catch (e) {
            console.error(e);
            error("Drive sync failed: " + (e as Error).message);
        } finally {
            setIsDriveSyncing(false);
        }
    };

    const handleDriveLoad = async () => {
        try {
            if (!isDriveAuth) await handleDriveLogin();

            const files = await listDriveProjects();
            if (files && files.length > 0) {
                // TODO: Replace with a nicer file picker modal in future
                const choice = await confirm(`Found ${files.length} projects. Load '${files[0].name}'?`);
                if (choice) {
                    const blob = await downloadFromDrive(files[0].id);
                    const file = new File([blob], files[0].name, { type: 'application/zip' });
                    const newId = await importProjectPackage(file);
                    await loadProject(newId);
                    setIsOpen(false);
                    success("Loaded from Drive!");
                }
            } else {
                alert("No Notater projects found in Drive folder.");
            }
        } catch (e) {
            console.error(e);
            error("Drive load failed");
        }
    };

    // --- P2P Handlers ---

    const handleStartSession = async () => {
        try {
            setIsP2PConnectLoading(true);
            const id = await p2p.initialize(true);
            setPeerId(id);
            success("Session started!");
        } catch (e) {
            console.error(e);
            error("Failed to start session.");
        } finally {
            setIsP2PConnectLoading(false);
        }
    };

    const handleJoinSession = async () => {
        const id = await prompt("Enter Host ID to join:");
        if (id) {
            try {
                setIsP2PConnectLoading(true);
                await p2p.initialize(false);
                p2p.connect(id);
                setPeerId("CONNECTED"); // Virtual state for UI
                success("Joined session!");
            } catch (e) {
                console.error(e);
                error("Failed to join session");
            } finally {
                setIsP2PConnectLoading(false);
            }
        }
    };

    const copyPeerId = () => {
        if (peerId) {
            navigator.clipboard.writeText(peerId);
            setHasCopied(true);
            setTimeout(() => setHasCopied(false), 2000);
            toast("Session ID copied!");
        }
    };

    return (
        <div className="relative z-50 flex items-center gap-2">
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                title="Project Menu"
                className={`p-2 rounded-lg border border-border transition-colors ${isOpen ? "bg-primary text-primary-foreground" : "bg-surface hover:bg-surface-hover"}`}
            >
                <Menu size={16} />
            </motion.button>

            <SignedOut>
                <SignInButton mode="modal">
                    <button
                        className="p-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-80"
                        aria-label="Sign In"
                    >
                        <LogIn size={16} />
                    </button>
                </SignInButton>
            </SignedOut>
            <SignedIn>
                <UserButton appearance={{
                    elements: {
                        avatarBox: "w-8 h-8 rounded-lg"
                    }
                }} />
            </SignedIn>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-black/5"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-80 bg-surface/95 backdrop-blur-md border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                            {/* Tabs */}
                            <div className="flex border-b border-border p-1 gap-1">
                                {[
                                    { id: 'local', icon: HardDrive, label: 'Projects' },
                                    { id: 'drive', icon: ExternalLink, label: 'Google Drive' },
                                    { id: 'p2p', icon: Radio, label: 'P2P Session' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as 'local' | 'drive' | 'p2p')}
                                        className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all ${activeTab === tab.id
                                            ? "bg-background shadow-sm text-primary"
                                            : "hover:bg-background/50 text-muted-foreground"
                                            }`}
                                        aria-label={tab.label}
                                        title={tab.label}
                                    >
                                        <tab.icon size={16} />
                                    </button>
                                ))}
                            </div>

                            <div className="p-2">
                                {/* LOCAL TAB */}
                                {activeTab === 'local' && (
                                    <div className="space-y-1">
                                        <div className="text-xs font-bold text-muted-foreground px-2 py-1 mb-1">PROJECT</div>
                                        <button
                                            onClick={handleExportAudio}
                                            className="w-full text-left px-3 py-2 hover:bg-background rounded-lg text-sm flex items-center gap-3 transition-colors"
                                        >
                                            <FileAudio size={16} className="text-pink-500" />
                                            <span>Export Audio (WAV)</span>
                                        </button>
                                        <button
                                            onClick={handleExportPackage}
                                            className="w-full text-left px-3 py-2 hover:bg-background rounded-lg text-sm flex items-center gap-3 transition-colors"
                                        >
                                            <Package size={16} className="text-orange-500" />
                                            <span>Export Package (.notate)</span>
                                        </button>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full text-left px-3 py-2 hover:bg-background rounded-lg text-sm flex items-center gap-3 transition-colors"
                                        >
                                            <FolderOpen size={16} className="text-blue-500" />
                                            <span>Import Package</span>
                                        </button>

                                        {/* CLOUD SYNC SECTION */}
                                        <div className="h-px bg-border my-2" />
                                        <div className="text-xs font-bold text-muted-foreground px-2 py-1 mb-1 flex justify-between items-center">
                                            <span>CLOUD SYNC</span>
                                            {!isSignedIn && (
                                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Not Signed In</span>
                                            )}
                                        </div>

                                        {!isSignedIn ? (
                                            <SignInButton mode="modal">
                                                <button className="w-full py-2 mb-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition-colors">
                                                    Sign In to Sync
                                                </button>
                                            </SignInButton>
                                        ) : (
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={handleSyncPull}
                                                    className="flex-1 w-full text-left px-3 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-sm flex items-center gap-3 shadow-sm cursor-pointer"
                                                >
                                                    <CloudDownload size={16} />
                                                    <span className="font-semibold">Pull from Cloud</span>
                                                </button>
                                                <button
                                                    onClick={handleSyncPush}
                                                    className="flex-0 w-full text-left px-3 py-2 bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground rounded-lg text-xs flex items-center gap-3 transition-colors cursor-pointer"
                                                >
                                                    <CloudUpload size={16} />
                                                    {/* <span>Push to Cloud</span> */}
                                                </button>
                                            </div>
                                        )}

                                        <div className="h-px bg-border my-2" />
                                        <div className="text-xs font-bold text-muted-foreground px-2 py-1 mb-1">SAVED PROJECTS</div>
                                        <div className="max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                            {projects?.length === 0 ? (
                                                <div className="p-4 text-center text-xs opacity-50">No saved projects</div>
                                            ) : (
                                                projects?.map((p) => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => handleLoad(p.id)}
                                                        className={`w-full text-left px-3 py-2 hover:bg-background rounded-lg transition-colors flex flex-col gap-1 ${p.id === project.id ? "bg-primary/10 border border-primary/20" : ""
                                                            }`}
                                                    >
                                                        <div className="font-bold text-xs truncate">{p.name || "Untitled"}</div>
                                                        <div className="flex justify-between items-center w-full">
                                                            <span className="text-[10px] font-mono opacity-50">
                                                                {format(p.updatedAt, "MMM d, HH:mm")}
                                                            </span>
                                                            <span className="text-[10px] font-mono opacity-50 bg-surface-hover px-1 rounded">
                                                                {p.bpm} BPM
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* DRIVE TAB */}
                                {activeTab === 'drive' && (
                                    <div className="space-y-1">
                                        {!isSignedIn ? (
                                            <div className="p-4 text-center">
                                                <p className="text-xs text-muted-foreground mb-4">Sign in to Notater to access Google Drive features.</p>
                                                <SignInButton mode="modal">
                                                    <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold">
                                                        Sign In
                                                    </button>
                                                </SignInButton>
                                            </div>
                                        ) : !isDriveAuth ? (
                                            <div className="p-4 text-center">
                                                <p className="text-xs text-muted-foreground mb-4">Connect Google Drive to sync your projects automatically to a dedicated folder.</p>
                                                <button
                                                    onClick={handleDriveLogin}
                                                    className="w-full py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                                >
                                                    <LogIn size={14} /> Connect Drive
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="px-2 py-1 flex items-center justify-between text-xs mb-2">
                                                    <span className="text-green-500 font-bold flex items-center gap-1">
                                                        <Check size={12} /> Connected
                                                    </span>
                                                    <button onClick={handleDriveLogout} className="text-muted-foreground hover:text-destructive transition-colors text-[10px]">
                                                        Disconnect
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={handleDriveSync}
                                                    disabled={isDriveSyncing}
                                                    className="w-full text-left px-3 py-2 bg-accent/10 hover:bg-accent/20 border border-accent/20 rounded-lg text-sm flex items-center gap-3 transition-colors disabled:opacity-50"
                                                >
                                                    {isDriveSyncing ? (
                                                        <Loader2 size={16} className="animate-spin text-accent" />
                                                    ) : (
                                                        <RefreshCw size={16} className="text-green-500" />
                                                    )}
                                                    <span>Sync to Drive</span>
                                                </button>
                                                <button
                                                    onClick={handleDriveLoad}
                                                    className="w-full text-left px-3 py-2 hover:bg-background rounded-lg text-sm flex items-center gap-3"
                                                >
                                                    <Download size={16} className="text-muted-foreground" />
                                                    <span>Open from Drive</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* P2P TAB */}
                                {activeTab === 'p2p' && (
                                    <div className="space-y-2 p-2">
                                        {peerId ? (
                                            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                                <div className="text-[10px] font-bold text-primary mb-1 flex justify-between items-center">
                                                    <span>SESSION ID</span>
                                                    <button onClick={copyPeerId} className="text-primary hover:text-primary/80 transition-colors">
                                                        {hasCopied ? <Check size={12} /> : <Copy size={12} />}
                                                    </button>
                                                </div>
                                                <div className="text-xs font-mono break-all select-all bg-background p-2 rounded border border-border flex items-center justify-between gap-2">
                                                    <span className="truncate">{peerId}</span>
                                                </div>
                                                <div className="text-[10px] text-muted-foreground mt-2 text-center">
                                                    Share this ID with a friend to jam.
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={handleStartSession}
                                                    disabled={isP2PConnectLoading}
                                                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                                                >
                                                    {isP2PConnectLoading ? <Loader2 size={16} className="animate-spin" /> : <Radio size={16} />}
                                                    Host Session
                                                </button>
                                                <div className="relative">
                                                    <div className="absolute inset-x-0 top-1/2 h-px bg-border"></div>
                                                    <div className="relative text-center"><span className="bg-surface px-2 text-[10px] text-muted-foreground">OR</span></div>
                                                </div>
                                                <button
                                                    onClick={handleJoinSession}
                                                    disabled={isP2PConnectLoading}
                                                    className="w-full py-2 bg-muted text-foreground rounded-lg text-xs font-bold hover:bg-muted/80 flex items-center justify-center gap-2 border border-border disabled:opacity-50"
                                                >
                                                    {isP2PConnectLoading ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                                                    Join Session
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            {/* Hidden Input for Import */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".notate,.zip"
                onChange={handleImportPackage}
                aria-label="Import Project Package"
            />
        </div >
    );
}
