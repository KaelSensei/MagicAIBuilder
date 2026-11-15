/**
 * The elements of a parsed primer: a heading, a paragraph or a list, with its text runs and
 * links.
 *
 * Community context, mounted by `PublicDeckPrimer`. The tree comes from
 * `lib/community/primer-markdown`, where every link already carries `classifyUserLink`'s
 * verdict, so this file only chooses elements and attributes: a link to another site opens in a
 * new tab with {@link EXTERNAL_LINK_REL}, a site link opens in the same tab, and a refused link
 * is its label in a `span`.
 * Not responsible for: parsing, the contents bar, or the copy and download actions.
 *
 * @module profile/PrimerBlocks
 */
import type { ReactNode } from "react";
import type {
  PrimerBlock,
  PrimerInline,
} from "@/lib/community/primer-markdown";
import type { UserLink } from "@/lib/community/user-link";

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

/** The text runs and links of one line, in order. */
function PrimerInlines({
  content,
}: {
  readonly content: readonly PrimerInline[];
}): ReactNode {
  return content.map((node, index) =>
    node.kind === "text" ? (
      node.text
    ) : (
      <PrimerLink key={`link-${index}`} label={node.label} link={node.link} />
    )
  );
}

/** One block of the primer as its element: `h2`/`h3`, `ol`/`ul` with its items, or `p`. */
export function PrimerBlockView({
  block,
}: {
  readonly block: PrimerBlock;
}): ReactNode {
  switch (block.kind) {
    case "heading":
      return block.level === 3 ? (
        <h3 id={block.id} className={`${HEADING_CLASS} text-sm`}>
          <PrimerInlines content={block.content} />
        </h3>
      ) : (
        <h2 id={block.id} className={`${HEADING_CLASS} text-base`}>
          <PrimerInlines content={block.content} />
        </h2>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List
          className={`my-2 space-y-1 pl-5 text-sm text-[var(--text-secondary)] ${block.ordered ? "list-decimal" : "list-disc"}`}
        >
          {block.items.map((item, index) => (
            <li key={index}>
              <PrimerInlines content={item} />
            </li>
          ))}
        </List>
      );
    }
    case "paragraph":
      return (
        <p className="my-2 text-sm leading-6 text-[var(--text-secondary)]">
          <PrimerInlines content={block.content} />
        </p>
      );
    default: {
      const unhandled: never = block;
      return unhandled;
    }
  }
}
