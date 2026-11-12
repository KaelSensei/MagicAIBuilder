"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  useFormatter,
  useTranslations,
  type NumberFormatOptions,
} from "next-intl";
import { Search, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  CARD_BACK_URL,
  normalizeScryfallImageUrl,
} from "@/lib/scryfall/images";
import { VoteButtons } from "./VoteButtons";
import type { CommanderDeckSummary } from "@/lib/community/discovery-types";
import { filterDiscoveryDecks } from "@/lib/community/discovery-filter";
import { cardSurfaceClassName } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/components/ui/utils";
import { PublicDeckComparison } from "./PublicDeckComparison";

interface CommanderDecksViewProps {
  readonly commanderName: string;
  readonly decks: readonly CommanderDeckSummary[];
  readonly canVote: boolean;
}

/** One decimal, as the ratings API rounds the average to tenths. */
const AVERAGE_RATING_FORMAT: Readonly<NumberFormatOptions> = {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
};

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
  const format = useFormatter();
  const authorName =
    deck.author?.name ?? deck.author?.username ?? t("anonymous");

  return (
    <li className={cn(cardSurfaceClassName, "flex items-center gap-4 p-3")}>
      <VoteButtons
        deckId={deck.id}
        score={deck.score}
        viewerVote={deck.viewerVote ?? null}
        canVote={canVote}
      />

      <Image
        src={normalizeScryfallImageUrl(
          deck.commander.artCropUri || deck.commander.imageUri || CARD_BACK_URL
        )}
        alt={deck.commander.name}
        width={64}
        height={46}
        className="h-16 w-16 shrink-0 rounded-[var(--lumen-radius-md)] object-cover"
        unoptimized
      />

      <div className="min-w-0 flex-1">
        <Link
          href={`/deck/${deck.id}`}
          className="block truncate font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--accent-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
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
              {format.number(deck.averageRating, AVERAGE_RATING_FORMAT)}
            </p>
            <p className="text-[11px] text-[var(--text-secondary)]">
              {t("ratedBy", { count: deck.ratingCount })}
            </p>
          </>
        ) : (
          <p className="text-[11px] text-[var(--text-secondary)]">
            {t("unrated")}
          </p>
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
  const [query, setQuery] = useState("");
  const visibleDecks = useMemo(
    () => filterDiscoveryDecks(decks, query),
    [decks, query]
  );

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
        <p className={cn(cardSurfaceClassName, "p-6 text-center text-sm text-[var(--text-secondary)]")}>
          {t("noDecks")}
        </p>
      ) : (
        <>
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("filterPlaceholder")}
              aria-label={t("filterPlaceholder")}
              className="w-full pl-10"
            />
          </div>
          <PublicDeckComparison decks={visibleDecks} />
          {visibleDecks.length === 0 ? (
            <p className={cn(cardSurfaceClassName, "p-6 text-center text-sm text-[var(--text-secondary)]")}>
              {t("filterEmpty")}
            </p>
          ) : (
            <ul className="space-y-2">
              {visibleDecks.map((deck) => (
                <DeckRow key={deck.id} deck={deck} canVote={canVote} />
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
