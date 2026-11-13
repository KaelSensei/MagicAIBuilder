"use client";
/**
 * Community rating block on a public deck page: the aggregate (average,
 * count, histogram, quality badge), the viewer's own rating with an optional
 * written review, and the reviews other players left.
 *
 * Community context (ui). Reads the aggregate through `useRemoteResource` and
 * the typed community client (`fetchDeckRatings`), writes through `rateDeck`
 * and `removeRating`, and reloads the aggregate after every write. Not
 * responsible for: the rule that an owner may not rate their own deck, which
 * the route enforces (the panel only hides the input); the request shapes
 * and the 15 s read timeout, which the client owns.
 */
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import type { QualityBadge } from "@/lib/ratings/ratings";
import { useRemoteResource } from "@/hooks/useRemoteResource";
import {
  fetchDeckRatings,
  rateDeck,
  removeRating,
} from "@/lib/community/community-client";
import type { RatingRequest } from "@/lib/community/community-contracts";
import { StarRating } from "./StarRating";
import { RatingHistogramBars } from "./RatingHistogramBars";
import { ReviewList } from "./ReviewList";
import { ViewerRatingControls } from "./ViewerRatingControls";

interface DeckRatingPanelProps {
  readonly deckId: string;
  /** True when the viewer owns this deck — owners may not rate it. */
  readonly isOwner: boolean;
  readonly isSignedIn: boolean;
}

const BADGE_STYLES: Record<NonNullable<QualityBadge>, string> = {
  highly_rated: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  low_rated:
    "text-[var(--text-secondary)] border-[var(--border)] bg-[var(--surface)]",
};

const BADGE_LABEL_KEYS: Record<NonNullable<QualityBadge>, string> = {
  highly_rated: "badgeHighlyRated",
  low_rated: "badgeLowRated",
};

/** The viewer's writes as the controls render them. */
interface RatingWrites {
  /** A write or the reload that follows it is in flight. */
  readonly saving: boolean;
  /** The last write was refused or failed; cleared when the next one starts. */
  readonly failed: boolean;
  /** Resolves true once the route accepted the rating or review. */
  readonly rate: (request: RatingRequest) => Promise<boolean>;
  readonly remove: () => Promise<void>;
}

/**
 * Sends the viewer's rating writes and reloads the aggregate after each one.
 * A write resolves as soon as the route accepted it, so the review form can
 * close at once, while `saving` stays true until the reload has landed and
 * keeps the stars and the remove button disabled meanwhile, as before.
 */
function useRatingWrites(
  deckId: string,
  reload: () => Promise<void>
): RatingWrites {
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  async function write(send: () => Promise<unknown>): Promise<boolean> {
    setSaving(true);
    setFailed(false);
    try {
      await send();
    } catch {
      setFailed(true);
      setSaving(false);
      return false;
    }
    // `reload` never rejects: a failed read shows in the resource's status.
    void reload().finally(() => setSaving(false));
    return true;
  }

  return {
    saving,
    failed,
    rate: (request) => write(() => rateDeck(deckId, request)),
    remove: async () => {
      await write(() => removeRating(deckId));
    },
  };
}

/**
 * Shown when the aggregate could not be read and nothing is on screen yet. A
 * failed read has to be *visible*: the body renders only once `data` is set,
 * so a swallowed failure looked exactly like a deck with no ratings.
 */
function RatingsLoadFailed({ onRetry }: { readonly onRetry: () => void }) {
  const t = useTranslations("deck.ratings");
  const tCommon = useTranslations("common");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm text-[var(--text-secondary)]">{t("loadFailed")}</p>
      <button
        type="button"
        onClick={onRetry}
        className="text-xs px-2 py-1 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
      >
        {tCommon("error.retry")}
      </button>
    </div>
  );
}

export function DeckRatingPanel({
  deckId,
  isOwner,
  isSignedIn,
}: DeckRatingPanelProps) {
  const t = useTranslations("deck.ratings");
  const loadRatings = useCallback(() => fetchDeckRatings(deckId), [deckId]);
  const { data, status, reload } = useRemoteResource(loadRatings);
  const writes = useRatingWrites(deckId, reload);

  const canRate = isSignedIn && !isOwner;

  return (
    <section className="flex flex-col gap-4 rounded-[var(--lumen-radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--lumen-shadow-sm)]">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {t("title")}
        </h2>
        {data?.badge && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${BADGE_STYLES[data.badge]}`}
          >
            {t(BADGE_LABEL_KEYS[data.badge])}
          </span>
        )}
      </header>

      {status === "failed" && !data && (
        <RatingsLoadFailed onRetry={() => void reload()} />
      )}

      {data && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <StarRating value={data.average} />
            <span className="text-sm text-[var(--text-secondary)]">
              {data.count === 0
                ? t("noRatings")
                : t("voteCount", { count: data.count })}
            </span>
          </div>

          {data.count > 0 && (
            <RatingHistogramBars
              histogram={data.histogram}
              total={data.count}
            />
          )}

          {isOwner && (
            <p className="text-sm text-[var(--text-secondary)]">
              {t("ownDeck")}
            </p>
          )}
          {!isSignedIn && (
            <p className="text-sm text-[var(--text-secondary)]">
              {t("signInToRate")}
            </p>
          )}

          {canRate && (
            <ViewerRatingControls
              viewerRating={data.viewerRating}
              saving={writes.saving}
              failed={writes.failed}
              onRate={writes.rate}
              onRemove={writes.remove}
            />
          )}

          <div className="border-t border-[var(--border)] pt-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              {t("reviewsTitle")}
            </h3>
            <ReviewList reviews={data.reviews} />
          </div>
        </>
      )}
    </section>
  );
}
