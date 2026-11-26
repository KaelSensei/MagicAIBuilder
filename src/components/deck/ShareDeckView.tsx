"use client";
/**
 * The read-only page a share link opens (`/share/[token]`): a header with the
 * deck's name, format and commanders, then its cards by category, its mana
 * curve and stats, and a button that forks the deck.
 *
 * Deck-sharing UI. The header has two colour sets, picked by whether the
 * commander has an art crop (I-13, design audit S5).
 *
 * @module components/deck/ShareDeckView
 */
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useDeckStore } from "@/lib/deck/store";
import { forkPublicDeck } from "@/lib/db/deck-api";
import { ManaCostDisplay } from "@/components/card/ManaSymbol";
import {
  Layers,
  Copy,
  Check,
  ExternalLink,
  Users,
  BarChart2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { ManaCurve } from "./ManaCurve";
import { ColorDistribution } from "./ColorDistribution";
import { cn } from "@/components/ui/utils";
import { cardSurfaceClassName } from "@/components/ui/Card";
import { filterCardsByCategory } from "@/lib/deck/deck-preview";
import { CategoryFilter, DeckCardStrip } from "./DeckPreviewChrome";
import type { CardCategory } from "@/lib/deck/types";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/deck/categories";
import { commandSlotOf } from "@/lib/deck/bulk-edit-command-zone";
import {
  AVERAGE_MANA_VALUE_FORMAT,
  averageManaValue,
} from "@/lib/deck/average-mana-value";
import { logger } from "@/lib/logger";
import type { ApiCard, ApiSharedDeck } from "@/lib/deck/share-types";
import { normalizeScryfallImageUrl } from "@/lib/scryfall/images";
import { manaCurveOf } from "@/lib/deck/curve-breakdown";
import { sharedDeckCurveCards } from "@/lib/deck/shared-deck-curve-cards";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BRACKET_COLORS: Record<number, string> = {
  1: "text-green-400 bg-green-400/10 border-green-400/30",
  2: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  3: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  4: "text-red-400 bg-red-400/10 border-red-400/30",
  5: "text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/30",
};

/** The class names that colour the header's backdrop and text. */
interface HeaderTone {
  readonly backdrop: string;
  readonly homeLink: string;
  readonly badge: string;
  readonly title: string;
  readonly detail: string;
  readonly emphasis: string;
}

/**
 * The header's two colour sets (I-13, design audit S5). Without commander art
 * the header is the plain `--surface`, white in the light theme, so its text
 * takes the theme's text tokens, which `src/styles/contrast.test.ts` holds to
 * 4.5:1 on every surface. On the art the text is white on a black scrim whose
 * lightest stop is 60 %: even over an all-white art, white text reads at
 * 5.74:1 and 90 % white at 5.04:1 (WCAG 2.1 SC 1.4.3). The fade into the page
 * sits below the text, never under it.
 */
const HEADER_TONES = {
  onArt: {
    backdrop: "bg-gradient-to-b from-black/75 to-black/60",
    homeLink: "text-white/90 hover:text-white",
    badge: "border-white/40 text-white/90",
    title: "text-white",
    detail: "text-white/90",
    emphasis: "text-white",
  },
  onSurface: {
    backdrop: "bg-[var(--surface)]",
    homeLink: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
    badge: "border-[var(--border)] text-[var(--text-secondary)]",
    title: "text-[var(--text-primary)]",
    detail: "text-[var(--text-secondary)]",
    emphasis: "text-[var(--text-primary)]",
  },
} as const satisfies Readonly<Record<string, HeaderTone>>;

function computeColorDistribution(cards: ApiCard[]): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const card of cards) {
    for (const color of card.colorIdentity) {
      dist[color] = (dist[color] ?? 0) + 1;
    }
  }
  return dist;
}

// ─── Card row ─────────────────────────────────────────────────────────────────

