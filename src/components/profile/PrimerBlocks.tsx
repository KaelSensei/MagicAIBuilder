/**
 * The elements of a parsed primer: a heading, a paragraph or a list, with its text runs, links
 * and card mentions.
 *
 * Community context, mounted by `PublicDeckPrimer` and the editor's `DeckPrimerPreview`. The tree
 * comes from `lib/community/primer-markdown`, where every link already carries
 * `classifyUserLink`'s verdict, so this file only chooses elements and attributes: a link to
 * another site opens in a new tab with {@link EXTERNAL_LINK_REL}, a site link opens in the same
 * tab, and a refused link is its label in a `span`. A card mention the deck holds is a
 * `PrimerCardLink`, opened like a link to another site; any other mention is its name as text.
 * Not responsible for: parsing, resolving a mention (`lib/community/primer-card-links`), the
 * contents bar, or the copy and download actions.
 *
 * @module profile/PrimerBlocks
 */
import type { ReactNode } from "react";
import {
  keyPrimerSiblings,
  primerInlineText,
  type PrimerBlock,
  type PrimerCardMention,
  type PrimerInline,
} from "@/lib/community/primer-markdown";
import {
  resolvePrimerCard,
  type PrimerCardIndex,
} from "@/lib/community/primer-card-links";
import type { UserLink } from "@/lib/community/user-link";
import { PrimerCardLink } from "./PrimerCardLink";

const PRIMER_LINK_CLASS =
  "font-medium text-[var(--accent-text)] underline underline-offset-2";

/**
 * `rel` of an author's link to another site. `noopener` and `noreferrer` keep the new tab from
 * reaching back into this page and from learning its URL. `ugc` and `nofollow` tell search
 * engines the deck owner wrote the link and the site does not vouch for it: Google recommends
 * `ugc` for user-generated links and accepts several values together.
 * Source: https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links
 * (read 2026-11-11).
 */
const EXTERNAL_LINK_REL = "noopener noreferrer nofollow ugc";

const HEADING_CLASS =
  "mb-2 mt-5 first:mt-0 font-semibold text-[var(--text-primary)] scroll-mt-20";

/** An author's link, rendered as far as its classification allows it to lead. */
function PrimerLink({
  label,
  link,
}: {
  readonly label: string;
  readonly link: UserLink;
}): ReactNode {
  switch (link.kind) {
    case "external":
      return (
        <a
          href={link.href}
          target="_blank"
          rel={EXTERNAL_LINK_REL}
          className={PRIMER_LINK_CLASS}
        >
          {label}
        </a>
      );
    case "same-site":
      return (
        <a href={link.href} className={PRIMER_LINK_CLASS}>
          {label}
        </a>
      );
    case "refused":
      return <span>{label}</span>;
    default: {
      const unhandled: never = link;
      return unhandled;
    }
  }
}

/**
 * A card mention: a link with a preview when the deck holds the card, else its name as plain
 * text, without the brackets.
 */
function PrimerCardMentionView({
  mention,
  cards,
}: {
  readonly mention: PrimerCardMention;
  readonly cards: PrimerCardIndex;
}): ReactNode {
  const target = resolvePrimerCard(cards, mention);
  if (target === null) return mention.name;
  return (
    <PrimerCardLink
      target={target}
      linkClassName={PRIMER_LINK_CLASS}
      rel={EXTERNAL_LINK_REL}
    />
  );
}

/** One inline node as its element or text. */
function PrimerInlineView({
  node,
  cards,
}: {
  readonly node: PrimerInline;
  readonly cards: PrimerCardIndex;
}): ReactNode {
  switch (node.kind) {
    case "text":
      return node.text;
    case "link":
      return <PrimerLink label={node.label} link={node.link} />;
    case "card":
      return <PrimerCardMentionView mention={node} cards={cards} />;
    default: {
      const unhandled: never = node;
      return unhandled;
    }
  }
}

/** The text runs, links and card mentions of one line, in order. */
function PrimerInlines({
  content,
  cards,
}: {
  readonly content: readonly PrimerInline[];
  readonly cards: PrimerCardIndex;
}): ReactNode {
  return keyPrimerSiblings(content, inlineContent).map(({ key, node }) => (
    <PrimerInlineView key={key} node={node} cards={cards} />
  ));
}

/** What one inline node says, for its sibling key. */
function inlineContent(node: PrimerInline): string {
  return primerInlineText([node]);
}

/**
 * One block of the primer as its element: `h2`/`h3`, `ol`/`ul` with its items, or `p`.
 *
 * @param block - a block of the parsed primer
 * @param cards - the deck's cards, which its `[[Card Name]]` mentions resolve against
 */
export function PrimerBlockView({
  block,
  cards,
}: {
  readonly block: PrimerBlock;
  readonly cards: PrimerCardIndex;
}): ReactNode {
  switch (block.kind) {
    case "heading":
      return block.level === 3 ? (
        <h3 id={block.id} className={`${HEADING_CLASS} text-sm`}>
          <PrimerInlines content={block.content} cards={cards} />
        </h3>
      ) : (
        <h2 id={block.id} className={`${HEADING_CLASS} text-base`}>
          <PrimerInlines content={block.content} cards={cards} />
        </h2>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List
          className={`my-2 space-y-1 pl-5 text-sm text-[var(--text-secondary)] ${block.ordered ? "list-decimal" : "list-disc"}`}
        >
          {keyPrimerSiblings(block.items, primerInlineText).map(
            ({ key, node }) => (
              <li key={key}>
                <PrimerInlines content={node} cards={cards} />
              </li>
            )
          )}
        </List>
      );
    }
    case "paragraph":
      return (
        <p className="my-2 text-sm leading-6 text-[var(--text-secondary)]">
          <PrimerInlines content={block.content} cards={cards} />
        </p>
      );
    default: {
      const unhandled: never = block;
      return unhandled;
    }
  }
}
