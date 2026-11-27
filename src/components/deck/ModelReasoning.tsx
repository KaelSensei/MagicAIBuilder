"use client";

/**
 * The model's own sentence on an AI suggestion, tagged as model reasoning.
 *
 * AI copilot, presentational. I-02 requirement 1.3: a reasoned claim is
 * labelled as model reasoning, names no source and is never styled to look
 * checked, so the tag has no check mark and none of the "Scryfall verified"
 * colours. Requirement 1.4: the tag is a word and an icon, so the distinction
 * survives greyscale. The tag sits inside the sentence's paragraph, not in a
 * footer, so a screen reader reads it with the sentence.
 * Not responsible for: the checked card-data facts, which
 * `SuggestionEvidenceDetails` shows under their own "Scryfall verified" tag.
 *
 * @module components/deck/ModelReasoning
 */
import { MessageSquareText } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * One sentence the model wrote, preceded by its "Model reasoning" tag.
 *
 * A blank sentence renders nothing: like `suggestionClaims`, which makes no
 * reasoned claim from a blank reason, the panel shows no tag with nothing to
 * tag.
 *
 * @param text - the model's sentence, shown as written
 * @param className - the paragraph's classes, so each list keeps its own type size
 */
export function ModelReasoning({
  text,
  className,
}: {
  readonly text: string;
  readonly className?: string;
}) {
  const t = useTranslations("deck.ai");
  if (text.trim().length === 0) return null;

  return (
    <p className={className}>
      <span className="mr-1 inline-flex items-center gap-0.5 rounded border border-dashed border-[var(--border)] px-1 align-middle text-[9px] font-medium">
        <MessageSquareText aria-hidden="true" className="h-2.5 w-2.5 shrink-0" />
        {t("modelReasoning")}
      </span>
      {text}
    </p>
  );
}
