import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/components/auth/AuthProvider";
import "./globals.css";

const siteConfig = {
  name: "LoField Music Lab",
  description:
    "Create music with AI. Describe the vibe you want and AI generates Tone.js code that plays instantly. Free online music studio with lo-fi, ambient, house, and more.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://lofield.fm",
  ogImage: "/og-image.png",
  twitterHandle: "@lofieldFM",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "music generator",
    "AI music",
    "lofi beats",
    "beat maker",
    "online music studio",
    "Tone.js",
    "ambient music",
    "electronic music",
    "music creation",
    "AI composer",
  ],
  authors: [{ name: "LoField" }],
  creator: "LoField",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "LoField Music Lab - AI-Powered Music Creation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
