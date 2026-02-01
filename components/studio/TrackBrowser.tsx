"use client";

import { useState, useEffect } from "react";
import { useProjects } from "@/lib/hooks/useProjects";
import { useTracks } from "@/lib/hooks/useTracks";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProjectListItem } from "./ProjectListItem";
import { TrackListItem } from "./TrackListItem";
import { NewTrackForm } from "./NewTrackForm";
import { NewTrackButton } from "./NewTrackButton";
import { NewProjectForm } from "./NewProjectForm";
import { NewProjectButton } from "./NewProjectButton";
import type { Track } from "@/lib/types/tracks";

interface TrackBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack: (track: Track) => void;
  currentTrackId: string | null;
}

export function TrackBrowser({
  isOpen,
  onClose,
  onSelectTrack,
  currentTrackId,
}: TrackBrowserProps) {
  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    isUsingCache,
    refresh: refreshProjects,
    createProject,
    deleteProject,
    updateProject,
  } = useProjects();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewTrack, setShowNewTrack] = useState(false);
  const { confirm, dialogProps } = useConfirmDialog();

  const {
    tracks,
    loading: tracksLoading,
    createTrack,
    deleteTrack,
    updateTrack,
  } = useTracks(selectedProjectId);

  useEffect(() => {
    if (isOpen) {
      refreshProjects();
    }
  }, [isOpen, refreshProjects]);

  useEffect(() => {
    if (projects.length > 0 && expandedProjects.size === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedProjects(new Set([projects[0].id]));
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, expandedProjects.size]);

  if (!isOpen) return null;

  const toggleExpanded = (projectId: string) => {
    setExpandedProjects((prev) => {
      if (prev.has(projectId)) {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      } else {
        setSelectedProjectId(projectId);
        return new Set([projectId]);
      }
    });
  };

  const handleCreateProject = async (name: string) => {
    const project = await createProject(name);
    if (project) {
      setShowNewProject(false);
      setExpandedProjects((prev) => new Set(prev).add(project.id));
      setSelectedProjectId(project.id);
    }
  };

  const handleCreateTrack = async (projectId: string, name: string) => {
    const track = await createTrack(projectId, name);
    if (track) {
      setShowNewTrack(false);
      onSelectTrack(track);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const confirmed = await confirm({
      title: "Delete Project",
      message: "Delete this project and all its tracks? This action cannot be undone.",
      variant: "danger",
    });
    if (confirmed) {
      deleteProject(projectId);
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    const confirmed = await confirm({
      title: "Delete Track",
      message: "Delete this track? This action cannot be undone.",
      variant: "danger",
    });
    if (confirmed) {
      deleteTrack(trackId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-cyan-300">My Tracks</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {isUsingCache && projects.length > 0 && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="text-sm text-amber-300">Showing cached data</span>
              </div>
              <button
                onClick={refreshProjects}
                className="text-xs text-amber-400 hover:text-amber-300 underline transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {projectsLoading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : projectsError && projects.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-rose-400 mb-4">{projectsError}</div>
              <button
                onClick={refreshProjects}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : projects.length === 0 && !showNewProject ? (
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 mx-auto mb-4 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
              <p className="text-slate-300 font-medium mb-2">No saved tracks yet</p>
              <p className="text-slate-500 text-sm mb-4">Save your first track to see it here</p>
              <button
                onClick={() => setShowNewProject(true)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
              >
                Create a Project
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <ProjectListItem
                  key={project.id}
                  project={project}
                  isExpanded={expandedProjects.has(project.id)}
                  onToggleExpand={() => toggleExpanded(project.id)}
                  onRename={(name) => updateProject(project.id, name)}
                  onDelete={() => handleDeleteProject(project.id)}
                >
                  {tracksLoading ? (
                    <div className="text-sm text-slate-500 py-2 pl-4">Loading tracks...</div>
                  ) : (
                    <>
                      {tracks.map((track) => (
                        <TrackListItem
                          key={track.id}
                          track={track}
                          isSelected={currentTrackId === track.id}
                          onSelect={() => onSelectTrack(track)}
                          onRename={(name) => updateTrack(track.id, { name })}
                          onDelete={() => handleDeleteTrack(track.id)}
                        />
                      ))}
                      {showNewTrack && selectedProjectId === project.id ? (
                        <NewTrackForm
                          onSubmit={(name) => handleCreateTrack(project.id, name)}
                          onCancel={() => setShowNewTrack(false)}
                        />
                      ) : (
                        <NewTrackButton
                          onClick={() => {
                            setSelectedProjectId(project.id);
                            setShowNewTrack(true);
                          }}
                        />
                      )}
                    </>
                  )}
                </ProjectListItem>
              ))}

              {showNewProject ? (
                <NewProjectForm
                  onSubmit={handleCreateProject}
                  onCancel={() => setShowNewProject(false)}
                />
              ) : (
                <NewProjectButton onClick={() => setShowNewProject(true)} />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white transition-all duration-200 shadow-lg shadow-cyan-500/20"
          >
            Close
          </button>
        </div>
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
