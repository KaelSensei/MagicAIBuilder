"use client";
/**
 * A public deck's primer: the owner's Markdown description, reduced to headings, lists,
 * paragraphs and links, with a contents bar and copy and download actions.
 *
 * Community context, mounted by `PublicDeckView`. The owner writes the text and every visitor
 * reads it, so it is never parsed as HTML: `lib/community/primer-markdown` parses it into a tree
 * whose links are already classified, and `PrimerBlocks` renders that tree.
 * Not responsible for: the Markdown subset or the link policy, which live in `lib/community`.
 *
 * @module profile/PublicDeckPrimer
 */
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Check, Copy, Download } from "lucide-react";
import {
  parsePrimer,
  primerHeadings,
  type PrimerHeading,
} from "@/lib/community/primer-markdown";
import { PrimerBlockView } from "./PrimerBlocks";

interface PrimerLabels {
  readonly contents: string;
  readonly copy: string;
  readonly copied: string;
  readonly download: string;
}

interface PublicDeckPrimerProps {
  readonly description: string;
  readonly labels?: PrimerLabels;
}

const DEFAULT_LABELS: PrimerLabels = {
  contents: "Primer contents",
  copy: "Copy primer",
  copied: "Primer copied",
  download: "Download primer",
};

const ACTION_CLASS =
  "rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]";

/**
 * The contents bar: one anchor per heading, labelled with the heading as written. Shown only
 * when there is something to navigate between, so a one-heading primer gets an empty slot that
 * keeps the actions on the right.
 */
function PrimerContents({
  headings,
  label,
}: {
  readonly headings: readonly PrimerHeading[];
  readonly label: string;
}): ReactNode {
  if (headings.length <= 1) return <span />;
  return (
    <nav aria-label={label} className="flex flex-wrap gap-x-3 gap-y-1">
      {headings.map((heading) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent-text)]"
        >
          {heading.text}
        </a>
      ))}
    </nav>
  );
}

/** Copy the original Markdown to the clipboard, or download it as `deck-primer.md`. */
function PrimerActions({
  description,
  labels,
}: {
  readonly description: string;
  readonly labels: PrimerLabels;
}): ReactNode {
  const [copied, setCopied] = useState(false);
  const downloadHref = useMemo(
    () => `data:text/markdown;charset=utf-8,${encodeURIComponent(description)}`,
    [description]
  );
  const copyPrimer = useCallback(async () => {
    await navigator.clipboard.writeText(description);
    setCopied(true);
  }, [description]);

  return (
    <div className="ml-auto flex items-center gap-2">
      <button
        type="button"
        onClick={() => void copyPrimer()}
        aria-label={copied ? labels.copied : labels.copy}
        className={ACTION_CLASS}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
      <a
        href={downloadHref}
        download="deck-primer.md"
        aria-label={labels.download}
        className={ACTION_CLASS}
      >
        <Download className="h-4 w-4" />
      </a>
    </div>
  );
}

/** Render a public deck primer with a safe, focused Markdown subset. */
export function PublicDeckPrimer({
  description,
  labels = DEFAULT_LABELS,
}: PublicDeckPrimerProps) {
  const blocks = useMemo(() => parsePrimer(description), [description]);
  const headings = useMemo(() => primerHeadings(blocks), [blocks]);

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-4 py-4 sm:px-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
        <PrimerContents headings={headings} label={labels.contents} />
        <PrimerActions description={description} labels={labels} />
      </div>
      {blocks.map((block, index) => (
        <PrimerBlockView key={`${block.kind}-${index}`} block={block} />
      ))}
    </section>
  );
}
