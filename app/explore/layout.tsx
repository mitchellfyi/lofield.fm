import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Tracks",
  description:
    "Discover AI-generated music tracks. Browse lo-fi beats, ambient soundscapes, house, techno, and more. Listen, remix, and get inspired.",
  openGraph: {
    title: "Explore Tracks | LoField Music Lab",
    description:
      "Discover AI-generated music tracks. Browse lo-fi beats, ambient soundscapes, house, techno, and more.",
  },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
