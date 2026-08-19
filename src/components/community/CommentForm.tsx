"use client";
// One textarea + submit/cancel pair, reused for posting, replying and editing.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { MAX_COMMENT_LENGTH } from "@/lib/community/comments";

interface CommentFormProps {
  readonly initialValue?: string;
  readonly saving: boolean;
  readonly submitLabel: string;
  readonly onSubmit: (body: string) => void;
  /** Omit for the always-visible top-level form, which has nothing to cancel */
  readonly onCancel?: () => void;
}

export function CommentForm({
  initialValue = "",
  saving,
  submitLabel,
  onSubmit,
  onCancel,
}: CommentFormProps) {
  const t = useTranslations("deck.comments");
  const [body, setBody] = useState(initialValue);

  const trimmed = body.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= MAX_COMMENT_LENGTH && !saving;

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        onSubmit(trimmed);
        if (onCancel === undefined) setBody("");
      }}
    >
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={t("placeholder")}
        maxLength={MAX_COMMENT_LENGTH}
        rows={3}
        disabled={saving}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] resize-y focus:outline-none focus:border-[var(--accent)]"
      />
      <div className="flex items-center gap-2 self-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            {t("cancel")}
          </button>
        )}
        <button
          type="submit"
          disabled={!canSubmit}
          className="text-sm px-3 py-1.5 rounded-lg border border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] font-medium disabled:opacity-50 hover:bg-[var(--accent)]/20"
        >
          {saving ? t("posting") : submitLabel}
        </button>
      </div>
    </form>
  );
}
