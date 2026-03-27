import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PublicDeckView } from "@/components/profile/PublicDeckView";

interface Params {
  readonly params: Promise<{ id: string }>;
}

async function fetchPublicDeck(id: string) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const res = await fetch(`${baseUrl}/api/deck/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const deck = await fetchPublicDeck(id);

  if (!deck) return { title: "Deck not found — MagicAIBuilder" };

  const commander = deck.cards?.find(
    (c: { isCommander: boolean; isPartner: boolean }) => c.isCommander && !c.isPartner
  );
  const author = deck.user?.name ?? deck.user?.username ?? "Unknown";

  return {
    title: `${deck.name} by ${author} — MagicAIBuilder`,
    description: `Commander: ${commander?.name ?? "Unknown"} · Bracket ${deck.targetBracket} · ${deck.format}`,
    openGraph: {
      title: `${deck.name} by ${author}`,
      description: `Commander: ${commander?.name ?? "Unknown"} · Bracket ${deck.targetBracket}`,
      images: commander?.artCropUri ? [{ url: commander.artCropUri }] : [],
    },
  };
}

export default async function PublicDeckPage({ params }: Params) {
  const { id } = await params;
  const deck = await fetchPublicDeck(id);

  if (!deck) notFound();

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <Header />
      <PublicDeckView deck={deck} />
    </div>
  );
}
