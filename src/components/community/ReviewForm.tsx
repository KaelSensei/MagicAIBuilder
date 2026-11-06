"use client";
// Written-review form. Limits mirror validateReview() in lib/ratings/ratings.ts,
// which is re-run server-side — this is a UX guard, not the source of truth.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/Button";
import { Input, textAreaShellClassName } from "@/components/ui/Input";

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
      className="flex flex-col gap-3 rounded-[var(--lumen-radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--lumen-shadow-sm)]"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit({ rating, title: title.trim(), body: body.trim() });
      }}
    >
      <StarRating value={rating} onSelect={setRating} disabled={saving} size="sm" />

      <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
        {t("reviewTitleLabel")}
        <Input
          type="text"
          value={title}
          maxLength={TITLE_MAX_LENGTH}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t("reviewTitlePlaceholder")}
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
          className={textAreaShellClassName}
        />
      </label>

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={!canSubmit}>
          {saving ? t("submitting") : t("submitReview")}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
