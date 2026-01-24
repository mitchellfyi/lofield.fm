/**
 * Export types for code and audio export functionality
 */

/** Supported audio export formats */
export type ExportFormat = "wav" | "mp3";

/** Options for audio export */
export interface ExportOptions {
  format: ExportFormat;
  duration: number; // in seconds
  filename?: string;
}

/** Progress phases during audio export */
export type ExportPhase = "preparing" | "rendering" | "encoding" | "complete";

/** Progress information during export */
export interface ExportProgress {
  phase: ExportPhase;
  percent: number; // 0-100
  message?: string;
}

/** Result of a code export operation */
export interface CodeExportResult {
  success: boolean;
  error?: string;
}

/** Toast notification types */
export type ToastType = "success" | "error" | "info";

/** Toast notification state */
export interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}
