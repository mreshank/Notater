import { useEffect } from "react";
import { useStore } from "./store";
import { useAuth } from "@clerk/nextjs";
import { StoredProject, getSample } from "./db";
import { PutBlobResult } from "@vercel/blob";

// Simple sync hook
export function useCloudSync() {
    const { isSignedIn, userId } = useAuth();
    const { project, saveProject, loadProject } = useStore();

    // Push local changes to cloud
    
    const syncToCloud = async () => {
        if (!isSignedIn) return;
        
        // MVP: Just exposing the API callers for now.
        // In a real app we'd grab the full state and push it.
    };

    return {
        syncToCloud
    };
}

export async function uploadSampleToBlob(file: Blob, name: string): Promise<string> {
    const res = await fetch(`/api/upload?filename=${encodeURIComponent(name)}`, {
        method: "POST",
        body: file,
    });
    if (!res.ok) throw new Error("Upload failed");
    const blob: PutBlobResult = await res.json();
    return blob.url;
}

export async function pushProjectToCloud(project: StoredProject) {
    const data = JSON.parse(project.data);
    
    // 1. Check for samples that need uploading
    // We look for 'trackSampleIds'
    if (data.trackSampleIds) {
        // We'll store cloud URLs in 'trackSampleUrls' in the JSON
        const trackSampleUrls: Record<string, string> = data.trackSampleUrls || {};
        let changed = false;

        for (const [trackId, sampleId] of Object.entries(data.trackSampleIds as Record<string, string>)) {
            // If we already have a URL for this track's sample, skip?
            // But maybe sampleId changed.
            // Let's assume sampleId is unique per content.
            
            // If we don't have a URL for this sample ID yet (or map is by trackId)
            // Ideally we map sampleId -> URL to dedupe.
            // But for MVP, let's map trackId -> URL.
            
            if (!trackSampleUrls[trackId]) {
                 // Need to upload
                 const sample = await getSample(sampleId);
                 if (sample && sample.data) {
                     console.log(`Uploading sample for ${trackId}...`);
                     const url = await uploadSampleToBlob(sample.data, sample.name);
                     trackSampleUrls[trackId] = url;
                     changed = true;
                 }
            }
        }

        if (changed) {
            data.trackSampleUrls = trackSampleUrls;
            project.data = JSON.stringify(data);
        }
    }

    const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project)
    });
    if (!res.ok) throw new Error("Sync failed");
    return res.json();
}

export async function pullProjectsFromCloud() {
    const res = await fetch("/api/sync");
    if (!res.ok) throw new Error("Fetch failed");
    return res.json();
}
