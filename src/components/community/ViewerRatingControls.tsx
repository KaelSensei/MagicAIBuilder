"use client";
/**
 * The viewer's own rating on a public deck: their stars, a "remove" link once
 * they have rated, and a written review they can open, fill in and post.
 *
 * Community context (ui). Presentational: `DeckRatingPanel` sends the writes
 * and reports `saving` and `failed`; this component only knows whether the
 * review form is open. Not responsible for: who may rate, which the panel
 * decides (it hides these controls from owners and visitors).
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";
import type { RatingRequest } from "@/lib/community/community-contracts";
import { StarRating } from "./StarRating";
import { ReviewForm } from "./ReviewForm";

interface ViewerRatingControlsProps {
  /** The stars the viewer gave, `null` when they have not rated yet. */
  readonly viewerRating: number | null;
  /** A write is in flight: the stars, the remove link and the form are disabled. */
  readonly saving: boolean;
  /** The last write was refused or failed; shows the save-failed line. */
  readonly failed: boolean;
  /** Sends a bare star or a written review; resolves true once the route accepted it. */
  readonly onRate: (request: RatingRequest) => Promise<boolean>;
  readonly onRemove: () => Promise<void>;
}

export function ViewerRatingControls({
  viewerRating,
  saving,
  failed,
  onRate,
  onRemove,
}: ViewerRatingControlsProps) {
  const t = useTranslations("deck.ratings");
  const [writing, setWriting] = useState(false);

  /** A star or a review that the route accepted closes an open review form. */
  async function rate(request: RatingRequest): Promise<void> {
    if (await onRate(request)) setWriting(false);
  }

  return (
    <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-[var(--text-primary)]">
          {t("yourRating")}
        </span>
        <StarRating
          value={viewerRating ?? 0}
          onSelect={(rating) => void rate({ rating })}
          disabled={saving}
        />
        {viewerRating !== null && (
          <button
            type="button"
            onClick={() => void onRemove()}
            disabled={saving}
            className="text-xs text-[var(--text-secondary)] underline hover:text-red-400 disabled:opacity-60"
          >
            {t("removeRating")}
          </button>
        )}
      </div>

      {writing ? (
        <ReviewForm
          initialRating={viewerRating ?? 0}
          saving={saving}
          onCancel={() => setWriting(false)}
          onSubmit={(review) => void rate(review)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setWriting(true)}
          className="self-start flex items-center gap-1.5 text-sm text-[var(--accent-text)] hover:underline"
        >
          <MessageSquare className="w-4 h-4" aria-hidden="true" />
          {t("writeReview")}
        </button>
      )}

      {failed && <p className="text-xs text-red-400">{t("saveFailed")}</p>}
    </div>
  );
}
