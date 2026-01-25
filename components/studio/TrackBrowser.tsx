"use client";

import { useState, useEffect } from "react";
import { useProjects } from "@/lib/hooks/useProjects";
import { useTracks } from "@/lib/hooks/useTracks";
import type { Track, ProjectWithTrackCount } from "@/lib/types/tracks";

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
  const [newProjectName, setNewProjectName] = useState("");
  const [newTrackName, setNewTrackName] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewTrack, setShowNewTrack] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const {
    tracks,
    loading: tracksLoading,
    createTrack,
    deleteTrack,
    updateTrack,
  } = useTracks(selectedProjectId);

  // Auto-expand first project when projects load - intentional one-time initialization
  useEffect(() => {
    if (projects.length > 0 && expandedProjects.size === 0) {
      // This is intentional initialization when data first loads
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedProjects(new Set([projects[0].id]));

      setSelectedProjectId(projects[0].id);
    }
  }, [projects, expandedProjects.size]);

  if (!isOpen) return null;

  const toggleExpanded = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
        setSelectedProjectId(projectId);
      }
      return next;
    });
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    const project = await createProject(newProjectName.trim());
    if (project) {
      setNewProjectName("");
      setShowNewProject(false);
      setExpandedProjects((prev) => new Set(prev).add(project.id));
      setSelectedProjectId(project.id);
    }
  };

  const handleCreateTrack = async (projectId: string) => {
    if (!newTrackName.trim()) return;
    const track = await createTrack(projectId, newTrackName.trim());
    if (track) {
      setNewTrackName("");
      setShowNewTrack(false);
      onSelectTrack(track);
    }
  };

  const handleRenameProject = async (project: ProjectWithTrackCount) => {
    if (!editName.trim() || editName === project.name) {
      setEditingProjectId(null);
      return;
    }
    await updateProject(project.id, editName.trim());
    setEditingProjectId(null);
  };

  const handleRenameTrack = async (track: Track) => {
    if (!editName.trim() || editName === track.name) {
      setEditingTrackId(null);
      return;
    }
    await updateTrack(track.id, { name: editName.trim() });
    setEditingTrackId(null);
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
          {/* Offline/cached data indicator */}
          {isUsingCache && projects.length > 0 && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
              <p className="text-slate-400 mb-4">No projects yet</p>
              <button
                onClick={() => setShowNewProject(true)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
              >
                Create Your First Project
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Projects List */}
              {projects.map((project) => (
                <div key={project.id} className="group">
                  {/* Project Header */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors">
                    <button
                      onClick={() => toggleExpanded(project.id)}
                      className="text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          expandedProjects.has(project.id) ? "rotate-90" : ""
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {editingProjectId === project.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleRenameProject(project)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameProject(project);
                          if (e.key === "Escape") setEditingProjectId(null);
                        }}
                        className="flex-1 px-2 py-1 bg-slate-600 border border-cyan-500/50 rounded text-white text-sm focus:outline-none focus:border-cyan-400"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="flex-1 text-white font-medium cursor-pointer"
                        onClick={() => toggleExpanded(project.id)}
                      >
                        {project.name}
                      </span>
                    )}

                    <span className="text-xs text-slate-500">
                      {project.track_count} track{project.track_count !== 1 ? "s" : ""}
                    </span>

                    {/* Project Actions */}
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingProjectId(project.id);
                          setEditName(project.name);
                        }}
                        className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                        title="Rename"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this project and all its tracks?")) {
                            deleteProject(project.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Tracks List (expanded) */}
                  {expandedProjects.has(project.id) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {tracksLoading && selectedProjectId === project.id ? (
                        <div className="text-sm text-slate-500 py-2 pl-4">Loading tracks...</div>
                      ) : (
                        <>
                          {tracks.map((track) => (
                            <div
                              key={track.id}
                              className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                                currentTrackId === track.id
                                  ? "bg-cyan-600/20 border border-cyan-500/50"
                                  : "hover:bg-slate-700/50"
                              }`}
                              onClick={() => onSelectTrack(track)}
                            >
                              <svg
                                className="w-4 h-4 text-cyan-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                                />
                              </svg>

                              {editingTrackId === track.id ? (
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  onBlur={() => handleRenameTrack(track)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleRenameTrack(track);
                                    if (e.key === "Escape") setEditingTrackId(null);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex-1 px-2 py-1 bg-slate-600 border border-cyan-500/50 rounded text-white text-sm focus:outline-none focus:border-cyan-400"
                                  autoFocus
                                />
                              ) : (
                                <span className="flex-1 text-slate-200 text-sm">{track.name}</span>
                              )}

                              {/* Track Actions */}
                              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTrackId(track.id);
                                    setEditName(track.name);
                                  }}
                                  className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                                  title="Rename"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Delete this track?")) {
                                      deleteTrack(track.id);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                                  title="Delete"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* New Track Form */}
                          {showNewTrack && selectedProjectId === project.id ? (
                            <div className="flex items-center gap-2 px-3 py-2">
                              <input
                                type="text"
                                value={newTrackName}
                                onChange={(e) => setNewTrackName(e.target.value)}
                                placeholder="Track name..."
                                className="flex-1 px-3 py-1.5 bg-slate-700 border border-cyan-500/30 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleCreateTrack(project.id);
                                  if (e.key === "Escape") {
                                    setShowNewTrack(false);
                                    setNewTrackName("");
                                  }
                                }}
                              />
                              <button
                                onClick={() => handleCreateTrack(project.id)}
                                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg transition-colors"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => {
                                  setShowNewTrack(false);
                                  setNewTrackName("");
                                }}
                                className="px-3 py-1.5 text-slate-400 hover:text-white text-sm transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedProjectId(project.id);
                                setShowNewTrack(true);
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                              New Track
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* New Project Form */}
              {showNewProject ? (
                <div className="flex items-center gap-2 px-3 py-2 mt-4 border-t border-slate-700 pt-4">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Project name..."
                    className="flex-1 px-3 py-2 bg-slate-700 border border-cyan-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateProject();
                      if (e.key === "Escape") {
                        setShowNewProject(false);
                        setNewProjectName("");
                      }
                    }}
                  />
                  <button
                    onClick={handleCreateProject}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowNewProject(false);
                      setNewProjectName("");
                    }}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewProject(true)}
                  className="flex items-center gap-2 w-full px-3 py-3 mt-2 text-cyan-400 hover:text-cyan-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  New Project
                </button>
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
    </div>
  );
}
