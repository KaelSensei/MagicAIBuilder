"use client";
// Written-review form. Limits mirror validateReview() in lib/ratings/ratings.ts,
// which is re-run server-side — this is a UX guard, not the source of truth.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { StarRating } from "./StarRating";

const TITLE_MAX_LENGTH = 100;
const BODY_MAX_LENGTH = 1000;

interface ReviewFormProps {
  readonly initialRating: number;
  readonly saving: boolean;
  readonly onCancel: () => void;
  readonly onSubmit: (review: { rating: number; title: string; body: string }) => void;
}

export function ReviewForm({ initialRating, saving, onCancel, onSubmit }: ReviewFormProps) {
  const t = useTranslations("deck.ratings");
  const [rating, setRating] = useState(initialRating || 5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !saving;

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-[var(--border)] p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit({ rating, title: title.trim(), body: body.trim() });
      }}
    >
      <StarRating value={rating} onSelect={setRating} disabled={saving} size="sm" />

      <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
        {t("reviewTitleLabel")}
        <input
          type="text"
          value={title}
          maxLength={TITLE_MAX_LENGTH}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t("reviewTitlePlaceholder")}
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
        {t("reviewBodyLabel")}
        <textarea
          value={body}
          rows={4}
          maxLength={BODY_MAX_LENGTH}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t("reviewBodyPlaceholder")}
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--text-primary)] resize-y"
        />
      </label>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="text-sm px-3 py-1.5 rounded-lg border border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] font-medium disabled:opacity-50 hover:bg-[var(--accent)]/20"
        >
          {saving ? t("submitting") : t("submitReview")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
