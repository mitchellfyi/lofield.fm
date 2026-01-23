"use client";

import { useAuthContext } from "@/components/auth/AuthProvider";

/**
 * Hook to access authentication state and methods.
 * Must be used within an AuthProvider.
 */
export function useAuth() {
  return useAuthContext();
}