function CardRow({ card }: { readonly card: ApiCard }) {
  const t = useTranslations("deck");
  return (
    <div className="flex items-center gap-2 py-1 text-sm hover:bg-[var(--surface-hover)] rounded px-1 transition-colors group">
      {card.artCropUri ? (
        <div
          className="w-6 h-6 rounded-sm shrink-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${normalizeScryfallImageUrl(card.artCropUri)})`,
          }}
        />
      ) : (
        <div className="w-6 h-6 rounded-sm shrink-0 bg-[var(--border)]" />
      )}
      <span className="flex-1 text-[var(--text-primary)] truncate">
        {card.quantity > 1 && (
          <span className="text-[var(--text-secondary)] mr-1">
            {card.quantity}×
          </span>
        )}
        {card.name}
        {card.isGameChanger && (
          <span className="ml-1.5 text-xs text-amber-400" title={t("card.gameChanger")}>
            ⚡
          </span>
        )}
      </span>
      {card.manaCost && (
        <ManaCostDisplay manaCost={card.manaCost} className="shrink-0" />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ShareDeckViewProps {
  readonly deck: ApiSharedDeck;
}

/**
 * The shared deck page. Readable in both themes: on the commander's art the
 * header is white on a dark scrim, and without art it takes the theme's text
 * tokens.
 *
 * @param props - the deck as the share link serves it
 */
export function ShareDeckView({ deck }: ShareDeckViewProps) {
  const t = useTranslations("deck");
  const format = useFormatter();
  const router = useRouter();
  const { setActiveDeck } = useDeckStore();
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [category, setCategory] = useState("all");

  const commander = deck.cards.find((c) => commandSlotOf(c) === "commander");
  const partner = deck.cards.find((c) => commandSlotOf(c) === "partner");
  const companion = deck.cards.find(
    (c) => c.category === "companion" && !c.isCommander
  );
  const mainCards = deck.cards.filter((c) => commandSlotOf(c) === null);

  // Group by category
  const cardsByCategory = useMemo(() => {
    const groups: Partial<Record<CardCategory, ApiCard[]>> = {};
    for (const card of mainCards) {
      const cat = card.category as CardCategory;
      groups[cat] ??= [];
      groups[cat].push(card);
    }
    return groups;
  }, [mainCards]);

  const visibleMainCards = useMemo(
    () => filterCardsByCategory(mainCards, category),
    [category, mainCards]
  );
  const orderedCategories = CATEGORY_ORDER.filter(
    (cat) =>
      cat !== "commander" && cat !== "companion" && cardsByCategory[cat]?.length
  );

  // The builder's chart, from the builder's rows: same bars, parts, figures and card lists (I-37).
  const curveCards = useMemo(
    () => sharedDeckCurveCards(deck.cards),
    [deck.cards]
  );
  const manaCurve = useMemo(() => manaCurveOf(curveCards), [curveCards]);
  const colorDist = useMemo(
    () => computeColorDistribution([...deck.cards]),
    [deck.cards]
  );
  // The builder's rule on the builder's rows: the deck's own rows, the command zone set apart (I-37).
  const avgCmc = useMemo(() => averageManaValue(mainCards), [mainCards]);
  const totalCards = deck.cards.length;
  const gameChangers = deck.cards.filter((c) => c.isGameChanger);

  const handleImport = async () => {
    if (importing) return;
    setImporting(true);
    try {
      const fork = await forkPublicDeck(deck.id);
      await setActiveDeck(fork.id);
      setImported(true);
      setTimeout(() => router.push(`/builder/${fork.id}`), 800);
    } catch (err) {
      logger.error("Fork failed", "ShareDeckView", err);
    } finally {
      setImporting(false);
    }
  };

  const bgStyle = commander?.artCropUri
    ? {
        backgroundImage: `url(${normalizeScryfallImageUrl(commander.artCropUri)})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }
    : undefined;
  // The one decision behind the header's colours: white on the art's scrim,
  // or the theme's tokens on the plain surface.
  const onArt = bgStyle !== undefined;
  const tone = onArt ? HEADER_TONES.onArt : HEADER_TONES.onSurface;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)]">
      {/* Hero header */}
      <div
        className="relative overflow-hidden"
        style={bgStyle}
        data-testid="share-header"
      >
        <div
          className={cn("absolute inset-0", tone.backdrop)}
          data-testid="share-header-scrim"
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
          {/* Nav */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2 transition-colors",
                tone.homeLink
              )}
            >
              <Layers className="w-5 h-5 text-[var(--accent-text)]" />
              <span className="font-semibold">MagicAIBuilder</span>
            </Link>
            <span
              className={cn(
                "text-xs px-2 py-1 rounded-full border",
                tone.badge
              )}
            >
              {t("share.readOnly")}
            </span>
          </div>

          {/* Deck title */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <h1 className={cn("text-3xl font-bold mb-2", tone.title)}>
                {deck.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full border font-medium",
                    BRACKET_COLORS[deck.targetBracket] ?? BRACKET_COLORS[2]
                  )}
                >
                  {t("share.bracketLabel")} {deck.targetBracket}
                </span>
                <span className={cn("text-xs", tone.detail)}>
                  {deck.format}
                </span>
                <span className={cn("text-xs", tone.detail)}>
                  {t("share.cardCountLabel", { count: totalCards })}
                </span>
                {gameChangers.length > 0 && (
                  <span className="text-xs text-amber-400">
                    {t("share.gameChangerCount", {
                      count: gameChangers.length,
                    })}
                  </span>
                )}
              </div>
              {commander && (
                <p className={cn("text-sm mt-2", tone.detail)}>
                  {t("card.commander", { name: "" })}
                  <span className={cn("font-medium", tone.emphasis)}>
                    {commander.name}
                  </span>
                  {partner && (
                    <>
                      {" "}
                      +{" "}
                      <span className={cn("font-medium", tone.emphasis)}>
                        {partner.name}
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Import button */}
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || imported}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-[var(--lumen-radius-pill)] px-4 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
                imported
                  ? "bg-green-500/20 text-green-400 border border-green-500/40 cursor-default"
                  : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              {imported && (
                <>
                  <Check className="w-4 h-4" />
                  {t("share.imported")}
                </>
              )}
              {!imported && importing && (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {t("share.importing")}
                </>
              )}
              {!imported && !importing && (
                <>
                  <ExternalLink className="w-4 h-4" />
                  {t("share.forkThisDeck")}
                </>
              )}
            </button>
          </div>
        </div>
        {/* Below the text, never under it: the art fades into the page. */}
        {onArt && (
          <div
            className="relative h-16 bg-gradient-to-b from-transparent to-[var(--background)]"
            data-testid="share-header-fade"
          />
        )}
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
                {t("share.commandZone")}
              </h2>
              <div className={cn(cardSurfaceClassName, "space-y-0.5 p-2")}>
                {commander && <CardRow card={commander} />}
                {partner && <CardRow card={partner} />}
                {companion && <CardRow card={companion} />}
              </div>
            </div>
          )}

          {/* Cards by category */}
          <CategoryFilter
            options={orderedCategories.map((cat) => ({
              id: cat,
              label: CATEGORY_LABELS[cat],
              count: (cardsByCategory[cat] ?? []).reduce((sum, card) => sum + card.quantity, 0),
            }))}
            value={category}
            allLabel={t("share.filterAll")}
            onChange={setCategory}
          />
          <DeckCardStrip
            cards={visibleMainCards.map((card) => ({
              id: card.id,
              name: card.name,
              category: card.category,
              imageUri: card.imageUri,
            }))}
          />
          {orderedCategories.filter((cat) => category === "all" || cat === category).map((cat) => {
            const cards = cardsByCategory[cat] ?? [];
            const total = cards.reduce((sum, c) => sum + c.quantity, 0);
            return (
              <div key={cat} className="mb-5">
                <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span>{CATEGORY_LABELS[cat]}</span>
                  <span className="text-[var(--border)] font-normal">
                    ({total})
                  </span>
                </h2>
                <div className={cn(cardSurfaceClassName, "space-y-0.5 p-2")}>
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
          <div className={cn(cardSurfaceClassName, "p-4")}>
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" />
              {t("share.statsTitle")}
            </h3>
            <div className="space-y-2 text-sm">
              <StatRow
                label={t("share.bracketLabel")}
                value={`${deck.targetBracket}`}
              />
              <StatRow label={t("share.totalCards")} value={`${totalCards}`} />
              <StatRow
                label={t("share.avgCmc")}
                value={format.number(avgCmc, AVERAGE_MANA_VALUE_FORMAT)}
              />
              <StatRow
                label={t("stats.lands")}
                value={`${deck.cards.filter((c) => c.category === "land").length}`}
              />
              <StatRow
                label={t("share.creatures")}
                value={`${deck.cards.filter((c) => c.category === "creature").length}`}
              />
              <StatRow
                label={t("stats.ramp")}
                value={`${deck.cards.filter((c) => c.category === "ramp").length}`}
              />
              <StatRow
                label={t("stats.cardDraw")}
                value={`${deck.cards.filter((c) => c.category === "draw").length}`}
              />
              <StatRow
                label={t("stats.removal")}
                value={`${deck.cards.filter((c) => c.category === "removal").length}`}
              />
              {gameChangers.length > 0 && (
                <StatRow
                  label={t("share.gameChangers")}
                  value={`${gameChangers.length}`}
                  highlight
                />
              )}
              {deck.budget !== null && (
                <StatRow
                  label={t("share.budgetPerCard")}
                  value={`${format.number(deck.budget, {
                    style: "currency",
                    currency: "USD",
                  })}/card`}
                />
              )}
            </div>
          </div>

          {/* Mana Curve: the chart's own title is the panel's heading, at the Stats panel's level. */}
          <ManaCurve
            curve={manaCurve}
            averageManaValue={avgCmc}
            cards={curveCards}
            titleAs="h3"
            className={cardSurfaceClassName}
          />

          {/* Color Distribution */}
          <div className={cn(cardSurfaceClassName, "p-4")}>
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              {t("share.colorDistribution")}
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
  readonly label: string;
  readonly value: string;
  readonly highlight?: boolean;
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
  const t = useTranslations("deck");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(globalThis.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className={cn(cardSurfaceClassName, "p-4")}>
      <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
        {t("share.shareThisDeck")}
      </h3>
      <button
        type="button"
        onClick={handleCopy}
        className="w-full flex items-center gap-2 text-xs px-3 py-2 rounded border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
        ) : (
          <Copy className="w-3.5 h-3.5 shrink-0" />
        )}
        <span className="flex-1 text-left truncate">
          {copied ? t("share.copiedLink") : t("share.copyLink")}
        </span>
      </button>
    </div>
  );
}
