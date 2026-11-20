"use client";
/**
 * The primer editor's preview pane: the draft rendered as the public deck page renders it.
 *
 * Context: deck building (ui), inside `DeckPrimerEditorDialog`. It parses with
 * `parsePrimer` and renders each block with `PrimerBlockView`, the pair `PublicDeckPrimer` uses,
 * so the preview cannot disagree with the public page: same Markdown subset, same link
 * classification (#1417), same card mentions resolved against the same deck cards, same elements.
 * Below the rendered draft it lists the mentioned names the deck does not hold (I-36 requirement
 * 4.1), which the public page shows as plain text.
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
import {
  primerCardIndex,
  unresolvedPrimerCardNames,
  type PrimerDeckCard,
} from "@/lib/community/primer-card-links";
import { PrimerBlockView } from "@/components/profile/PrimerBlocks";

interface DeckPrimerPreviewProps {
  /** The draft as the owner is typing it. */
  readonly markdown: string;
  /** The deck's cards, which the draft's `[[Card Name]]` mentions resolve against. */
  readonly cards: readonly PrimerDeckCard[];
  /** The visible name of the pane, which also names its region. */
  readonly label: string;
  /** The line shown while the draft renders to nothing. */
  readonly emptyText: string;
  /** The name of the list of mentioned cards the deck does not hold. */
  readonly unresolvedLabel: string;
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
 * The mentioned names the deck does not hold. The public page shows them as plain text; this
 * list tells the owner why before they save.
 */
function UnresolvedCards({
  names,
  label,
}: {
  readonly names: readonly string[];
  readonly label: string;
}) {
  const labelId = useId();
  if (names.length === 0) return null;
  return (
    <div className="flex flex-col gap-0.5 text-xs text-[var(--text-secondary)]">
      <span id={labelId} className="font-medium">
        {label}
      </span>
      <ul aria-labelledby={labelId} className="flex flex-wrap gap-x-3">
        {names.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A labelled, read-only region showing `markdown` rendered as the public primer, followed by the
 * mentioned cards the deck does not hold.
 *
 * It re-parses on every change of `markdown`; the draft is capped at 2,000 characters, so a parse
 * per keystroke is cheap.
 */
export function DeckPrimerPreview({
  markdown,
  cards,
  label,
  emptyText,
  unresolvedLabel,
  bodyClassName,
}: DeckPrimerPreviewProps) {
  const labelId = useId();
  const blocks = useMemo(() => parsePrimer(markdown), [markdown]);
  const keyedBlocks = useMemo(
    () => keyPrimerSiblings(blocks, blockContent),
    [blocks]
  );
  const cardIndex = useMemo(() => primerCardIndex(cards), [cards]);
  const unresolved = useMemo(
    () => unresolvedPrimerCardNames(blocks, cardIndex),
    [blocks, cardIndex]
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
        {keyedBlocks.length === 0 ? (
          <p className="text-xs italic text-[var(--text-secondary)]/70">
            {emptyText}
          </p>
        ) : (
          keyedBlocks.map(({ key, node }) => (
            <PrimerBlockView key={key} block={node} cards={cardIndex} />
          ))
        )}
      </div>
      <UnresolvedCards names={unresolved} label={unresolvedLabel} />
    </section>
  );
}
