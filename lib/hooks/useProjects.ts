"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProjectWithTrackCount } from "@/lib/types/tracks";

export interface UseProjectsResult {
  projects: ProjectWithTrackCount[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createProject: (name: string) => Promise<ProjectWithTrackCount | null>;
  updateProject: (id: string, name: string) => Promise<ProjectWithTrackCount | null>;
  deleteProject: (id: string) => Promise<boolean>;
}

export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<ProjectWithTrackCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/projects");

      if (!res.ok) {
        if (res.status === 401) {
          setProjects([]);
          return;
        }
        throw new Error("Failed to fetch projects");
      }

      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(
    async (name: string): Promise<ProjectWithTrackCount | null> => {
      try {
        setError(null);

        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create project");
        }

        const data = await res.json();
        const newProject = { ...data.project, track_count: 0 };

        // Add to local state
        setProjects((prev) => [newProject, ...prev]);

        return newProject;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create project");
        return null;
      }
    },
    []
  );

  const updateProject = useCallback(
    async (id: string, name: string): Promise<ProjectWithTrackCount | null> => {
      try {
        setError(null);

        const res = await fetch(`/api/projects/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update project");
        }

        const data = await res.json();

        // Update in local state
        setProjects((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, ...data.project } : p
          )
        );

        return data.project;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update project");
        return null;
      }
    },
    []
  );

  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);

      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete project");
      }

      // Remove from local state
      setProjects((prev) => prev.filter((p) => p.id !== id));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
      return false;
    }
  }, []);

  return {
    projects,
    loading,
    error,
    refresh: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}
