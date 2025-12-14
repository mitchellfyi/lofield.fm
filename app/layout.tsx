import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lofield Studio",
  description: "AI-assisted lo-fi music drafting workspace powered by Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
