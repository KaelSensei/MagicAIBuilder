"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Check, Copy, Download } from "lucide-react";

interface PublicDeckPrimerProps {
  readonly description: string;
  readonly labels?: {
    readonly contents: string;
    readonly copy: string;
    readonly copied: string;
    readonly download: string;
  };
}

type PrimerBlock =
  | { readonly kind: "heading"; readonly level: number; readonly text: string }
  | { readonly kind: "paragraph"; readonly text: string }
  | {
      readonly kind: "list";
      readonly ordered: boolean;
      readonly items: readonly string[];
    };

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);
const LINK_PATTERN = /\[([^\]]+)]\(([^)\s]+)\)/g;

function headingId(text: string): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `primer-${slug || "section"}`;
}

function safePrimerUrl(url: string): string | null {
  if (url.startsWith("/") || url.startsWith("#")) return url;
  try {
    return SAFE_PROTOCOLS.has(new URL(url).protocol) ? url : null;
  } catch {
    return null;
  }
}

function parsePrimer(description: string): readonly PrimerBlock[] {
  const blocks: PrimerBlock[] = [];
  const lines = description.split("\n");
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let ordered = false;

  const flushParagraph = () => {
    if (paragraph.length > 0)
      blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  };
  const flushList = () => {
    if (listItems.length > 0)
      blocks.push({ kind: "list", ordered, items: listItems });
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const listItem = /^(?:([-*])|(\d+)\.)\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        kind: "heading",
        level: heading[1].length,
        text: heading[2],
      });
    } else if (listItem) {
      flushParagraph();
      const nextOrdered = listItem[2] !== undefined;
      if (listItems.length > 0 && ordered !== nextOrdered) flushList();
      ordered = nextOrdered;
      listItems.push(listItem[3]);
    } else if (line === "") {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

function renderInline(text: string): readonly ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(LINK_PATTERN)) {
    const index = match.index;
    if (index > cursor) nodes.push(text.slice(cursor, index));
    const href = safePrimerUrl(match[2]);
    const label = match[1];
    nodes.push(
      href ? (
        <a
          key={`${index}-${href}`}
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noreferrer noopener" : undefined}
          className="font-medium text-[var(--accent-text)] underline underline-offset-2"
        >
          {label}
        </a>
      ) : (
        <span key={`${index}-unsafe`}>{label}</span>
      )
    );
    cursor = index + match[0].length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

/** Render a public deck primer with a safe, focused Markdown subset. */
export function PublicDeckPrimer({
  description,
  labels = {
    contents: "Primer contents",
    copy: "Copy primer",
    copied: "Primer copied",
    download: "Download primer",
  },
}: PublicDeckPrimerProps) {
  const [copied, setCopied] = useState(false);
  const blocks = useMemo(() => parsePrimer(description), [description]);
  const headings = useMemo(
    () => blocks.filter((block) => block.kind === "heading"),
    [blocks]
  );
  const downloadHref = useMemo(
    () => `data:text/markdown;charset=utf-8,${encodeURIComponent(description)}`,
    [description]
  );
  const copyPrimer = useCallback(async () => {
    await navigator.clipboard.writeText(description);
    setCopied(true);
  }, [description]);

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-4 py-4 sm:px-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
        {headings.length > 1 ? (
          <nav
            aria-label={labels.contents}
            className="flex flex-wrap gap-x-3 gap-y-1"
          >
            {headings.map((heading) => (
              <a
                key={headingId(heading.text)}
                href={`#${headingId(heading.text)}`}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent-text)]"
              >
                {heading.text}
              </a>
            ))}
          </nav>
        ) : (
          <span />
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => void copyPrimer()}
            aria-label={copied ? labels.copied : labels.copy}
            className="rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <a
            href={downloadHref}
            download="deck-primer.md"
            aria-label={labels.download}
            className="rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          >
            <Download className="h-4 w-4" />
          </a>
        </div>
      </div>
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;
        if (block.kind === "heading") {
          const className =
            "mb-2 mt-5 first:mt-0 font-semibold text-[var(--text-primary)]";
          return block.level >= 3 ? (
            <h3
              id={headingId(block.text)}
              key={key}
              className={`${className} scroll-mt-20 text-sm`}
            >
              {renderInline(block.text)}
            </h3>
          ) : (
            <h2
              id={headingId(block.text)}
              key={key}
              className={`${className} scroll-mt-20 text-base`}
            >
              {renderInline(block.text)}
            </h2>
          );
        }
        if (block.kind === "list") {
          const List = block.ordered ? "ol" : "ul";
          return (
            <List
              key={key}
              className={`my-2 space-y-1 pl-5 text-sm text-[var(--text-secondary)] ${block.ordered ? "list-decimal" : "list-disc"}`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{renderInline(item)}</li>
              ))}
            </List>
          );
        }
        return (
          <p
            key={key}
            className="my-2 text-sm leading-6 text-[var(--text-secondary)]"
          >
            {renderInline(block.text)}
          </p>
        );
      })}
    </section>
  );
}
