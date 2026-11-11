/**
 * Decides where a link written by a user may lead: a page of this site, another http(s) site,
 * or nowhere.
 *
 * Community context. Deck primers are written by a deck's owner and read by every visitor, so
 * each destination is an untrusted URL bound for an `href`. The decision comes from the WHATWG
 * URL parser, the same one browsers use, never from patterns on the raw text: the raw text is
 * where `//host`, `HTTPS:` and `/\host` slipped past earlier checks.
 * Not responsible for: finding links in Markdown, or the `target` and `rel` a renderer adds.
 *
 * @module community/user-link
 */

/** Where a user-written link may lead, with the canonical `href` to render. */
export type UserLink =
  | {
      /** This site; `href` is a root-relative path, or a `#fragment` of the current page. */
      readonly kind: "same-site";
      readonly href: string;
    }
  | {
      /** Another site; `href` is an absolute http(s) URL. */
      readonly kind: "external";
      readonly href: string;
    }
  | {
      /** Not a link: render the label as plain text. */
      readonly kind: "refused";
    };

const REFUSED: UserLink = { kind: "refused" };

/**
 * The only schemes a user link may use. OWASP's rule for an untrusted URL in an `href` is
 * "Allow-list http and HTTPS URLs only", which refuses `javascript:`, `data:`, `vbscript:`,
 * `mailto:` and the rest. The parser lower-cases the scheme and drops leading spaces, control
 * characters and embedded tabs or newlines first, so `  JaVa\tScRiPt:` is refused too.
 * Source: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
 * (read 2026-11-11).
 */
const LINKABLE_PROTOCOLS: ReadonlySet<string> = new Set(["http:", "https:"]);

/**
 * A page no real request can reach (`.invalid` is reserved by RFC 6761 §6.4). Destinations are
 * resolved against it: a result on its origin did not name a host, so it stays on this site, and
 * a result still inside its folder was relative to the page the link is written on.
 */
const PROBE_FOLDER = "/__user-link-probe__/";
const PROBE_PAGE = new URL(`https://user-link.invalid${PROBE_FOLDER}page`);

/**
 * Classifies a link destination a user wrote and gives the `href` to render for it.
 *
 * The destination is resolved the way a browser resolves it, then:
 * - a URL that names a host over http or https, in any letter case or protocol-relative
 *   (`//host`, `/\host`), is `external`;
 * - a root-relative path, or a fragment of the page it is written on, is `same-site`;
 * - any other scheme, text the parser rejects, a page-relative reference (`decks/42`,
 *   `?tab=x`, an empty destination) and a path that collapses to `//host` are `refused`.
 *
 * Render the returned `href`, never the raw text. It is the URL the decision was made on, so
 * the browser cannot read the raw text differently (`https:decks` is a relative path on an
 * https page but another host on an http one).
 *
 * @param destination - the destination exactly as written. HTML entities are not decoded,
 *   so `javascript&colon;alert(1)` is a page-relative path and is refused.
 * @returns the classification; never throws
 */
export function classifyUserLink(destination: string): UserLink {
  const resolved = resolveAgainstProbe(destination);
  if (resolved === null || !LINKABLE_PROTOCOLS.has(resolved.protocol)) {
    return REFUSED;
  }
  if (resolved.origin !== PROBE_PAGE.origin) {
    return { kind: "external", href: resolved.href };
  }
  return sameSiteLink(resolved);
}

function sameSiteLink(resolved: URL): UserLink {
  if (resolved.pathname === PROBE_PAGE.pathname) return inPageAnchor(resolved);
  // `decks/42` or `https:decks` lands somewhere different on every page that shows it.
  if (resolved.pathname.startsWith(PROBE_FOLDER)) return REFUSED;
  // `/.//evil.example` resolves to the path `//evil.example`, which a browser reads as a host.
  if (resolved.pathname.startsWith("//")) return REFUSED;
  return {
    kind: "same-site",
    href: `${resolved.pathname}${resolved.search}${resolved.hash}`,
  };
}

/**
 * A destination that stayed on the probe page named the page it is written on. Only a non-empty
 * fragment is kept, as an in-page anchor; an empty destination or a bare `?query` would reload
 * the page instead.
 */
function inPageAnchor(resolved: URL): UserLink {
  if (resolved.search !== "" || resolved.hash === "") return REFUSED;
  return { kind: "same-site", href: resolved.hash };
}

function resolveAgainstProbe(destination: string): URL | null {
  try {
    return new URL(destination, PROBE_PAGE);
  } catch {
    return null;
  }
}
