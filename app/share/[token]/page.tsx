import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSharedTrack } from "@/lib/share";
import { isValidShareToken } from "@/lib/share/token";
import { SharePageClient } from "./SharePageClient";

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;

  if (!isValidShareToken(token)) {
    return {
      title: "Track Not Found | LoField Music Lab",
    };
  }

  const track = await getSharedTrack(token);

  if (!track) {
    return {
      title: "Track Not Found | LoField Music Lab",
    };
  }

  const title = `${track.name} | LoField Music Lab`;
  const description = track.author_name
    ? `A lofi beat by ${track.author_name} on LoField Music Lab`
    : "A lofi beat created on LoField Music Lab";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lofield.fm";
  const ogImageUrl = `${baseUrl}/api/og/${token}`;
  const shareUrl = `${baseUrl}/share/${token}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "music.song",
      siteName: "LoField Music Lab",
      url: shareUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${track.name} - LoField Music Lab`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function SharePage({ params }: PageProps) {
  const { token } = await params;

  if (!isValidShareToken(token)) {
    notFound();
  }

  const track = await getSharedTrack(token);

  if (!track) {
    notFound();
  }

  return <SharePageClient track={track} />;
}
