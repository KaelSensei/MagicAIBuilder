"use client";
// One textarea + submit/cancel pair, reused for posting, replying and editing.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { MAX_COMMENT_LENGTH } from "@/lib/community/comments";
import { Button } from "@/components/ui/Button";
import { textAreaShellClassName } from "@/components/ui/Input";

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
        // The design has no room for a visible label above every reply and
        // edit box, and a placeholder is no name (WCAG 2.2 SC 4.1.2).
        aria-label={t("fieldLabel")}
        placeholder={t("placeholder")}
        maxLength={MAX_COMMENT_LENGTH}
        rows={3}
        disabled={saving}
        className={textAreaShellClassName}
      />
      <div className="flex items-center gap-2 self-end">
        {onCancel && (
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
            {t("cancel")}
          </Button>
        )}
        <Button type="submit" variant="primary" size="sm" disabled={!canSubmit}>
          {saving ? t("posting") : submitLabel}
        </Button>
      </div>
    </form>
  );
}
