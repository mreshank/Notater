/**
 * IndexedDB Storage with Dexie.js
 * 
 * Provides offline-first project persistence.
 */
import Dexie, { type EntityTable } from "dexie";

// Simplified project schema for storage
export interface StoredProject {
  id: string;
  name: string;
  bpm: number;
  createdAt: number;
  updatedAt: number;
  data: string; // JSON serialized pattern data
}

export interface StoredSequence {
  id: string;
  projectId: string;
  name: string;
  grid: string; // JSON serialized grid state
  createdAt: number;
}

export interface StoredSample {
  id: string;
  name: string;
  data: Blob;
  mimeType: string;
  createdAt: number;
}

// Define the database
class NotaterDB extends Dexie {
  projects!: EntityTable<StoredProject, "id">;
  sequences!: EntityTable<StoredSequence, "id">;
  samples!: EntityTable<StoredSample, "id">;

  constructor() {
    super("NotaterDB");
    
    this.version(1).stores({
      projects: "id, name, updatedAt",
      sequences: "id, projectId, name",
    });
    
    // Explicitly add samples table if upgrading from v1
    this.version(2).stores({
      samples: "id, name"
    });
  }
}

// Singleton database instance
export const db = new NotaterDB();

// Helper functions
export async function saveProject(project: StoredProject): Promise<void> {
  await db.projects.put({
    ...project,
    updatedAt: Date.now(),
  });
}

export async function getProject(id: string): Promise<StoredProject | undefined> {
  return db.projects.get(id);
}

export async function getAllProjects(): Promise<StoredProject[]> {
  return db.projects.orderBy("updatedAt").reverse().toArray();
}

export async function deleteProject(id: string): Promise<void> {
  await db.projects.delete(id);
  // Also delete associated sequences
  await db.sequences.where("projectId").equals(id).delete();
}

export async function saveSequence(sequence: StoredSequence): Promise<void> {
  await db.sequences.put(sequence);
}

export async function getSequencesByProject(projectId: string): Promise<StoredSequence[]> {
  return db.sequences.where("projectId").equals(projectId).toArray();
}

export async function saveSample(sample: StoredSample): Promise<void> {
  await db.samples.put(sample);
}

export async function getSample(id: string): Promise<StoredSample | undefined> {
  return db.samples.get(id);
}

// Generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
