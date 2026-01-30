import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import type { Metadata } from "next";
import { getGravatarUrl } from "@/lib/types/profile";

interface PageProps {
  params: Promise<{ username: string }>;
}

interface TrackWithProject {
  id: string;
  name: string;
  bpm: number | null;
  genre: string | null;
  plays: number | null;
  created_at: string;
  project: { user_id: string };
}

/**
 * Generate metadata for profile pages (SEO)
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username, bio")
    .eq("username", username.toLowerCase())
    .single();

  if (!profile) {
    return {
      title: "User Not Found | LoField",
    };
  }

  const displayName = profile.display_name || profile.username;
  const description = profile.bio || `Check out ${displayName}'s tracks on LoField`;

  return {
    title: `${displayName} | LoField`,
    description,
    openGraph: {
      title: `${displayName} | LoField`,
      description,
      type: "profile",
    },
  };
}

/**
 * Public user profile page
 */
export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createServiceClient();

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

  if (profileError || !profile) {
    notFound();
  }

  // Fetch user's public tracks
  const { data: tracks } = await supabase
    .from("tracks")
    .select(
      `
      id,
      name,
      bpm,
      genre,
      plays,
      created_at,
      project:projects!inner(user_id)
    `
    )
    .eq("privacy", "public")
    .eq("projects.user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Calculate stats
  const typedTracks = tracks as TrackWithProject[] | null;
  const trackCount = typedTracks?.length || 0;
  const totalPlays =
    typedTracks?.reduce((sum: number, t: TrackWithProject) => sum + (t.plays || 0), 0) || 0;

  // Get avatar URL
  const avatarUrl = profile.avatar_url || getGravatarUrl(profile.email || "", 200);
  const displayName = profile.display_name || profile.username;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Background effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent opacity-50 pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-300 transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Explore
        </Link>

        {/* Profile Header */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-500/50 bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-cyan-100 mb-1">{displayName}</h1>
              <p className="text-slate-400 text-sm mb-3">@{profile.username}</p>

              {profile.bio && <p className="text-slate-300 text-sm mb-4 max-w-xl">{profile.bio}</p>}

              {/* Stats */}
              <div className="flex items-center justify-center sm:justify-start gap-6">
                <div className="text-center">
                  <div className="text-xl font-bold text-cyan-400">{trackCount}</div>
                  <div className="text-xs text-slate-500">Tracks</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-cyan-400">
                    {totalPlays.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">Total Plays</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tracks */}
        <div>
          <h2 className="text-lg font-bold text-cyan-100 mb-4">Public Tracks</h2>

          {trackCount === 0 ? (
            <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-slate-700/50">
              <p className="text-slate-400">No public tracks yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {typedTracks?.map((track) => (
                <Link
                  key={track.id}
                  href={`/explore?track=${track.id}`}
                  className="bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 rounded-xl p-4 transition-all"
                >
                  <h3 className="font-semibold text-cyan-100 truncate mb-2">{track.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {track.genre && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-700">{track.genre}</span>
                    )}
                    {track.bpm && <span>{track.bpm} BPM</span>}
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    {(track.plays || 0).toLocaleString()} plays
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
