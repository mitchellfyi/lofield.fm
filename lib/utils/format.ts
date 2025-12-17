/**
 * Format time in seconds to mm:ss format
 * @param seconds Time in seconds
 * @returns Formatted time string (e.g., "3:45")
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format duration in milliseconds to mm:ss format
 * @param ms Duration in milliseconds
 * @returns Formatted duration string (e.g., "3:45")
 */
export function formatDuration(ms: number | null): string {
  if (!ms) return "--:--";
  const totalSeconds = Math.floor(ms / 1000);
  return formatTime(totalSeconds);
}
