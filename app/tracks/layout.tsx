import { PlayerProvider } from "@/lib/contexts/player-context";

export default function TracksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlayerProvider>{children}</PlayerProvider>;
}
