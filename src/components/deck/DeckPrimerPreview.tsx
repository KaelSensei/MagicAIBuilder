"use client";
/**
 * The primer editor's preview pane: the draft rendered as the public deck page renders it.
 *
 * Context: deck building (ui), inside `DeckPrimerEditorDialog`. It parses with
 * `parsePrimer` and renders each block with `PrimerBlockView`, the pair `PublicDeckPrimer` uses,
 * so the preview cannot disagree with the public page: same Markdown subset, same link
 * classification (#1417), same elements.
 * Not responsible for: the contents bar, the copy and download actions, or editing.
 *
 * @module deck/DeckPrimerPreview
 */
import { useId, useMemo } from "react";
import {
  keyPrimerSiblings,
  parsePrimer,
  primerInlineText,
  type PrimerBlock,
} from "@/lib/community/primer-markdown";
import { PrimerBlockView } from "@/components/profile/PrimerBlocks";

interface DeckPrimerPreviewProps {
  /** The draft as the owner is typing it. */
  readonly markdown: string;
  /** The visible name of the pane, which also names its region. */
  readonly label: string;
  /** The line shown while the draft renders to nothing. */
  readonly emptyText: string;
  /** Height and scroll classes for the rendered body, shared with the source pane. */
  readonly bodyClassName: string;
}

/** What a block says, for its sibling key: two equal blocks get distinct keys by occurrence. */
function blockContent(block: PrimerBlock): string {
  switch (block.kind) {
    case "heading":
      return `heading:${block.text}`;
    case "paragraph":
      return `paragraph:${primerInlineText(block.content)}`;
    case "list":
      return `list:${block.items.map(primerInlineText).join("\n")}`;
    default: {
      const unhandled: never = block;
      return unhandled;
    }
  }
}

/**
 * A labelled, read-only region showing `markdown` rendered as the public primer.
 *
 * It re-parses on every change of `markdown`; the draft is capped at 2,000 characters, so a parse
 * per keystroke is cheap.
 */
export function DeckPrimerPreview({
  markdown,
  label,
  emptyText,
  bodyClassName,
}: DeckPrimerPreviewProps) {
  const labelId = useId();
  const blocks = useMemo(
    () => keyPrimerSiblings(parsePrimer(markdown), blockContent),
    [markdown]
  );

  return (
    <section aria-labelledby={labelId} className="flex min-w-0 flex-col gap-1">
      <span
        id={labelId}
        className="text-xs font-medium text-[var(--text-secondary)]"
      >
        {label}
      </span>
      <div
        className={`rounded-md border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-2 ${bodyClassName}`}
      >
        {blocks.length === 0 ? (
          <p className="text-xs italic text-[var(--text-secondary)]/70">
            {emptyText}
          </p>
        ) : (
          blocks.map(({ key, node }) => (
            <PrimerBlockView key={key} block={node} />
          ))
        )}
      </div>
    </section>
  );
}
