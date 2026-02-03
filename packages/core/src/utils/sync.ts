import JSZip from "jszip";
import { db, saveProject, saveSample, getSample, generateId, StoredProject, StoredSample } from "../db";

/**
 * Export the entire project as a .notate package (ZIP)
 */
export async function exportProjectPackage(projectId: string): Promise<Blob> {
    const project = await db.projects.get(projectId);
    if (!project) throw new Error("Project not found");

    const zip = new JSZip();

    // 1. Add Project Metadata
    zip.file("project.json", JSON.stringify(project, null, 2));

    // 2. Add Samples
    const samplesFolder = zip.folder("samples");
    const data = JSON.parse(project.data);
    const trackSampleIds = data.trackSampleIds || {};

    // Collect all unique sample IDs used in the project
    const sampleIds = new Set<string>(Object.values(trackSampleIds));

    for (const sampleId of sampleIds) {
        const sample = await getSample(sampleId as string);
        if (sample && sample.data) {
             // We use the ID as the filename to keep references intact
             // We can append extension if we know it, or just keep it bare
             const ext = sample.mimeType.split('/')[1] || 'bin';
             samplesFolder?.file(`${sample.id}.${ext}`, sample.data);
             
             // We might need a manifest to map IDs to filenames if extensions vary
             // But simpler: just store mimeType separately?
             // Actually, let's include a samples.json manifest
        }
    }
    
    // Create manifest for sample metadata (names, mimeTypes)
    const samplesManifest: StoredSample[] = [];
    for (const sampleId of sampleIds) {
        const sample = await getSample(sampleId as string);
        if (sample) {
            samplesManifest.push(sample);
        }
    }
    zip.file("samples.json", JSON.stringify(samplesManifest, null, 2));

    // Generate ZIP
    return await zip.generateAsync({ type: "blob" });
}

/**
 * Import a .notate package
 * Returns the new Project ID
 */
export async function importProjectPackage(file: File): Promise<string> {
    const zip = await JSZip.loadAsync(file);
    
    // 1. Read Project
    const projectFile = zip.file("project.json");
    if (!projectFile) throw new Error("Invalid .notate file: missing project.json");
    
    const projectJson = await projectFile.async("string");
    const project: StoredProject = JSON.parse(projectJson);
    
    // Generate new Project ID to avoid collisions
    const newProjectId = generateId();
    project.id = newProjectId;
    project.name = `${project.name} (Imported)`;
    project.updatedAt = Date.now();
    
    // 2. Read Samples
    const manifestFile = zip.file("samples.json");
    if (manifestFile) {
        const manifestJson = await manifestFile.async("string");
        const samples: StoredSample[] = JSON.parse(manifestJson);
        
        for (const sampleMeta of samples) {
            // Check if sample already exists by content? 
            // For now, just re-import always to be safe, but maybe overwrite if ID matches?
            // IDs might collide if we exported from same DB.
            // Best practice: Check if ID exists. If so, skip? Or overwrite? 
            // If it's the exact same ID, it's likely the same sample.
            const existing = await getSample(sampleMeta.id);
            if (!existing) {
                // Read blob from zip
                const ext = sampleMeta.mimeType.split('/')[1] || 'bin';
                const fileData = await zip.file(`samples/${sampleMeta.id}.${ext}`)?.async("blob");
                
                if (fileData) {
                    await saveSample({
                        ...sampleMeta,
                        data: fileData
                    });
                }
            }
        }
    }
    
    // 3. Save Project
    // Update IDs in project data if we were regenerating sample IDs, but we kept them.
    await saveProject(project);
    
    return newProjectId;
}
