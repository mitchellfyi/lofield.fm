/**
 * Social Share Link Generators
 * Create share URLs for various social platforms
 */

interface ShareContent {
  url: string;
  title: string;
  text?: string;
  hashtags?: string[];
}

/**
 * Generate Twitter/X share URL
 */
export function getTwitterShareUrl({ url, title, text, hashtags }: ShareContent): string {
  const params = new URLSearchParams({
    url,
    text: text || title,
  });

  if (hashtags?.length) {
    params.set("hashtags", hashtags.join(","));
  }

  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * Generate Facebook share URL
 */
export function getFacebookShareUrl({ url }: ShareContent): string {
  const params = new URLSearchParams({
    u: url,
  });

  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

/**
 * Generate Reddit share URL
 */
export function getRedditShareUrl({ url, title }: ShareContent): string {
  const params = new URLSearchParams({
    url,
    title,
  });

  return `https://reddit.com/submit?${params.toString()}`;
}

/**
 * Generate LinkedIn share URL
 */
export function getLinkedInShareUrl({ url }: ShareContent): string {
  const params = new URLSearchParams({
    url,
  });

  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}

/**
 * Generate email share URL
 */
export function getEmailShareUrl({ url, title, text }: ShareContent): string {
  const subject = encodeURIComponent(title);
  const body = encodeURIComponent(`${text || title}\n\n${url}`);

  return `mailto:?subject=${subject}&body=${body}`;
}

/**
 * Check if native Web Share API is available
 */
export function canUseNativeShare(): boolean {
  return typeof navigator !== "undefined" && !!navigator.share;
}

/**
 * Trigger native share dialog (mobile)
 */
export async function triggerNativeShare({ url, title, text }: ShareContent): Promise<boolean> {
  if (!canUseNativeShare()) {
    return false;
  }

  try {
    await navigator.share({
      url,
      title,
      text: text || title,
    });
    return true;
  } catch (error) {
    // User cancelled or share failed
    if (error instanceof Error && error.name !== "AbortError") {
      console.error("Share failed:", error);
    }
    return false;
  }
}

/**
 * Generate share text for a track
 */
export function getTrackShareText(trackName: string, genre?: string): string {
  const genreText = genre ? ` ${genre}` : "";
  return `Check out this${genreText} track I made with LoField Music Lab! 🎵`;
}

/**
 * Get all social share links for a track
 */
export function getAllShareLinks(
  url: string,
  trackName: string,
  genre?: string
): Record<string, string> {
  const title = `${trackName} | LoField Music Lab`;
  const text = getTrackShareText(trackName, genre);
  const hashtags = ["LoFieldFM", "AIMusic", genre?.replace(/\s+/g, "") || "Music"].filter(
    Boolean
  ) as string[];

  const content: ShareContent = { url, title, text, hashtags };

  return {
    twitter: getTwitterShareUrl(content),
    facebook: getFacebookShareUrl(content),
    reddit: getRedditShareUrl(content),
    linkedin: getLinkedInShareUrl(content),
    email: getEmailShareUrl(content),
  };
}
