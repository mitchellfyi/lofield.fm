import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { AbuseStatus, AbuseFlag, ViolationType } from "./types";

// Threshold for flagging a user as abusive
const ABUSE_FLAG_THRESHOLD = 3; // Flag user after 3 violations of same type

// Create a service client for server-side operations
async function createServiceClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors in Server Components
          }
        },
      },
    }
  );
}

/**
 * Check if a user has abuse flags that should block them.
 */
export async function checkAbusePatterns(userId: string): Promise<AbuseStatus> {
  const supabase = await createServiceClient();

  const { data: flags, error } = await supabase
    .from("abuse_flags")
    .select("id, user_id, violation_type, count, last_flagged_at, created_at")
    .eq("user_id", userId);

  if (error) {
    console.error("Error checking abuse patterns:", error);
    return { flagged: false, flags: [] };
  }

  if (!flags || flags.length === 0) {
    return { flagged: false, flags: [] };
  }

  // Check if any flag exceeds the threshold
  const abuseFlags: AbuseFlag[] = flags.map((f) => ({
    id: f.id,
    userId: f.user_id,
    violationType: f.violation_type,
    count: f.count,
    lastFlaggedAt: new Date(f.last_flagged_at),
    createdAt: new Date(f.created_at),
  }));

  const flagged = abuseFlags.some((f) => f.count >= ABUSE_FLAG_THRESHOLD);

  return { flagged, flags: abuseFlags };
}

/**
 * Record an abuse violation for a user.
 */
export async function flagAbuse(
  userId: string,
  violationType: ViolationType
): Promise<void> {
  const supabase = await createServiceClient();

  // Check if there's an existing flag for this violation type
  const { data: existing } = await supabase
    .from("abuse_flags")
    .select("id, count")
    .eq("user_id", userId)
    .eq("violation_type", violationType)
    .single();

  if (existing) {
    // Increment existing flag
    await supabase
      .from("abuse_flags")
      .update({
        count: existing.count + 1,
        last_flagged_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    // Create new flag
    await supabase.from("abuse_flags").insert({
      user_id: userId,
      violation_type: violationType,
      count: 1,
      last_flagged_at: new Date().toISOString(),
    });
  }
}

/**
 * Get all abuse flags for a user.
 */
export async function getAbuseFlags(userId: string): Promise<AbuseFlag[]> {
  const supabase = await createServiceClient();

  const { data: flags, error } = await supabase
    .from("abuse_flags")
    .select("id, user_id, violation_type, count, last_flagged_at, created_at")
    .eq("user_id", userId);

  if (error || !flags) {
    return [];
  }

  return flags.map((f) => ({
    id: f.id,
    userId: f.user_id,
    violationType: f.violation_type,
    count: f.count,
    lastFlaggedAt: new Date(f.last_flagged_at),
    createdAt: new Date(f.created_at),
  }));
}

/**
 * Clear all abuse flags for a user (admin function).
 */
export async function clearAbuseFlags(userId: string): Promise<void> {
  const supabase = await createServiceClient();

  await supabase.from("abuse_flags").delete().eq("user_id", userId);
}

/**
 * Clear a specific abuse flag by ID (admin function).
 */
export async function clearAbuseFlagById(flagId: string): Promise<void> {
  const supabase = await createServiceClient();

  await supabase.from("abuse_flags").delete().eq("id", flagId);
}
