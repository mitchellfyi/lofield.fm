"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { ToastType, ToastState } from "@/lib/export/types";
import { Toast } from "./Toast";

// Default durations by type
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  error: 10000, // 10 seconds for errors
  success: 3000, // 3 seconds for success
  info: 3000, // 3 seconds for info
};

// Maximum number of toasts to display at once
const MAX_VISIBLE_TOASTS = 3;

interface ToastContextValue {
  showToast: (message: string, type: ToastType, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback((message: string, type: ToastType, duration?: number) => {
    const id = crypto.randomUUID();
    const toastDuration = duration ?? DEFAULT_DURATIONS[type];

    setToasts((prev) => {
      // Add new toast, keeping only up to MAX_VISIBLE_TOASTS
      const newToasts = [...prev, { id, message, type, visible: true, duration: toastDuration }];
      // If we exceed max, remove oldest ones
      if (newToasts.length > MAX_VISIBLE_TOASTS) {
        return newToasts.slice(-MAX_VISIBLE_TOASTS);
      }
      return newToasts;
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const contextValue = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast Container - stacked at top-right */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              // Offset each toast slightly for stacking effect
              transform: `translateY(${index * 4}px)`,
              zIndex: 50 - index,
            }}
          >
            <Toast
              id={toast.id}
              message={toast.message}
              type={toast.type}
              visible={toast.visible}
              duration={toast.duration}
              onDismiss={() => dismissToast(toast.id!)}
              inline
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
