import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGenreBySlug, getAllGenreSlugs, type GenreContent } from "@/lib/content/genres";
import { getPresetById } from "@/lib/audio/presets";
import type { Preset } from "@/lib/audio/presets";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllGenreSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const genre = getGenreBySlug(slug);

  if (!genre) {
    return { title: "Genre Not Found" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lofield.fm";

  return {
    title: genre.title,
    description: genre.description,
    keywords: genre.keywords.join(", "),
    openGraph: {
      title: genre.title,
      description: genre.description,
      url: `${baseUrl}/genres/${slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: genre.title,
      description: genre.description,
    },
    alternates: {
      canonical: `${baseUrl}/genres/${slug}`,
    },
  };
}

function PresetCard({ preset }: { preset: Preset }) {
  return (
    <div className="group bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-cyan-500/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
          {preset.name}
        </h3>
        <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 text-xs font-medium">
          {preset.bpm} BPM
        </span>
      </div>
      <p className="text-sm text-slate-400 mb-4">{preset.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {preset.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="px-2 py-0.5 rounded bg-slate-700 text-slate-400 text-xs">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function RelatedGenreLink({ genre }: { genre: GenreContent }) {
  return (
    <Link
      href={`/genres/${genre.slug}`}
      className="flex items-center gap-3 p-4 bg-slate-800/30 border border-slate-700 rounded-lg hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all"
    >
      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
        <svg
          className="w-5 h-5 text-cyan-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
          />
        </svg>
      </div>
      <div>
        <div className="font-medium text-white">{genre.name}</div>
        <div className="text-xs text-slate-500">{genre.heroSubheadline.slice(0, 50)}...</div>
      </div>
    </Link>
  );
}

export default async function GenrePage({ params }: PageProps) {
  const { slug } = await params;
  const genre = getGenreBySlug(slug);

  if (!genre) {
    notFound();
  }

  // Get featured presets for this genre
  const presets = genre.presetIds
    .map((id) => getPresetById(id))
    .filter((p): p is Preset => p !== undefined);

  // Get related genre content
  const relatedGenres = genre.relatedGenres
    .map((slug) => getGenreBySlug(slug))
    .filter((g): g is GenreContent => g !== undefined);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Background effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent opacity-50 pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-cyan-300 font-bold text-lg">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
            LoField
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/explore"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/studio"
              className="px-4 py-2 bg-cyan-600/30 border border-cyan-500/50 rounded-lg text-cyan-300 text-sm font-medium hover:bg-cyan-600/40 transition-colors"
            >
              Open Studio
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-medium">
            {genre.name} Music
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
            {genre.heroHeadline}
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            {genre.heroSubheadline}
          </p>
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg shadow-cyan-500/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
              />
            </svg>
            Start Creating {genre.name}
          </Link>
        </div>
      </header>

      {/* Features Section */}
      <section className="relative z-10 py-16 px-4 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            What Makes Great {genre.name} Music
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {genre.features.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Presets */}
      {presets.length > 0 && (
        <section className="relative z-10 py-16 px-4 border-t border-slate-800/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              Featured {genre.name} Presets
            </h2>
            <p className="text-slate-400 text-center mb-8">
              Start with these professionally crafted presets and customize them
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {presets.map((preset) => (
                <PresetCard key={preset.id} preset={preset} />
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href={`/explore?genre=${encodeURIComponent(genre.name)}`}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Browse all {genre.name} tracks →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4 border-t border-slate-800/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Create {genre.name} Music?
          </h2>
          <p className="text-slate-400 mb-8">
            No experience required. Just describe the sound you want and our AI will generate
            playable Tone.js code instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-cyan-500/30"
            >
              Open Music Studio
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-white rounded-lg font-semibold transition-all duration-200"
            >
              Explore Tracks
            </Link>
          </div>
        </div>
      </section>

      {/* Related Genres */}
      {relatedGenres.length > 0 && (
        <section className="relative z-10 py-16 px-4 border-t border-slate-800/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-6 text-center">
              Explore Related Genres
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedGenres.map((related) => (
                <RelatedGenreLink key={related.slug} genre={related} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t border-slate-800/50 bg-slate-900/50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            LoField Music Lab
          </div>
          <nav className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/" className="hover:text-slate-300 transition-colors">
              Home
            </Link>
            <Link href="/explore" className="hover:text-slate-300 transition-colors">
              Explore
            </Link>
            <Link href="/studio" className="hover:text-slate-300 transition-colors">
              Studio
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
