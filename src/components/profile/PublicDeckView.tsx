"use client";
// Public read-only deck page — accessible without auth for public decks
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { User, ExternalLink, Layers, Link2, Check } from "lucide-react";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/deck/categories";
import type { CardCategory } from "@/lib/deck/types";
import type { PublicCard, PublicDeck } from "@/lib/deck/public-deck";
import { DeckRatingPanel } from "@/components/community/DeckRatingPanel";
import { DeckCommentPanel } from "@/components/community/DeckCommentPanel";

interface PublicDeckViewProps {
  readonly deck: PublicDeck;
  /** Anonymous viewers see the aggregate but cannot rate. */
  readonly isSignedIn: boolean;
}

const BRACKET_COLORS: Record<number, string> = {
  1: "text-green-400 border-green-400/30 bg-green-400/10",
  2: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  3: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  4: "text-red-400 border-red-400/30 bg-red-400/10",
};

export function PublicDeckView({ deck, isSignedIn }: PublicDeckViewProps) {
  const t = useTranslations("deck");
  const [copied, setCopied] = useState(false);
  const commander = deck.cards.find((c) => c.isCommander && !c.isPartner);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const partner = deck.cards.find((c) => c.isPartner);
  const nonCommanderCards = deck.cards.filter((c) => !c.isCommander && !c.isPartner);

  // Group by category
  const grouped = CATEGORY_ORDER.reduce<Record<string, PublicCard[]>>((acc, cat) => {
    const cards = nonCommanderCards.filter((c) => c.category === cat);
    if (cards.length > 0) acc[cat] = cards;
    return acc;
  }, {});

  const authorName = deck.user?.name ?? deck.user?.username ?? "Unknown";
  const authorUsername = deck.user?.username;
  const totalCards = deck.cards.reduce((s, c) => s + c.quantity, 0);

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Deck header */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Commander art */}
        {commander?.artCropUri && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={commander.artCropUri}
            alt={commander.name}
            className="w-full sm:w-40 h-28 sm:h-24 rounded-xl object-cover border border-[var(--border)] shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{deck.name}</h1>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => void handleCopyLink()}
                className="flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-400" aria-hidden="true" />
                ) : (
                  <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                {copied ? t("share.copiedLink") : t("share.copyLink")}
              </button>
              {deck.isOwner && (
                <Link
                  href={`/builder/${deck.id}`}
                  className="flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t("share.editDeck")}
                </Link>
              )}
            </div>
          </div>

          {/* Commander info */}
          {commander && (
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {commander.name}
              {partner && ` + ${partner.name}`}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <span
              className={`text-xs px-1.5 py-0.5 rounded border font-medium ${BRACKET_COLORS[deck.targetBracket] ?? ""}`}
            >
              Bracket {deck.targetBracket}
            </span>
            <span className="text-xs text-[var(--text-secondary)] capitalize">{deck.format}</span>
            <span className="text-xs text-[var(--text-secondary)]">{totalCards} cards</span>
            {deck.isAIGenerated && (
              <span className="text-xs text-purple-400">✦ AI generated</span>
            )}
          </div>

          {/* Description */}
          {deck.description && (
            <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-2">
              {deck.description}
            </p>
          )}

          {/* Author */}
          <div className="flex items-center gap-2 mt-3">
            {deck.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={deck.user.image}
                alt={authorName}
                className="w-5 h-5 rounded-full border border-[var(--border)]"
              />
            ) : (
              <User className="w-4 h-4 text-[var(--text-secondary)]" />
            )}
            {authorUsername ? (
              <Link
                href={`/u/${authorUsername}`}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
              >
                {authorName}
              </Link>
            ) : (
              <span className="text-xs text-[var(--text-secondary)]">{authorName}</span>
            )}
          </div>
        </div>
      </div>

      {/* Community rating */}
      <DeckRatingPanel
        deckId={deck.id}
        isOwner={deck.isOwner}
        isSignedIn={isSignedIn}
      />

      {/* Comment stream */}
      <DeckCommentPanel
        deckId={deck.id}
        isOwner={deck.isOwner}
        isSignedIn={isSignedIn}
      />

      {/* Card list */}
      <div className="flex flex-col gap-4">
        {Object.entries(grouped).map(([cat, cards]) => (
          <section key={cat}>
            <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-2">
              <Layers className="w-3 h-3" />
              {CATEGORY_LABELS[cat as CardCategory] ?? cat}
              <span className="text-[var(--text-secondary)] font-normal normal-case tracking-normal">
                ({cards.reduce((s, c) => s + c.quantity, 0)})
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--surface)] transition-colors"
                >
                  {card.quantity > 1 && (
                    <span className="text-xs font-medium text-[var(--accent)] w-4 shrink-0">
                      {card.quantity}×
                    </span>
                  )}
                  <span className="text-sm text-[var(--text-primary)] truncate">{card.name}</span>
                  {card.isGameChanger && (
                    <span className="text-xs text-amber-400 shrink-0">⚡</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
