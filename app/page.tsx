import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { WebsiteJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "LoField Music Lab - AI-Powered Music Creation",
  description:
    "Create music with AI in seconds. Describe the vibe you want and AI generates playable code instantly. Free online music studio for lo-fi, ambient, house, techno, and more.",
  openGraph: {
    title: "LoField Music Lab - AI-Powered Music Creation",
    description:
      "Create music with AI in seconds. Describe the vibe you want and AI generates playable code instantly.",
  },
};

export default function Home() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lofield.fm";

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative">
      <WebsiteJsonLd
        url={siteUrl}
        name="LoField Music Lab"
        description="Create music with AI. Describe the vibe you want and AI generates Tone.js code that plays instantly."
      />
      <SoftwareApplicationJsonLd
        name="LoField Music Lab"
        description="AI-powered music creation studio. Generate lo-fi beats, ambient soundscapes, house, techno, and more with natural language."
        url={siteUrl}
        applicationCategory="MultimediaApplication"
        operatingSystem="Web Browser"
      />
      {/* Animated background effect */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent opacity-50 pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

      {/* Waveform visualization - static pattern for consistent rendering */}
      <div className="fixed inset-0 flex items-end justify-between gap-0.5 px-2 pointer-events-none opacity-30">
        {Array.from({ length: 240 }).map((_, i) => {
          const height =
            30 +
            Math.sin(i * 0.3) * 25 +
            Math.cos(i * 0.7) * 20 +
            Math.sin(i * 1.2) * 15 +
            Math.cos(i * 0.5) * 10;
          const pattern = i % 4;
          return (
            <div
              key={i}
              className={`waveform-bar waveform-pattern-${pattern} flex-1 bg-gradient-to-t from-cyan-500/60 via-cyan-400/40 to-transparent rounded-t`}
              style={
                {
                  height: `${Math.max(20, Math.min(100, height))}%`,
                  "--index": i.toString(),
                } as React.CSSProperties & { "--index": string }
              }
            />
          );
        })}
      </div>

      {/* Hero section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/50" />
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-300 via-cyan-400 to-cyan-500 bg-clip-text text-transparent tracking-tight">
              LoField Music Lab
            </h1>
          </div>
          <p className="text-slate-400 mb-8 text-lg">Chat to create lofi beats with Tone.js</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-600 hover:from-cyan-500 hover:via-cyan-400 hover:to-cyan-500 text-white rounded-sm font-semibold text-base transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 border border-cyan-500/30 hover:border-cyan-500/50 relative overflow-hidden group backdrop-blur-sm"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
                Open Music Studio
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/30 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.1)_0%,_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-slate-800/80 via-slate-700/80 to-slate-800/80 hover:from-slate-700/80 hover:via-slate-600/80 hover:to-slate-700/80 text-cyan-100 hover:text-white rounded-sm font-semibold text-base transition-all duration-200 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 relative overflow-hidden group backdrop-blur-sm"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Explore Tracks
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </Link>
          </div>
        </div>

        {/* Studio Preview */}
        <div className="w-full max-w-5xl mx-auto px-4 pb-16">
          <div className="relative group">
            {/* Glow effect behind the image */}
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-cyan-400/20 to-cyan-500/30 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />

            {/* Browser chrome frame */}
            <div className="relative bg-slate-900/90 rounded-xl border border-cyan-500/30 overflow-hidden shadow-2xl shadow-cyan-500/10">
              {/* Browser top bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-slate-900/50 rounded-md text-xs text-slate-400 font-mono">
                    lofield.fm/studio
                  </div>
                </div>
                <div className="w-[52px]" /> {/* Spacer to center the URL bar */}
              </div>

              {/* Screenshot */}
              <Image
                src="/studio-preview.png"
                alt="LoField Music Lab Studio Interface"
                width={1920}
                height={1080}
                className="w-full h-auto"
                priority
              />
            </div>

            {/* Reflection effect */}
            <div className="absolute inset-x-0 -bottom-px h-32 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950 pointer-events-none" />
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
            <div className="text-center p-4">
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-cyan-100 mb-1">AI-Powered Chat</h3>
              <p className="text-xs text-slate-400">
                Describe the vibe you want and AI generates the code
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-cyan-100 mb-1">Live Code Editor</h3>
              <p className="text-xs text-slate-400">
                Real-time Tone.js code editing with instant preview
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-cyan-100 mb-1">Built-in Controls</h3>
              <p className="text-xs text-slate-400">
                BPM, reverb, delay and more with visual layers
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
