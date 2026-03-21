// Public read-only deck view — accessible without authentication
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShareDeckView } from "@/components/deck/ShareDeckView";

interface Params {
  params: Promise<{ token: string }>;
}

// ─── Types matching the API response ─────────────────────────────────────────

interface ApiCard {
  id: string;
  scryfallId: string;
  name: string;
  manaCost: string;
  cmc: number;
  typeLine: string;
  oracleText: string;
  colorIdentity: string[];
  isGameChanger: boolean;
  isBanned: boolean;
  price: number | null;
  imageUri: string;
  artCropUri: string;
  category: string;
  quantity: number;
  isCommander: boolean;
  isPartner: boolean;
}

interface ApiSharedDeck {
  id: string;
  name: string;
  format: string;
  targetBracket: number;
  budget: number | null;
  commanderId: string | null;
  partnerId: string | null;
  companionId: string | null;
  pairingType: string;
  shareEnabled: boolean;
  cards: ApiCard[];
  createdAt: string;
  updatedAt: string;
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
  const commanderLabel = commander
    ? partner
      ? `${commander.name} + ${partner.name}`
      : commander.name
    : "No commander";

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
