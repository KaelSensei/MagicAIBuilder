"use client";
// Read-only public view of a shared deck
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDeckStore } from "@/lib/deck/store";
import { Layers, Copy, Check, ExternalLink, Users, BarChart2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ManaCurve } from "./ManaCurve";
import { ColorDistribution } from "./ColorDistribution";
import { cn } from "@/components/ui/utils";
import type { CardCategory } from "@/lib/deck/types";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/deck/categories";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiCard {
  id: string;
  scryfallId: string;
  name: string;
  manaCost: string;
  cmc: number;
  typeLine: string;
  oracleText: string;
  readonly colorIdentity: readonly string[];
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
  readonly cards: readonly ApiCard[];
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BRACKET_COLORS: Record<number, string> = {
  1: "text-green-400 bg-green-400/10 border-green-400/30",
  2: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  3: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  4: "text-red-400 bg-red-400/10 border-red-400/30",
};

function computeManaCurve(cards: ApiCard[]): Record<number, number> {
  const curve: Record<number, number> = {};
  for (const card of cards) {
    if (card.category === "land") continue;
    const bucket = Math.min(Math.floor(card.cmc), 7);
    curve[bucket] = (curve[bucket] ?? 0) + card.quantity;
  }
  return curve;
}

function computeColorDistribution(cards: ApiCard[]): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const card of cards) {
    for (const color of card.colorIdentity) {
      dist[color] = (dist[color] ?? 0) + 1;
    }
  }
  return dist;
}

function computeAvgCmc(cards: ApiCard[]): number {
  const nonLands = cards.filter((c) => c.category !== "land" && !c.isCommander && !c.isPartner);
  if (nonLands.length === 0) return 0;
  const total = nonLands.reduce((sum, c) => sum + c.cmc * c.quantity, 0);
  const count = nonLands.reduce((sum, c) => sum + c.quantity, 0);
  return count > 0 ? Math.round((total / count) * 100) / 100 : 0;
}

// ─── Card row ─────────────────────────────────────────────────────────────────

