"use client";

import { useState } from "react";
import { useShare } from "@/lib/hooks/useShare";
import type { PrivacyLevel } from "@/lib/types/share";
import { SocialShareButtons } from "@/components/share/SocialShareButtons";
import { EmbedCodeGenerator } from "@/components/share/EmbedCodeGenerator";

type ShareTab = "share" | "embed";

interface ShareDialogProps {
  isOpen: boolean;
  trackId: string | null;
  trackName?: string;
  genre?: string;
  onClose: () => void;
  onToast: (message: string, type: "success" | "error") => void;
}

const PRIVACY_OPTIONS: { value: PrivacyLevel; label: string; description: string }[] = [
  { value: "private", label: "Private", description: "Only you can access" },
  { value: "unlisted", label: "Unlisted", description: "Anyone with the link can view" },
  { value: "public", label: "Public", description: "Discoverable by anyone" },
];

export function ShareDialog({
  isOpen,
  trackId,
  trackName,
  genre,
  onClose,
  onToast,
}: ShareDialogProps) {
  const { shareInfo, loading, error, generateShare, updatePrivacy, revokeShare, copyShareUrl } =
    useShare(trackId);

  // Local state for when user is selecting a new privacy before generating
  const [pendingPrivacy, setPendingPrivacy] = useState<PrivacyLevel>("unlisted");
  const [activeTab, setActiveTab] = useState<ShareTab>("share");

  // Use shareInfo privacy if available, otherwise use pending selection
  const currentPrivacy = shareInfo?.privacy ?? pendingPrivacy;

  const handleGenerateLink = async () => {
    const success = await generateShare(currentPrivacy);
    if (success) {
      onToast("Share link generated!", "success");
    } else if (error) {
      onToast(error, "error");
    }
  };

  const handlePrivacyChange = async (privacy: PrivacyLevel) => {
    setPendingPrivacy(privacy);

    // If we already have a share link, update the privacy immediately
    if (shareInfo?.shareToken) {
      const success = await updatePrivacy(privacy);
      if (success) {
        onToast(`Privacy updated to ${privacy}`, "success");
      } else if (error) {
        onToast(error, "error");
      }
    }
  };

  const handleCopyLink = async () => {
    const success = await copyShareUrl();
    if (success) {
      onToast("Link copied to clipboard!", "success");
    } else {
      onToast("Failed to copy link", "error");
    }
  };

  const handleRevoke = async () => {
    const success = await revokeShare();
    if (success) {
      setPendingPrivacy("unlisted");
      onToast("Share link revoked", "success");
    } else if (error) {
      onToast(error, "error");
    }
  };

  if (!isOpen) return null;

  const hasShareLink = shareInfo?.shareToken && shareInfo.privacy !== "private";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800">
          <h2 className="text-xl font-bold text-cyan-300">Share Track</h2>
          <p className="text-sm text-slate-400 mt-1">
            {trackName ? `Share "${trackName}"` : "Share your track with others"}
          </p>
        </div>

        {/* Tab Navigation (shown when share link exists) */}
        {hasShareLink && (
          <div className="flex border-b border-cyan-500/20">
            <button
              onClick={() => setActiveTab("share")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === "share"
                  ? "text-cyan-300 border-b-2 border-cyan-500"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Share Link
            </button>
            <button
              onClick={() => setActiveTab("embed")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === "embed"
                  ? "text-cyan-300 border-b-2 border-cyan-500"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Embed Player
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {/* Embed Tab Content */}
          {hasShareLink && activeTab === "embed" && shareInfo.shareToken ? (
            <EmbedCodeGenerator
              shareToken={shareInfo.shareToken}
              onCopy={() => onToast("Embed code copied!", "success")}
            />
          ) : (
            <>
              {/* Privacy Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Who can view this track?
                </label>
                <div className="space-y-2">
                  {PRIVACY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePrivacyChange(option.value)}
                      disabled={loading}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200 ${
                        currentPrivacy === option.value
                          ? "bg-cyan-600/20 border border-cyan-500/50"
                          : "bg-slate-800/50 border border-slate-700 hover:border-cyan-500/30"
                      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          currentPrivacy === option.value
                            ? "border-cyan-500 bg-cyan-500"
                            : "border-slate-500"
                        }`}
                      >
                        {currentPrivacy === option.value && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <div
                          className={`text-sm font-medium ${
                            currentPrivacy === option.value ? "text-cyan-300" : "text-slate-300"
                          }`}
                        >
                          {option.label}
                        </div>
                        <div className="text-xs text-slate-500">{option.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Share Link (if generated) */}
              {hasShareLink && shareInfo.shareUrl && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Share Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareInfo.shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-600 text-slate-300 text-sm focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      disabled={loading}
                      className="px-3 py-2 rounded-lg bg-cyan-600/30 border border-cyan-500/50 text-cyan-300 text-sm font-medium hover:bg-cyan-600/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Copy
                    </button>
                  </div>
                  {shareInfo.sharedAt && (
                    <p className="text-xs text-slate-500">
                      Shared on {new Date(shareInfo.sharedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* Social Share Buttons (when link exists) */}
              {hasShareLink && shareInfo.shareUrl && (
                <SocialShareButtons
                  url={shareInfo.shareUrl}
                  trackName={trackName || "My Track"}
                  genre={genre}
                  onShare={(platform) => onToast(`Opening ${platform}...`, "success")}
                />
              )}

              {/* Generate/Regenerate Button */}
              {currentPrivacy !== "private" && (
                <button
                  onClick={handleGenerateLink}
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white transition-all duration-200 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "Processing..."
                    : hasShareLink
                      ? "Regenerate Link"
                      : "Generate Share Link"}
                </button>
              )}

              {/* Revoke Button */}
              {hasShareLink && (
                <button
                  onClick={handleRevoke}
                  disabled={loading}
                  className="w-full py-2 rounded-lg text-sm font-medium text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Revoke Share Access
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-slate-300 border border-slate-600 hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
