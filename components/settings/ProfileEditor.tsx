"use client";

import { useState, useEffect } from "react";
import { validateUsername, validateBio, getGravatarUrl } from "@/lib/types/profile";

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface ProfileEditorProps {
  initialProfile: Profile | null;
  onUpdate?: () => void;
}

/**
 * Profile editing form for settings page
 */
export function ProfileEditor({ initialProfile, onUpdate }: ProfileEditorProps) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [username, setUsername] = useState(initialProfile?.username || "");
  const [displayName, setDisplayName] = useState(initialProfile?.display_name || "");
  const [bio, setBio] = useState(initialProfile?.bio || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      setUsername(initialProfile.username || "");
      setDisplayName(initialProfile.display_name || "");
      setBio(initialProfile.bio || "");
    }
  }, [initialProfile]);

  const avatarUrl = profile?.avatar_url || getGravatarUrl(profile?.email || "", 200);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate username
    if (username) {
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        setError(usernameValidation.error || "Invalid username");
        return;
      }
    }

    // Validate bio
    const bioValidation = validateBio(bio);
    if (!bioValidation.valid) {
      setError(bioValidation.error || "Invalid bio");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username || null,
          display_name: displayName || null,
          bio: bio || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setProfile(data);
      setSuccess(true);
      onUpdate?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    username !== (profile?.username || "") ||
    displayName !== (profile?.display_name || "") ||
    bio !== (profile?.bio || "");

  return (
    <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-lg bg-slate-800/50 border border-cyan-500/30 flex items-center justify-center shrink-0">
          <svg
            className="w-6 h-6 text-cyan-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-cyan-300 mb-1">Profile</h2>
          <p className="text-sm text-slate-400">
            Customize your public profile. Set a username to make your profile visible.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar preview */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-500/30 bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="text-sm text-slate-400">
            Avatar via{" "}
            <a
              href="https://gravatar.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              Gravatar
            </a>
          </div>
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">@</span>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="your_username"
              maxLength={30}
              className="w-full pl-8 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            3-30 characters. Letters, numbers, and underscores only.
          </p>
        </div>

        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-slate-300 mb-1">
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your Name"
            maxLength={50}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-slate-300 mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
          />
          <p className="text-xs text-slate-500 mt-1">{bio.length}/500 characters</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-sm">
            Profile updated successfully!
          </div>
        )}

        {/* Profile link */}
        {profile?.username && (
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-600">
            <p className="text-sm text-slate-400">
              Your public profile:{" "}
              <a
                href={`/user/${profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                lofield.fm/user/{profile.username}
              </a>
            </p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={saving || !hasChanges}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white transition-all duration-200 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
