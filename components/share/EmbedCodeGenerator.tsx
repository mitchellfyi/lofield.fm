"use client";

import { useState, useMemo } from "react";

type EmbedSize = "small" | "medium" | "large";
type EmbedTheme = "dark" | "light";

interface EmbedCodeGeneratorProps {
  shareToken: string;
  onCopy?: () => void;
}

const SIZES: { value: EmbedSize; label: string; width: number; height: number }[] = [
  { value: "small", label: "Small", width: 300, height: 80 },
  { value: "medium", label: "Medium", width: 400, height: 100 },
  { value: "large", label: "Large", width: 500, height: 120 },
];

const THEMES: { value: EmbedTheme; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

/**
 * Generates iframe embed code for sharing tracks on external websites
 */
export function EmbedCodeGenerator({ shareToken, onCopy }: EmbedCodeGeneratorProps) {
  const [size, setSize] = useState<EmbedSize>("medium");
  const [theme, setTheme] = useState<EmbedTheme>("dark");
  const [copied, setCopied] = useState(false);

  const sizeConfig = SIZES.find((s) => s.value === size) ?? SIZES[1];
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://lofield.fm";

  const embedCode = useMemo(() => {
    const embedUrl = `${baseUrl}/embed/${shareToken}?theme=${theme}`;
    return `<iframe src="${embedUrl}" width="${sizeConfig.width}" height="${sizeConfig.height}" frameborder="0" allow="autoplay; encrypted-media" style="border-radius: 12px;"></iframe>`;
  }, [baseUrl, shareToken, theme, sizeConfig]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = embedCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-300">Embed Player</label>

      {/* Size and Theme selectors */}
      <div className="flex gap-4">
        {/* Size selector */}
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1.5">Size</label>
          <div className="flex gap-1">
            {SIZES.map((s) => (
              <button
                key={s.value}
                onClick={() => setSize(s.value)}
                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  size === s.value
                    ? "bg-cyan-600/30 border border-cyan-500/50 text-cyan-300"
                    : "bg-slate-800/50 border border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme selector */}
        <div className="w-32">
          <label className="block text-xs text-slate-500 mb-1.5">Theme</label>
          <div className="flex gap-1">
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  theme === t.value
                    ? "bg-cyan-600/30 border border-cyan-500/50 text-cyan-300"
                    : "bg-slate-800/50 border border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-lg overflow-hidden bg-slate-800/30 p-3">
        <div className="text-xs text-slate-500 mb-2">
          Preview ({sizeConfig.width}×{sizeConfig.height}px)
        </div>
        <div
          className="mx-auto overflow-hidden rounded-xl"
          style={{
            width: Math.min(sizeConfig.width, 340),
            height: sizeConfig.height,
            transform: sizeConfig.width > 340 ? `scale(${340 / sizeConfig.width})` : undefined,
            transformOrigin: "top left",
          }}
        >
          <iframe
            src={`${baseUrl}/embed/${shareToken}?theme=${theme}`}
            width={sizeConfig.width}
            height={sizeConfig.height}
            frameBorder="0"
            allow="autoplay; encrypted-media"
            style={{ borderRadius: 12 }}
            title="Embed preview"
          />
        </div>
      </div>

      {/* Code display */}
      <div className="relative">
        <textarea
          value={embedCode}
          readOnly
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 text-xs font-mono resize-none focus:outline-none focus:border-cyan-500/50"
        />
        <button
          onClick={handleCopy}
          className={`absolute top-2 right-2 px-3 py-1.5 rounded text-xs font-medium transition-all ${
            copied
              ? "bg-green-600/30 border border-green-500/50 text-green-300"
              : "bg-cyan-600/30 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-600/40"
          }`}
        >
          {copied ? "Copied!" : "Copy Code"}
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Paste this code into your website, blog, or portfolio to embed a playable version of your
        track.
      </p>
    </div>
  );
}
