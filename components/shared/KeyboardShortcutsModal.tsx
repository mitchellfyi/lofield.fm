"use client";

import { useEffect, useState, useCallback } from "react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string;
  description: string;
}

interface ShortcutCategory {
  name: string;
  icon: React.ReactNode;
  shortcuts: ShortcutItem[];
}

/**
 * Keyboard shortcuts help modal
 * Displays all available keyboard shortcuts grouped by category
 */
export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories: ShortcutCategory[] = [
    {
      name: "Playback",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      shortcuts: [
        { keys: "Space", description: "Play / Pause" },
      ],
    },
    {
      name: "File",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
      ),
      shortcuts: [
        { keys: "⌘S / Ctrl+S", description: "Save track" },
      ],
    },
    {
      name: "Editing",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      shortcuts: [
        { keys: "⌘Z / Ctrl+Z", description: "Undo" },
        { keys: "⌘⇧Z / Ctrl+Shift+Z", description: "Redo" },
        { keys: "⌘Y / Ctrl+Y", description: "Redo (alternative)" },
      ],
    },
    {
      name: "Navigation",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      shortcuts: [
        { keys: "⌘K / Ctrl+K", description: "Open command palette" },
        { keys: "?", description: "Show keyboard shortcuts" },
        { keys: "Esc", description: "Close modal / palette" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900 to-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
                <p className="text-xs text-slate-400">Quick reference for all available shortcuts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-6 md:grid-cols-2">
              {categories.map((category) => (
                <div key={category.name} className="space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400">
                    {category.icon}
                    <h3 className="text-sm font-semibold uppercase tracking-wider">
                      {category.name}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {category.shortcuts.map((shortcut, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                      >
                        <span className="text-sm text-slate-300">{shortcut.description}</span>
                        <kbd className="px-2 py-1 text-xs font-medium text-slate-300 bg-slate-700 rounded border border-slate-600 font-mono">
                          {shortcut.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-cyan-500/20 bg-slate-900/50 text-xs text-slate-500">
            <span>Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">?</kbd> anytime to show this help</span>
            <span>Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">Esc</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage keyboard shortcuts modal state
 * Opens modal when ? is pressed (not in input fields)
 */
export function useKeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if in input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Open on ? (Shift + /)
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, open, close };
}
