"use client";
// Community rating block on a public deck page: aggregate, star input, reviews.
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";
import type { QualityBadge, RatingHistogram } from "@/lib/ratings/ratings";
import { StarRating } from "./StarRating";
import { RatingHistogramBars } from "./RatingHistogramBars";
import { ReviewForm } from "./ReviewForm";
import { ReviewList, type ReviewWithAuthor } from "./ReviewList";

export interface DeckRatingsResponse {
  readonly average: number;
  readonly count: number;
  readonly histogram: RatingHistogram;
  readonly badge: QualityBadge;
  readonly reviews: readonly ReviewWithAuthor[];
  readonly viewerRating: number | null;
}

interface DeckRatingPanelProps {
  readonly deckId: string;
  /** True when the viewer owns this deck — owners may not rate it. */
  readonly isOwner: boolean;
  readonly isSignedIn: boolean;
}

const BADGE_STYLES: Record<NonNullable<QualityBadge>, string> = {
  highly_rated: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  low_rated: "text-[var(--text-secondary)] border-[var(--border)] bg-[var(--surface)]",
};

const BADGE_LABEL_KEYS: Record<NonNullable<QualityBadge>, string> = {
  highly_rated: "badgeHighlyRated",
  low_rated: "badgeLowRated",
};

export function DeckRatingPanel({ deckId, isOwner, isSignedIn }: DeckRatingPanelProps) {
  const t = useTranslations("deck.ratings");
  const tCommon = useTranslations("common");
  const [data, setData] = useState<DeckRatingsResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  /** Distinct from `failed`, which reports a failed *write* under the stars. */
  const [loadFailed, setLoadFailed] = useState(false);
  const [writing, setWriting] = useState(false);

  const endpoint = `/api/community/decks/${encodeURIComponent(deckId)}/ratings`;

  /**
   * Reads the aggregate. A failure has to be *visible*: the body renders only
   * when `data` is set, so silently ignoring a non-OK response or a thrown
   * fetch left the panel showing its title and nothing else, forever — and a
   * failed read looked exactly like a deck with no ratings, with no way back.
   */
  const load = useCallback(async () => {
    setLoadFailed(false);
    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        setLoadFailed(true);
        return;
      }
      setData(await res.json());
    } catch {
      setLoadFailed(true);
    }
  }, [endpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(body: { rating: number; title?: string; body?: string }) {
    setSaving(true);
    setFailed(false);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setWriting(false);
      await load();
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  async function removeRating() {
    setSaving(true);
    setFailed(false);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  const canRate = isSignedIn && !isOwner;

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col gap-4">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t("title")}</h2>
        {data?.badge && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${BADGE_STYLES[data.badge]}`}
          >
            {t(BADGE_LABEL_KEYS[data.badge])}
          </span>
        )}
      </header>

      {loadFailed && !data && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-[var(--text-secondary)]">{t("loadFailed")}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs px-2 py-1 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
          >
            {tCommon("error.retry")}
          </button>
        </div>
      )}

      {data && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <StarRating value={data.average} />
            <span className="text-sm text-[var(--text-secondary)]">
              {data.count === 0 ? t("noRatings") : t("voteCount", { count: data.count })}
            </span>
          </div>

          {data.count > 0 && (
            <RatingHistogramBars histogram={data.histogram} total={data.count} />
          )}

          {isOwner && <p className="text-sm text-[var(--text-secondary)]">{t("ownDeck")}</p>}
          {!isSignedIn && (
            <p className="text-sm text-[var(--text-secondary)]">{t("signInToRate")}</p>
          )}

          {canRate && (
            <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-[var(--text-primary)]">{t("yourRating")}</span>
                <StarRating
                  value={data.viewerRating ?? 0}
                  onSelect={(rating) => void submit({ rating })}
                  disabled={saving}
                />
                {data.viewerRating !== null && (
                  <button
                    type="button"
                    onClick={() => void removeRating()}
                    disabled={saving}
                    className="text-xs text-[var(--text-secondary)] underline hover:text-red-400 disabled:opacity-60"
                  >
                    {t("removeRating")}
                  </button>
                )}
              </div>

              {writing ? (
                <ReviewForm
                  initialRating={data.viewerRating ?? 0}
                  saving={saving}
                  onCancel={() => setWriting(false)}
                  onSubmit={(review) => void submit(review)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setWriting(true)}
                  className="self-start flex items-center gap-1.5 text-sm text-[var(--accent)] hover:underline"
                >
                  <MessageSquare className="w-4 h-4" aria-hidden="true" />
                  {t("writeReview")}
                </button>
              )}

              {failed && <p className="text-xs text-red-400">{t("saveFailed")}</p>}
            </div>
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
