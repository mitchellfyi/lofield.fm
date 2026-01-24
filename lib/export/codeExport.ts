/**
 * Code export utilities for clipboard copy and file download
 */

import type { CodeExportResult } from "./types";

/**
 * Copy text to clipboard with fallback for older browsers
 */
export async function copyToClipboard(code: string): Promise<CodeExportResult> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(code);
      return { success: true };
    }

    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement("textarea");
    textArea.value = code;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const success = document.execCommand("copy");
    document.body.removeChild(textArea);

    return success ? { success: true } : { success: false, error: "Copy command failed" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to copy to clipboard",
    };
  }
}

/**
 * Download code as a JavaScript file
 */
export function downloadAsJS(code: string, filename?: string): void {
  const blob = new Blob([code], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `track-${Date.now()}.js`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Download a blob as a file with the given filename
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
