import { PlayerProvider } from "@/lib/contexts/player-context";

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlayerProvider>{children}</PlayerProvider>;
}
