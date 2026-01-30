"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Accessible confirmation dialog to replace browser confirm()
 * - Traps focus inside the dialog
 * - ESC key closes the dialog
 * - Returns focus to trigger element on close
 * - Announces to screen readers
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Store the previously focused element when opening
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement;
      // Focus the confirm button after a short delay to allow the dialog to render
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 0);
    } else if (previousActiveElement.current instanceof HTMLElement) {
      // Return focus to the previous element when closing
      previousActiveElement.current.focus();
    }
  }, [open]);

  // Handle ESC key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  // Trap focus inside the dialog
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !dialogRef.current) return;

    const focusableElements = dialogRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }, []);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const variantStyles = {
    danger: {
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      iconBg: "bg-red-500/10",
      confirmButton: "bg-red-600 hover:bg-red-500 focus:ring-red-500",
    },
    warning: {
      icon: (
        <svg
          className="w-6 h-6 text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      iconBg: "bg-amber-500/10",
      confirmButton: "bg-amber-600 hover:bg-amber-500 focus:ring-amber-500",
    },
    default: {
      icon: (
        <svg
          className="w-6 h-6 text-cyan-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconBg: "bg-cyan-500/10",
      confirmButton: "bg-cyan-600 hover:bg-cyan-500 focus:ring-cyan-500",
    },
  };

  const styles = variantStyles[variant];

  const dialog = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        onKeyDown={handleKeyDown}
        className="relative bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center`}
          >
            {styles.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 id="confirm-dialog-title" className="text-lg font-semibold text-white">
              {title}
            </h3>
            <p id="confirm-dialog-description" className="mt-2 text-sm text-slate-400">
              {message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${styles.confirmButton}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document body
  if (typeof document !== "undefined") {
    return createPortal(dialog, document.body);
  }

  return dialog;
}

/**
 * Hook to manage confirm dialog state
 */
export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "danger" | "warning" | "default";
  }>({
    open: false,
    title: "",
    message: "",
    variant: "default",
  });

  // Use ref to store resolve function to avoid stale closure issues
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback(
    (options: {
      title: string;
      message: string;
      variant?: "danger" | "warning" | "default";
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        resolveRef.current = resolve;
        setState({
          open: true,
          title: options.title,
          message: options.message,
          variant: options.variant || "default",
        });
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    confirm,
    dialogProps: {
      open: state.open,
      title: state.title,
      message: state.message,
      variant: state.variant,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
  };
}
