"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CARD_BACK_URL } from "@/lib/scryfall/images";
import { VoteButtons } from "./VoteButtons";
import type { CommanderDeckSummary } from "@/lib/community/discovery-types";

interface CommanderDecksViewProps {
  readonly commanderName: string;
  readonly decks: readonly CommanderDeckSummary[];
  readonly canVote: boolean;
}

/** One row of the discovery listing. */
function DeckRow({
  deck,
  canVote,
}: {
  readonly deck: CommanderDeckSummary;
  readonly canVote: boolean;
}) {
  const t = useTranslations("deck.community");
  const tRatings = useTranslations("deck.ratings");
  const authorName = deck.author?.name ?? deck.author?.username ?? t("anonymous");

  return (
    <li className="flex items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
      <VoteButtons
        deckId={deck.id}
        score={deck.score}
        viewerVote={deck.viewerVote ?? null}
        canVote={canVote}
      />

      <Image
        src={deck.commander.artCropUri || deck.commander.imageUri || CARD_BACK_URL}
        alt={deck.commander.name}
        width={64}
        height={46}
        className="rounded object-cover w-16 h-[46px] shrink-0"
        unoptimized
      />

      <div className="min-w-0 flex-1">
        <Link
          href={`/deck/${deck.id}`}
          className="font-medium text-[var(--text-primary)] hover:text-purple-400 transition-colors truncate block"
        >
          {deck.name}
        </Link>
        <p className="text-xs text-[var(--text-secondary)] truncate">
          {authorName} · {t("cards", { count: deck.cardCount })}
        </p>
      </div>

      <div className="text-right shrink-0">
        {deck.ratingCount > 0 ? (
          <>
            <p className="flex items-center justify-end gap-1 text-sm text-[var(--text-primary)]">
              <Star className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              {deck.averageRating.toFixed(1)}
            </p>
            <p className="text-[11px] text-[var(--text-secondary)]">
              {t("ratedBy", { count: deck.ratingCount })}
            </p>
          </>
        ) : (
          <p className="text-[11px] text-[var(--text-secondary)]">{t("unrated")}</p>
        )}

        {deck.badge === "highly_rated" && (
          <span className="mt-1 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
            {tRatings("badgeHighlyRated")}
          </span>
        )}
      </div>
    </li>
  );
}

/**
 * Public deck discovery for a single commander, ranked by community votes.
 */
export function CommanderDecksView({
  commanderName,
  decks,
  canVote,
}: CommanderDecksViewProps) {
  const t = useTranslations("deck.community");

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          {t("commanderDecksTitle", { commander: commanderName })}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {t("commanderDecksSubtitle")}
        </p>
        {decks.length > 0 && (
          <p className="mt-1 text-xs text-[var(--text-secondary)] opacity-70">
            {t("deckCount", { count: decks.length })}
          </p>
        )}
      </header>

      {decks.length === 0 ? (
        <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-secondary)]">
          {t("noDecks")}
        </p>
      ) : (
        <ul className="space-y-2">
          {decks.map((deck) => (
            <DeckRow key={deck.id} deck={deck} canVote={canVote} />
          ))}
        </ul>
      )}
    </main>
  );
}
