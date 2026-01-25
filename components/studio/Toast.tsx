"use client";

import { useEffect } from "react";
import type { ToastType } from "@/lib/export/types";

interface ToastProps {
  id?: string;
  message: string;
  type: ToastType;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
  /** When true, toast is rendered inline (for use in ToastProvider container). When false/undefined, uses fixed positioning. */
  inline?: boolean;
}

const typeStyles: Record<ToastType, string> = {
  success:
    "bg-gradient-to-r from-emerald-600/90 via-emerald-500/90 to-emerald-600/90 border-emerald-400/30 shadow-emerald-500/20",
  error:
    "bg-gradient-to-r from-red-600/90 via-red-500/90 to-red-600/90 border-red-400/30 shadow-red-500/20",
  info: "bg-gradient-to-r from-cyan-600/90 via-cyan-500/90 to-cyan-600/90 border-cyan-400/30 shadow-cyan-500/20",
};

const typeIcons: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

export function Toast({
  message,
  type,
  visible,
  onDismiss,
  duration = 3000,
  inline = false,
}: ToastProps) {
  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  const positionClasses = inline
    ? "animate-in slide-in-from-top-4 fade-in duration-300"
    : "fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300";

  return (
    <div className={positionClasses}>
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-sm text-white font-medium shadow-lg border backdrop-blur-sm ${typeStyles[type]}`}
      >
        {typeIcons[type]}
        <span>{message}</span>
        <button
          onClick={onDismiss}
          className="ml-2 p-1 hover:bg-white/10 rounded-sm transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
