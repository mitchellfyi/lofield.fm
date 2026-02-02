"use client";

import { useState, useCallback, useRef } from "react";
import { useTracks, useAutoSave } from "@/lib/hooks/useTracks";
import { useDraftTrack } from "@/lib/hooks/useDraftTrack";
import { useRevisions } from "@/lib/hooks/useRevisions";
import { useProjects } from "@/lib/hooks/useProjects";
import { useRecordings } from "@/lib/hooks/useRecordings";
import { type TweaksConfig, DEFAULT_TWEAKS } from "@/lib/types/tweaks";
import { DEFAULT_LAYERS } from "@/lib/types/audioLayer";
import { extractTweaks } from "@/lib/audio/tweaksInjector";
import { DEFAULT_CODE } from "@/lib/audio/defaultCode";
import type { Track, Revision } from "@/lib/types/tracks";
import type { Recording } from "@/lib/types/recording";
import type { HistorySnapshot } from "@/lib/hooks/useStudioEditor";

/**
 * Options for useStudioTracks hook
 */
export interface UseStudioTracksOptions {
  /** Callback to show toast notifications */
  showToast: (message: string, type: "info" | "success" | "error") => void;
  /** Callback to get current code */
  getCode: () => string;
  /** Callback to set code */
  setCode: (code: string) => void;
  /** Callback to set tweaks */
  setTweaks: (tweaks: TweaksConfig) => void;
  /** Callback to reset history */
  resetHistory: (snapshot: HistorySnapshot) => void;
}

/**
 * Result from useStudioTracks hook
 */
export interface UseStudioTracksResult {
  // Current track state
  currentTrackId: string | null;
  currentTrackName: string | null;
  selectedProjectId: string | null;
  hasUnsavedChanges: boolean;

  // Modal state
  showTrackBrowser: boolean;
  setShowTrackBrowser: (show: boolean) => void;
  showSaveAsModal: boolean;
  setShowSaveAsModal: (show: boolean) => void;
  saveAsName: string;
  setSaveAsName: (name: string) => void;
  showRevisionHistory: boolean;
  setShowRevisionHistory: (show: boolean) => void;

  // Save state
  saving: boolean;
  autoSaving: boolean;

  // Data from hooks
  projects: ReturnType<typeof useProjects>["projects"];
  revisions: Revision[];
  recordings: Recording[];
  recordingsLoading: boolean;

  // Recording management
  createRecording: (
    durationMs: number,
    events: Recording["events"],
    name?: string
  ) => Promise<Recording | null>;
  updateRecording: (
    id: string,
    updates: { name?: string; events?: Recording["events"] }
  ) => Promise<Recording | null>;
  deleteRecording: (id: string) => Promise<boolean>;

  // Revision management
  createRevision: (code: string, message?: string | null) => Promise<Revision | null>;

  // Handlers
  handleSelectTrack: (track: Track) => void;
  handleSave: () => Promise<void>;
  handleSaveAs: () => Promise<void>;
  handleRevert: (newCode: string) => void;
  handlePreviewRevision: (previewCode: string) => void;

  // Draft management
  saveDraft: (code: string, trackName?: string) => void;
  clearDraft: () => void;

  // Track unsaved changes
  trackUnsavedChanges: (code: string) => void;

  // Ref for external use
  lastSavedCodeRef: React.MutableRefObject<string>;
}

/**
 * Hook that manages track CRUD, drafts, and revisions coordination.
 * Extracts track management state from the studio page.
 */
