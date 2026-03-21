// Public read-only deck view — accessible without authentication
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShareDeckView } from "@/components/deck/ShareDeckView";

interface Params {
  params: Promise<{ token: string }>;
}

// ─── Types matching the API response ─────────────────────────────────────────

interface ApiCard {
  readonly id: string;
  readonly scryfallId: string;
  readonly name: string;
  readonly manaCost: string;
  readonly cmc: number;
  readonly typeLine: string;
  readonly oracleText: string;
  readonly colorIdentity: readonly string[];
  readonly isGameChanger: boolean;
  readonly isBanned: boolean;
  readonly price: number | null;
  readonly imageUri: string;
  readonly artCropUri: string;
  readonly category: string;
  readonly quantity: number;
  readonly isCommander: boolean;
  readonly isPartner: boolean;
}

interface ApiSharedDeck {
  readonly id: string;
  readonly name: string;
  readonly format: string;
  readonly targetBracket: number;
  readonly budget: number | null;
  readonly commanderId: string | null;
  readonly partnerId: string | null;
  readonly companionId: string | null;
  readonly pairingType: string;
  readonly shareEnabled: boolean;
  readonly cards: readonly ApiCard[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ─── Server-side data fetching ────────────────────────────────────────────────

async function fetchSharedDeck(token: string): Promise<ApiSharedDeck | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const res = await fetch(`${baseUrl}/api/share/${token}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── OG meta tags ─────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { token } = await params;
  const deck = await fetchSharedDeck(token);

  if (!deck) {
    return { title: "Deck not found — MagicAIBuilder" };
  }

  const commander = deck.cards.find((c) => c.isCommander && !c.isPartner);
  const partner = deck.cards.find((c) => c.isPartner);
  const cardCount =
    deck.cards.length;
  let commanderLabel: string;
  if (!commander) { commanderLabel = "No commander"; }
  else if (partner) { commanderLabel = `${commander.name} + ${partner.name}`; }
  else { commanderLabel = commander.name; }

  const description = `Commander: ${commanderLabel} · ${cardCount} cards · Bracket ${deck.targetBracket} · ${deck.format}`;

  return {
    title: `${deck.name} — MagicAIBuilder`,
    description,
    openGraph: {
      title: deck.name,
      description,
      type: "website",
      images: commander?.artCropUri
        ? [{ url: commander.artCropUri, alt: commander.name }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: deck.name,
      description,
      images: commander?.artCropUri ? [commander.artCropUri] : [],
    },
  };
}

// ─── Page component ───────────────────────────────────────────────────────────

export default async function SharePage({ params }: Params) {
  const { token } = await params;
  const deck = await fetchSharedDeck(token);

  if (!deck) {
    notFound();
  }

  return <ShareDeckView deck={deck} />;
}
