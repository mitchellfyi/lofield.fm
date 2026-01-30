"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Command } from "cmdk";
import { type Command as CommandType, SECTION_LABELS } from "@/lib/commands/registry";

interface CommandPaletteProps {
  /** Whether the palette is open */
  open: boolean;
  /** Callback when the palette should close */
  onOpenChange: (open: boolean) => void;
  /** Available commands */
  commands: CommandType[];
}

/**
 * Command palette component using cmdk
 * Provides fuzzy search and keyboard navigation for all app commands
 */
export function CommandPalette({ open, onOpenChange, commands }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      // Small delay to ensure the element is mounted
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  // Handle closing - clear search
  const handleClose = useCallback(() => {
    setSearch("");
    onOpenChange(false);
  }, [onOpenChange]);

  // Handle command selection
  const handleSelect = useCallback(
    (commandId: string) => {
      const command = commands.find((c) => c.id === commandId);
      if (command && !command.disabled) {
        handleClose();
        // Execute after closing to avoid UI conflicts
        setTimeout(() => {
          command.handler();
        }, 50);
      }
    },
    [commands, handleClose]
  );

  // Group commands by section
  const groupedCommands = commands.reduce(
    (acc, command) => {
      if (!acc[command.section]) {
        acc[command.section] = [];
      }
      acc[command.section].push(command);
      return acc;
    },
    {} as Record<string, CommandType[]>
  );

  // Order sections
  const sectionOrder: CommandType["section"][] = ["playback", "file", "edit", "view", "navigation"];
  const orderedSections = sectionOrder.filter((section) => groupedCommands[section]?.length > 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={handleClose}
      />

      {/* Command palette */}
      <div className="absolute inset-0 flex items-start justify-center pt-[15vh]">
        <Command
          className="w-full max-w-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
          shouldFilter={true}
          loop
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-cyan-500/20">
            <svg
              className="w-5 h-5 text-cyan-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Command.Input
              ref={inputRef}
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-700 rounded border border-slate-600">
              ESC
            </kbd>
          </div>

          {/* Command list */}
          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-slate-500">
              No commands found.
            </Command.Empty>

            {orderedSections.map((section) => (
              <Command.Group
                key={section}
                heading={SECTION_LABELS[section]}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-cyan-400 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
              >
                {groupedCommands[section].map((command) => (
                  <Command.Item
                    key={command.id}
                    value={command.name}
                    onSelect={() => handleSelect(command.id)}
                    disabled={command.disabled}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/20 data-[selected=true]:text-white text-slate-300 data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed"
                  >
                    {/* Command icon */}
                    <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-cyan-400 shrink-0">
                      {command.icon || <CommandIcon commandId={command.id} />}
                    </div>

                    {/* Command name */}
                    <span className="flex-1">{command.name}</span>

                    {/* Keyboard shortcut */}
                    {command.shortcut && (
                      <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-700/50 rounded border border-slate-600">
                        {command.shortcut}
                      </kbd>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-cyan-500/20 bg-slate-900/50 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-700 rounded">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-700 rounded">↵</kbd> select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-700 rounded">esc</kbd> close
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}

/**
 * Default icons for common commands based on their ID
 */
function CommandIcon({ commandId }: { commandId: string }) {
  const iconProps = { className: "w-4 h-4", fill: "none", stroke: "currentColor", strokeWidth: 2 };

  if (commandId.includes("play")) {
    return (
      <svg {...iconProps} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5v14l11-7z" fill="currentColor" />
      </svg>
    );
  }

  if (commandId.includes("stop")) {
    return (
      <svg {...iconProps} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h12v12H6z" fill="currentColor" />
      </svg>
    );
  }

  if (commandId.includes("save")) {
    return (
      <svg {...iconProps} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
        />
      </svg>
    );
  }

  if (commandId.includes("export")) {
    return (
      <svg {...iconProps} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        />
      </svg>
    );
  }

  if (commandId.includes("share")) {
    return (
      <svg {...iconProps} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      </svg>
    );
  }

  if (commandId.includes("undo")) {
    return (
      <svg {...iconProps} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
        />
      </svg>
    );
  }

  if (commandId.includes("redo")) {
    return (
      <svg {...iconProps} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
        />
      </svg>
    );
  }

  if (commandId.includes("copy")) {
    return (
      <svg {...iconProps} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    );
  }

  if (commandId.includes("home") || commandId.includes("landing")) {
    return (
      <svg {...iconProps} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    );
  }

  if (commandId.includes("explore")) {
    return (
      <svg {...iconProps} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    );
  }

  if (commandId.includes("tracks") || commandId.includes("browser")) {
    return (
      <svg {...iconProps} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      </svg>
    );
  }

  if (commandId.includes("history") || commandId.includes("revision")) {
    return (
      <svg {...iconProps} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  }

  if (commandId.includes("live")) {
    return (
      <svg {...iconProps} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"
        />
      </svg>
    );
  }

  if (commandId.includes("preset")) {
    return (
      <svg {...iconProps} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
        />
      </svg>
    );
  }

  // Default icon
  return (
    <svg {...iconProps} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

/**
 * Hook to manage command palette state and keyboard shortcuts
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  // Global keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }

      // Escape to close
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return { open, setOpen };
}