export function useStudioTracks({
  showToast,
  getCode,
  setCode,
  setTweaks,
  resetHistory,
}: UseStudioTracksOptions): UseStudioTracksResult {
  // Track management state
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [currentTrackName, setCurrentTrackName] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Modal state
  const [showTrackBrowser, setShowTrackBrowser] = useState(false);
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);

  // Refs
  const lastSavedCodeRef = useRef<string>("");

  // Auto-save is currently disabled
  const autoSaveEnabled = false;

  // Hooks for data
  const { projects, createProject } = useProjects();
  const { createTrack, updateTrack } = useTracks(selectedProjectId);
  const { revisions, createRevision } = useRevisions(currentTrackId);
  const { saving: autoSaving } = useAutoSave(currentTrackId, getCode(), autoSaveEnabled);
  const { saveDraft, clearDraft } = useDraftTrack(currentTrackId);
  const {
    recordings,
    loading: recordingsLoading,
    createRecording,
    updateRecording,
    deleteRecording,
  } = useRecordings(currentTrackId);

  /**
   * Handle selecting a track from the browser.
   */
  const handleSelectTrack = useCallback(
    (track: Track) => {
      setCurrentTrackId(track.id);
      setCurrentTrackName(track.name);
      setSelectedProjectId(track.project_id);
      const trackCode = track.current_code || DEFAULT_CODE;
      setCode(trackCode);
      lastSavedCodeRef.current = trackCode;
      setHasUnsavedChanges(false);
      setShowTrackBrowser(false);

      // Extract tweaks from loaded code
      const loadedTweaks = extractTweaks(trackCode);
      setTweaks(loadedTweaks || DEFAULT_TWEAKS);

      // Reset history when loading a different track
      resetHistory({
        code: trackCode,
        layers: [{ ...DEFAULT_LAYERS[0], code: trackCode }],
        tweaks: loadedTweaks || DEFAULT_TWEAKS,
        selectedLayerId: DEFAULT_LAYERS[0]?.id || null,
      });
    },
    [setCode, setTweaks, resetHistory]
  );

  /**
   * Handle reverting to a previous revision.
   */
  const handleRevert = useCallback(
    (newCode: string) => {
      setCode(newCode);
      setHasUnsavedChanges(true);
      setShowRevisionHistory(false);
    },
    [setCode]
  );

  /**
   * Handle previewing a revision.
   */
  const handlePreviewRevision = useCallback(
    (previewCode: string) => {
      setCode(previewCode);
      setHasUnsavedChanges(true);
    },
    [setCode]
  );

  /**
   * Handle saving the current track.
   */
  const handleSave = useCallback(async () => {
    if (!currentTrackId) {
      setShowSaveAsModal(true);
      return;
    }

    try {
      setSaving(true);
      const code = getCode();
      const result = await updateTrack(currentTrackId, { current_code: code });
      if (result) {
        lastSavedCodeRef.current = code;
        setHasUnsavedChanges(false);
        clearDraft();
        showToast("Track saved", "success");
      }
    } catch {
      showToast("Failed to save track", "error");
    } finally {
      setSaving(false);
    }
  }, [currentTrackId, getCode, updateTrack, clearDraft, showToast]);

  /**
   * Handle save-as (create new track).
   */
  const handleSaveAs = useCallback(async () => {
    if (!saveAsName.trim()) return;

    try {
      setSaving(true);
      const code = getCode();

      // Create a default project if none exists
      let projectId = selectedProjectId;
      if (!projectId) {
        if (projects.length === 0) {
          const newProject = await createProject("My Tracks");
          if (!newProject) {
            showToast("Failed to create project", "error");
            return;
          }
          projectId = newProject.id;
          setSelectedProjectId(projectId);
        } else {
          projectId = projects[0].id;
          setSelectedProjectId(projectId);
        }
      }

      const newTrack = await createTrack(projectId, saveAsName.trim(), code);
      if (newTrack) {
        setCurrentTrackId(newTrack.id);
        setCurrentTrackName(newTrack.name);
        lastSavedCodeRef.current = code;
        setHasUnsavedChanges(false);
        setShowSaveAsModal(false);
        setSaveAsName("");
        clearDraft();
        showToast(`Track "${newTrack.name}" created`, "success");
      }
    } catch {
      showToast("Failed to create track", "error");
    } finally {
      setSaving(false);
    }
  }, [
    saveAsName,
    selectedProjectId,
    projects,
    createProject,
    createTrack,
    getCode,
    clearDraft,
    showToast,
  ]);

  /**
   * Track unsaved changes when code differs from last saved.
   */
  const trackUnsavedChanges = useCallback(
    (code: string) => {
      if (currentTrackId && code !== lastSavedCodeRef.current) {
        setHasUnsavedChanges(true);
        saveDraft(code, currentTrackName || undefined);
      }
    },
    [currentTrackId, currentTrackName, saveDraft]
  );

  return {
    // Current track state
    currentTrackId,
    currentTrackName,
    selectedProjectId,
    hasUnsavedChanges,

    // Modal state
    showTrackBrowser,
    setShowTrackBrowser,
    showSaveAsModal,
    setShowSaveAsModal,
    saveAsName,
    setSaveAsName,
    showRevisionHistory,
    setShowRevisionHistory,

    // Save state
    saving,
    autoSaving,

    // Data from hooks
    projects,
    revisions,
    recordings,
    recordingsLoading,

    // Recording management
    createRecording,
    updateRecording,
    deleteRecording,

    // Revision management
    createRevision,

    // Handlers
    handleSelectTrack,
    handleSave,
    handleSaveAs,
    handleRevert,
    handlePreviewRevision,

    // Draft management
    saveDraft,
    clearDraft,

    // Track unsaved changes
    trackUnsavedChanges,

    // Ref
    lastSavedCodeRef,
  };
}
