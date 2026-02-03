/**
 * React hooks for database operations
 */
"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db, getAllProjects } from "@notater/core";

/**
 * Hook to get all projects (reactive)
 */
export function useProjects() {
  return useLiveQuery(() => getAllProjects(), []);
}

/**
 * Hook to get a single project by ID (reactive)
 */
export function useProject(id: string | null) {
  return useLiveQuery(
    () => (id ? db.projects.get(id) : undefined),
    [id]
  );
}

/**
 * Hook to get sequences for a project (reactive)
 */
export function useSequences(projectId: string | null) {
  return useLiveQuery(
    () => (projectId ? db.sequences.where("projectId").equals(projectId).toArray() : []),
    [projectId]
  );
}
