"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProjectWithTrackCount } from "@/lib/types/tracks";
import { getCache, setCache } from "@/lib/storage/localCache";

const PROJECTS_CACHE_KEY = "projects";
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

/**
 * Get a user-friendly error message based on error type
 */
function getFriendlyErrorMessage(error: unknown, status?: number): string {
  // Network errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return "Unable to connect. Check your internet connection.";
  }

  // HTTP status-based messages
  if (status) {
    switch (status) {
      case 401:
        return "Please sign in to view your projects.";
      case 403:
        return "You don't have permission to view these projects.";
      case 404:
        return "Could not find your projects.";
      case 500:
      case 502:
      case 503:
        return "Server error. Please try again later.";
      default:
        if (status >= 400 && status < 500) {
          return "There was a problem with your request.";
        }
        if (status >= 500) {
          return "Server error. Please try again later.";
        }
    }
  }

  return "Unable to load projects. Please try again.";
}

export interface UseProjectsResult {
  projects: ProjectWithTrackCount[];
  loading: boolean;
  error: string | null;
  isUsingCache: boolean;
  refresh: () => Promise<void>;
  createProject: (name: string) => Promise<ProjectWithTrackCount | null>;
  updateProject: (id: string, name: string) => Promise<ProjectWithTrackCount | null>;
  deleteProject: (id: string) => Promise<boolean>;
}

export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<ProjectWithTrackCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingCache, setIsUsingCache] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsUsingCache(false);

      const res = await fetch("/api/projects");

      if (!res.ok) {
        if (res.status === 401) {
          setProjects([]);
          return;
        }
        // Try to use cached projects on error
        const cached = getCache<ProjectWithTrackCount[]>(PROJECTS_CACHE_KEY);
        if (cached && cached.length > 0) {
          setProjects(cached);
          setIsUsingCache(true);
          setError(getFriendlyErrorMessage(null, res.status));
          return;
        }
        throw { status: res.status };
      }

      const data = await res.json();
      const fetchedProjects = data.projects || [];
      setProjects(fetchedProjects);

      // Cache successful response
      if (fetchedProjects.length > 0) {
        setCache(PROJECTS_CACHE_KEY, fetchedProjects, CACHE_TTL_MS);
      }
    } catch (err) {
      // Try to use cached projects on error
      const cached = getCache<ProjectWithTrackCount[]>(PROJECTS_CACHE_KEY);
      if (cached && cached.length > 0) {
        setProjects(cached);
        setIsUsingCache(true);
        const status = (err as { status?: number })?.status;
        setError(getFriendlyErrorMessage(err, status));
        return;
      }

      const status = (err as { status?: number })?.status;
      setError(getFriendlyErrorMessage(err, status));
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(async (name: string): Promise<ProjectWithTrackCount | null> => {
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
  }, []);

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
        setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...data.project } : p)));

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
    isUsingCache,
    refresh: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}
