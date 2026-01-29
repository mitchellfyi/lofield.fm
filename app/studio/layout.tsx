import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Music Studio",
  description:
    "Create music with AI chat. Describe what you want to hear and AI generates Tone.js code that plays instantly. Real-time editing, live tweaks, and export to WAV.",
  openGraph: {
    title: "Music Studio | LoField Music Lab",
    description:
      "Create music with AI chat. Describe what you want to hear and AI generates playable code instantly.",
  },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
