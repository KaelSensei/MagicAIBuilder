import type { ReactNode } from "react";

interface PublicDeckPrimerProps {
  readonly description: string;
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
export function PublicDeckPrimer({ description }: PublicDeckPrimerProps) {
  const blocks = parsePrimer(description);
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-4 py-4 sm:px-5">
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;
        if (block.kind === "heading") {
          const className =
            "mb-2 mt-5 first:mt-0 font-semibold text-[var(--text-primary)]";
          return block.level >= 3 ? (
            <h3 key={key} className={`${className} text-sm`}>
              {renderInline(block.text)}
            </h3>
          ) : (
            <h2 key={key} className={`${className} text-base`}>
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
