import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSharedTrack } from "@/lib/share";
import { isValidShareToken } from "@/lib/share/token";
import { EmbedPlayer } from "@/components/embed/EmbedPlayer";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ theme?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;

  if (!isValidShareToken(token)) {
    return { title: "Track Not Found" };
  }

  const track = await getSharedTrack(token);

  if (!track) {
    return { title: "Track Not Found" };
  }

  return {
    title: `${track.name} - LoField Embed`,
    robots: "noindex, nofollow",
  };
}

export default async function EmbedPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { theme } = await searchParams;

  if (!isValidShareToken(token)) {
    notFound();
  }

  const track = await getSharedTrack(token);

  if (!track) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lofield.fm";
  const shareUrl = `${baseUrl}/share/${token}`;
  const themeValue = theme === "light" ? "light" : "dark";

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            height: 100%;
            background: transparent;
            overflow: hidden;
          }
          #player-root {
            height: 100%;
            padding: 4px;
          }
        `}</style>
      </head>
      <body>
        <div id="player-root">
          <EmbedPlayer
            trackName={track.name}
            trackCode={track.current_code}
            shareUrl={shareUrl}
            theme={themeValue}
          />
        </div>
      </body>
    </html>
  );
}
