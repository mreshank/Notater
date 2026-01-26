import { useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { useProjects } from "@/lib/db-hooks";
import { exportProjectPackage, importProjectPackage } from "@/lib/sync";
import { pushProjectToCloud, pullProjectsFromCloud } from "@/lib/cloud-sync";
import { loginToGoogle, uploadProjectToDrive, listDriveProjects, downloadFromDrive } from "@/lib/drive";
import { p2p } from "@/lib/p2p";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { SignInButton, UserButton, SignedIn, SignedOut, useAuth } from "@clerk/nextjs";

export function ProjectControl() {
    const { project, saveProject, loadProject, exportAudio, isLoading } = useStore();
    const projects = useProjects();
    const [isOpen, setIsOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isSignedIn } = useAuth();
    const [peerId, setPeerId] = useState<string | null>(null);

    const handleSave = async () => {
        await saveProject();
    };

    const handleLoad = async (id: string) => {
        await loadProject(id);
        setIsOpen(false);
        setIsOpen(false);
    };

    const handleImportPackage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const newId = await importProjectPackage(file);
            await loadProject(newId);
            setIsOpen(false);
            alert("Project imported successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to import project package.");
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
        } catch (e) {
            console.error(e);
            alert("Failed to export package.");
        }
    };

    const handleSyncPush = async () => {
        try {
            await saveProject(); // Save local first
            // Just for MVP, we rely on the fact that `project` in store has ID.
            const db = await import("@/lib/db");
            const dbProject = await db.getProject(project.id);
            if (dbProject) {
                await pushProjectToCloud(dbProject);
                alert("Project pushed to cloud!");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to push to cloud.");
        }
    };

    const handleSyncPull = async () => {
        try {
            // In real app, show a list to pick from.
            // For now, just fetching list and showing first one or alert count
            const clouds = await pullProjectsFromCloud();
            alert(`Found ${clouds.length} projects in cloud.`);
        } catch (e) {
            console.error(e);
            alert("Failed to pull from cloud.");
        }
    };

    const handleDriveSave = async () => {
        try {
            if (!window.gapi?.client.getToken()) {
                await loginToGoogle();
            }
            await saveProject();
            const projectData = await import("@/lib/db").then(m => m.getProject(project.id));
            if (projectData) {
                await uploadProjectToDrive(projectData);
                alert("Saved to Google Drive!");
            }
        } catch (e) {
            console.error(e);
            alert("Drive upload failed");
        }
    };

    const handleDriveLoad = async () => {
        try {
            if (!window.gapi?.client.getToken()) {
                await loginToGoogle();
            }
            const files = await listDriveProjects();
            // MVP: Just pick the first one or alert
            if (files && files.length > 0) {
                const choice = confirm(`Found ${files.length} projects. Load '${files[0].name}'?`);
                if (choice) {
                    const blob = await downloadFromDrive(files[0].id);
                    // Import package expects a File, but Blob is fine if cast or we fix signature
                    // Actually importProjectPackage takes File.
                    const file = new File([blob], files[0].name, { type: 'application/zip' });
                    const newId = await importProjectPackage(file);
                    await loadProject(newId);
                    setIsOpen(false);
                    alert("Loaded from Drive!");
                }
            } else {
                alert("No Notate projects found in Drive.");
            }
        } catch (e) {
            console.error(e);
            alert("Drive load failed");
        }
    };

    const handleStartSession = async () => {
        try {
            const id = await p2p.initialize(true);
            setPeerId(id);
            alert(`Session Started! Share this ID:\n\n${id}`);
        } catch (e) {
            console.error(e);
            alert("Failed to start session.");
        }
    };

    const handleJoinSession = () => {
        const id = prompt("Enter Host ID to join:");
        if (id) {
            p2p.initialize(false).then(() => {
                p2p.connect(id);
                setPeerId("CONNECTED"); // Virtual state
                alert("Joined session!");
            });
        }
    };


    return (
        <div className="relative z-50">
            <div className="flex items-center gap-2">
                <div className="flex flex-col items-end mr-2">
                    <span className="text-xs font-bold text-foreground/80">{project.name}</span>
                    <span className="text-[10px] text-foreground/40 font-mono">
                        {isLoading ? "Saving..." : "Ready"}
                    </span>
                </div>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-bold hover:opacity-90 disabled:opacity-50"
                >
                    {isLoading ? "..." : "SAVE"}
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(!isOpen)}
                    className="px-3 py-1.5 bg-surface hover:bg-surface-hover rounded text-xs font-bold border border-border"
                >
                    OPEN
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => exportAudio()}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-accent/20 hover:bg-accent/30 text-accent-foreground rounded text-xs font-bold border border-accent/20 disabled:opacity-50"
                >
                    EXPORT
                </motion.button>

                <div className="h-6 w-px bg-border mx-1"></div>

                <SignedOut>
                    <SignInButton mode="modal">
                        <button className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-bold hover:opacity-80">
                            SIGN IN
                        </button>
                    </SignInButton>
                </SignedOut>
                <SignedIn>
                    <UserButton />
                </SignedIn>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden"
                        >
                            <div className="p-2 border-b border-border bg-background/50">
                                <h3 className="text-xs font-bold opacity-50">ACTIONS</h3>
                            </div>
                            <div>
                                <button
                                    onClick={handleExportPackage}
                                    className="w-full text-left px-4 py-2 hover:bg-background text-sm flex items-center gap-2 group border-b border-border/50"
                                >
                                    <span>📦</span> <span>Export Package</span>
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full text-left px-4 py-2 hover:bg-background text-sm flex items-center gap-2 group"
                                >
                                    <span>📥</span> <span>Import Package</span>
                                </button>
                            </div>

                            <div className="p-2 border-b border-border bg-background/50 border-t">
                                <h3 className="text-xs font-bold opacity-50">GOOGLE DRIVE</h3>
                            </div>
                            <div>
                                <button
                                    onClick={handleDriveSave}
                                    className="w-full text-left px-4 py-2 hover:bg-background text-sm flex items-center gap-2 group border-b border-border/50"
                                >
                                    <span>💾</span> <span>Save to Drive</span>
                                </button>
                                <button
                                    onClick={handleDriveLoad}
                                    className="w-full text-left px-4 py-2 hover:bg-background text-sm flex items-center gap-2 group"
                                >
                                    <span>📂</span> <span>Open from Drive</span>
                                </button>
                            </div>

                            <div className="p-2 border-b border-border bg-background/50 border-t">
                                <h3 className="text-xs font-bold opacity-50">LIVE SESSION (P2P)</h3>
                            </div>
                            <div>
                                {peerId ? (
                                    <div className="px-4 py-2 text-xs font-mono break-all bg-primary/10 select-all">
                                        ID: {peerId}
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleStartSession}
                                            className="w-full text-left px-4 py-2 hover:bg-background text-sm flex items-center gap-2 group border-b border-border/50"
                                        >
                                            <span>📡</span> <span>Host Session</span>
                                        </button>
                                        <button
                                            onClick={handleJoinSession}
                                            className="w-full text-left px-4 py-2 hover:bg-background text-sm flex items-center gap-2 group"
                                        >
                                            <span>🔗</span> <span>Join Session</span>
                                        </button>
                                    </>
                                )}
                            </div>

                            {isSignedIn && (
                                <>
                                    <div className="p-2 border-b border-border bg-background/50 border-t">
                                        <h3 className="text-xs font-bold opacity-50">CLOUD SYNC</h3>
                                    </div>
                                    <div>
                                        <button
                                            onClick={handleSyncPush}
                                            className="w-full text-left px-4 py-2 hover:bg-background text-sm flex items-center gap-2 group border-b border-border/50"
                                        >
                                            <span>☁️</span> <span>Push to Cloud</span>
                                        </button>
                                        <button
                                            onClick={handleSyncPull}
                                            className="w-full text-left px-4 py-2 hover:bg-background text-sm flex items-center gap-2 group"
                                        >
                                            <span>🌩</span> <span>Pull from Cloud</span>
                                        </button>
                                    </div>
                                </>
                            )}

                            <div className="p-2 border-b border-border bg-background/50 border-t">
                                <h3 className="text-xs font-bold opacity-50">SAVED PROJECTS</h3>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                {projects?.length === 0 ? (
                                    <div className="p-4 text-center text-xs opacity-50">No saved projects</div>
                                ) : (
                                    projects?.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => handleLoad(p.id)}
                                            className={`w-full text-left px-4 py-3 hover:bg-background transition-colors border-b border-border/50 last:border-0 ${p.id === project.id ? "bg-primary/10" : ""
                                                }`}
                                        >
                                            <div className="font-bold text-sm truncate">{p.name || "Untitled"}</div>
                                            <div className="flex justify-between items-center mt-1">
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
        </div>
    );
}