function CardRow({ card }: { card: ApiCard }) {
  return (
    <div className="flex items-center gap-2 py-1 text-sm hover:bg-[var(--surface-hover)] rounded px-1 transition-colors group">
      {card.artCropUri ? (
        <div
          className="w-6 h-6 rounded-sm shrink-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${card.artCropUri})` }}
        />
      ) : (
        <div className="w-6 h-6 rounded-sm shrink-0 bg-[var(--border)]" />
      )}
      <span className="flex-1 text-[var(--text-primary)] truncate">
        {card.quantity > 1 && (
          <span className="text-[var(--text-secondary)] mr-1">{card.quantity}×</span>
        )}
        {card.name}
        {card.isGameChanger && (
          <span className="ml-1.5 text-xs text-amber-400" title="Game Changer">⚡</span>
        )}
      </span>
      {card.manaCost && (
        <span className="text-xs text-[var(--text-secondary)] shrink-0">{card.manaCost}</span>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ShareDeckViewProps {
  deck: ApiSharedDeck;
}

export function ShareDeckView({ deck }: ShareDeckViewProps) {
  const router = useRouter();
  const { createDeck, addDeckCard, setActiveDeck } = useDeckStore();
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  const commander = deck.cards.find((c) => c.isCommander && !c.isPartner);
  const partner = deck.cards.find((c) => c.isPartner);
  const companion = deck.cards.find((c) => c.category === "companion" && !c.isCommander);
  const mainCards = deck.cards.filter(
    (c) => !c.isCommander && !c.isPartner && c.category !== "companion"
  );

  // Group by category
  const cardsByCategory = useMemo(() => {
    const groups: Partial<Record<CardCategory, ApiCard[]>> = {};
    for (const card of mainCards) {
      const cat = card.category as CardCategory;
      if (!groups[cat]) groups[cat] = [];
      groups[cat]!.push(card);
    }
    return groups;
  }, [mainCards]);

  const orderedCategories = CATEGORY_ORDER.filter(
    (cat) => cat !== "commander" && cat !== "companion" && cardsByCategory[cat]?.length
  );

  const manaCurve = useMemo(() => computeManaCurve([...deck.cards]), [deck.cards]);
  const colorDist = useMemo(() => computeColorDistribution([...deck.cards]), [deck.cards]);
  const avgCmc = useMemo(() => computeAvgCmc([...deck.cards]), [deck.cards]);
  const totalCards = deck.cards.length;
  const gameChangers = deck.cards.filter((c) => c.isGameChanger);

  const handleImport = async () => {
    if (importing) return;
    setImporting(true);
    try {
      const newId = await createDeck(`${deck.name} (imported)`);
      setActiveDeck(newId);

      // Add all cards — commander first
      const allCards = [
        ...(commander ? [commander] : []),
        ...(partner ? [partner] : []),
        ...(companion ? [companion] : []),
        ...mainCards,
      ];

      for (const card of allCards) {
        await addDeckCard({
          id: card.scryfallId,
          name: card.name,
          manaCost: card.manaCost,
          cmc: card.cmc,
          typeLine: card.typeLine,
          oracleText: card.oracleText,
          colorIdentity: [...card.colorIdentity],
          isGameChanger: card.isGameChanger,
          isBanned: card.isBanned,
          price: card.price,
          imageUri: card.imageUri,
          artCropUri: card.artCropUri,
          category: card.category as CardCategory,
          quantity: card.quantity,
          zone: "main",
        });
      }

      setImported(true);
      setTimeout(() => router.push(`/builder/${newId}`), 800);
    } catch (err) {
      console.error("[ShareDeckView] Import failed", err);
    } finally {
      setImporting(false);
    }
  };

  const bgStyle = commander?.artCropUri
    ? {
        backgroundImage: `url(${commander.artCropUri})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }
    : undefined;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)]">
      {/* Hero header */}
      <div className="relative overflow-hidden" style={bgStyle}>
        <div
          className={cn(
            "absolute inset-0",
            commander?.artCropUri
              ? "bg-gradient-to-b from-black/70 via-black/60 to-[var(--background)]"
              : "bg-[var(--surface)]"
          )}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
          {/* Nav */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <Layers className="w-5 h-5 text-[var(--accent)]" />
              <span className="font-semibold">MagicAIBuilder</span>
            </Link>
            <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70 border border-white/20">
              Read-only
            </span>
          </div>

          {/* Deck title */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <h1
                className={cn(
                  "text-3xl font-bold mb-2",
                  commander?.artCropUri ? "text-white" : "text-[var(--text-primary)]"
                )}
              >
                {deck.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full border font-medium",
                    BRACKET_COLORS[deck.targetBracket] ?? BRACKET_COLORS[2]
                  )}
                >
                  Bracket {deck.targetBracket}
                </span>
                <span className="text-xs text-white/60">{deck.format}</span>
                <span className="text-xs text-white/60">{totalCards} cards</span>
                {gameChangers.length > 0 && (
                  <span className="text-xs text-amber-400">
                    ⚡ {gameChangers.length} Game Changer{gameChangers.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {commander && (
                <p
                  className={cn(
                    "text-sm mt-2",
                    commander?.artCropUri ? "text-white/70" : "text-[var(--text-secondary)]"
                  )}
                >
                  Commander:{" "}
                  <span className="font-medium text-white/90">{commander.name}</span>
                  {partner && (
                    <>
                      {" "}
                      + <span className="font-medium text-white/90">{partner.name}</span>
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Import button */}
            <button
              onClick={handleImport}
              disabled={importing || imported}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shrink-0",
                imported
                  ? "bg-green-500/20 text-green-400 border border-green-500/40 cursor-default"
                  : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              {imported && (
                <>
                  <Check className="w-4 h-4" />
                  Imported!
                </>
              )}
              {!imported && importing && (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Importing…
                </>
              )}
              {!imported && !importing && (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Import this deck
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto w-full px-6 py-8 flex flex-col lg:flex-row gap-8">
        {/* Left: Card list */}
        <motion.div
          className="flex-1 min-w-0"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Commander / Partner / Companion */}
          {(commander || partner || companion) && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                Command Zone
              </h2>
              <div className="space-y-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
                {commander && <CardRow card={commander} />}
                {partner && <CardRow card={partner} />}
                {companion && <CardRow card={companion} />}
              </div>
            </div>
          )}

          {/* Cards by category */}
          {orderedCategories.map((cat) => {
            const cards = cardsByCategory[cat] ?? [];
            const total = cards.reduce((sum, c) => sum + c.quantity, 0);
            return (
              <div key={cat} className="mb-5">
                <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span>{CATEGORY_LABELS[cat]}</span>
                  <span className="text-[var(--border)] font-normal">({total})</span>
                </h2>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 space-y-0.5">
                  {cards.map((card) => (
                    <CardRow key={card.id} card={card} />
                  ))}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Right: Stats panel */}
        <motion.div
          className="w-full lg:w-[280px] shrink-0 space-y-4"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Quick stats */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" />
              Stats
            </h3>
            <div className="space-y-2 text-sm">
              <StatRow label="Bracket" value={`${deck.targetBracket}`} />
              <StatRow label="Total cards" value={`${totalCards}`} />
              <StatRow label="Avg. CMC" value={`${avgCmc}`} />
              <StatRow
                label="Lands"
                value={`${deck.cards.filter((c) => c.category === "land").length}`}
              />
              <StatRow
                label="Creatures"
                value={`${deck.cards.filter((c) => c.category === "creature").length}`}
              />
              <StatRow
                label="Ramp"
                value={`${deck.cards.filter((c) => c.category === "ramp").length}`}
              />
              <StatRow
                label="Card Draw"
                value={`${deck.cards.filter((c) => c.category === "draw").length}`}
              />
              <StatRow
                label="Removal"
                value={`${deck.cards.filter((c) => c.category === "removal").length}`}
              />
              {gameChangers.length > 0 && (
                <StatRow label="Game Changers" value={`${gameChangers.length}`} highlight />
              )}
              {deck.budget !== null && (
                <StatRow label="Budget" value={`$${deck.budget}/card`} />
              )}
            </div>
          </div>

          {/* Mana Curve */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Mana Curve
            </h3>
            <ManaCurve curve={manaCurve} />
          </div>

          {/* Color Distribution */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Color Distribution
            </h3>
            <ColorDistribution distribution={colorDist} />
          </div>

          {/* Share URL */}
          <ShareUrlCopy />
        </motion.div>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span
        className={cn(
          "font-medium",
          highlight ? "text-amber-400" : "text-[var(--text-primary)]"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function ShareUrlCopy() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
        Share this deck
      </h3>
      <button
        onClick={handleCopy}
        className="w-full flex items-center gap-2 text-xs px-3 py-2 rounded border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
        <span className="flex-1 text-left truncate">
          {copied ? "Copied!" : "Copy link"}
        </span>
      </button>
    </div>
  );
}
