import type { Metadata } from "next";
import "./globals.css";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GlobalNav } from "@/components/global-nav";

export const metadata: Metadata = {
  title: "Lofield Studio",
  description:
    "AI-assisted lo-fi music drafting workspace powered by Supabase.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email ?? user?.id ?? null;

  return (
    <html lang="en">
      <body className="antialiased">
        <GlobalNav userEmail={userEmail} />
        {children}
      </body>
    </html>
  );
}
