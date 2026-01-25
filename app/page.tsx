import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Animated background effect */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent opacity-50 pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

      {/* Waveform visualization - static pattern for consistent rendering */}
      <div className="fixed inset-0 flex items-end justify-between gap-0.5 px-2 pointer-events-none opacity-30">
        {Array.from({ length: 240 }).map((_, i) => {
          // More complex deterministic height pattern with multiple sine/cosine waves
          const height =
            30 +
            Math.sin(i * 0.3) * 25 +
            Math.cos(i * 0.7) * 20 +
            Math.sin(i * 1.2) * 15 +
            Math.cos(i * 0.5) * 10;
          // Add variation for animation pattern
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

      <main className="text-center relative z-10">
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
      </main>
    </div>
  );
}
