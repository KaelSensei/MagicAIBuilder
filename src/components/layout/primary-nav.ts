/**
 * The header's primary navigation: which destination the player is on, and
 * how the link to it is marked.
 *
 * Shell (`components/layout`), shared by `Header` and `HeaderMobileMenu` so
 * both bars mark the same link. Pure: each bar reads the pathname and passes
 * it in, so the mark is in the server HTML and needs no client effect.
 * Design audit S9 (2026-11-25); WCAG 2.2 SC 1.4.1 (use of colour) and 1.4.11
 * (non-text contrast).
 *
 * @module layout/primary-nav
 */

/** A primary navigation link, named after the section it opens. */
export type NavDestination = "decks" | "collection" | "rules";

interface NavSection {
  readonly destination: NavDestination;
  /** The locale-free path every page of the section starts with. */
  readonly path: string;
}

/**
 * The section each link stands for. A link may open one page of a wider
 * section: Rules opens `/rules/game-changers`, and `/rules/comprehensive` is
 * Rules too.
 */
const NAV_SECTIONS: readonly NavSection[] = [
  { destination: "decks", path: "/decks" },
  { destination: "collection", path: "/collection" },
  { destination: "rules", path: "/rules" },
];

/**
 * Finds the primary destination a page belongs to.
 *
 * The rule follows the URL only, never where the player came from:
 * - a page is in a section when its path is the section's path or sits under
 *   it, segment by segment (`/decks/abc` is My Decks; `/decks-archive` is not);
 * - a trailing slash is ignored (`/decks/` is `/decks`);
 * - the home page `/` belongs to no section: no navigation link points to it;
 * - the builder (`/builder/<id>`) belongs to no section. It opens from My
 *   Decks but also from New Deck, a shared deck or a guest's deck, and its
 *   path is not under `/decks`, so marking My Decks there would guess.
 *
 * The sections never overlap, so at most one destination is current.
 *
 * @param pathname - the locale-free pathname from `usePathname` of
 *   `@/i18n/navigation` (`/decks`, never `/fr/decks`). It is `null` outside
 *   Next's app router, as in a unit test, although next-intl types it as a
 *   string (see its `useBasePathname`).
 * @returns the current destination, or `null` when no link points to the page
 */
export function currentNavDestination(
  pathname: string | null
): NavDestination | null {
  if (pathname === null) return null;

  const path = withoutTrailingSlash(pathname);
  const section = NAV_SECTIONS.find(
    ({ path: sectionPath }) =>
      path === sectionPath || path.startsWith(`${sectionPath}/`)
  );
  return section?.destination ?? null;
}

/** `/decks/` as `/decks`; the root `/` stays itself. */
function withoutTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

/**
 * How the current link stands out, in both bars. Every class applies only
 * while the link carries `aria-current="page"`, so the mark and the
 * screen-reader announcement cannot disagree.
 *
 * The 2 px `--accent-text` underline is the mark that does not rely on colour
 * (WCAG 2.2 SC 1.4.1), and it survives forced-colours mode, which drops the
 * background. It sits inside the link's `--surface-hover` fill: 7.18:1 there
 * in the dark theme and 4.86:1 in the light one, and at least 8.39:1 and
 * 5.62:1 on the header bar itself, above the 3:1 of SC 1.4.11. The label's
 * `--text-primary` reads 12.10:1 and 14.96:1 on the fill. Measured with
 * `contrastRatio` in `src/styles/contrast.test.ts`.
 */
export const CURRENT_PAGE_LINK_CLASS =
  "aria-[current=page]:bg-[var(--surface-hover)] aria-[current=page]:hover:bg-[var(--accent-soft)] aria-[current=page]:text-[var(--text-primary)] aria-[current=page]:underline aria-[current=page]:decoration-[var(--accent-text)] aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-4";

/**
 * The `aria-current` value of one navigation link: `page` on the current
 * destination's link, so a screen reader says "current page", and absent on
 * every other link.
 *
 * @param current - the destination `currentNavDestination` found, or `null`
 * @param destination - the destination the link opens
 * @returns `"page"`, or `undefined` to leave the attribute out
 */
export function ariaCurrentPage(
  current: NavDestination | null,
  destination: NavDestination
): "page" | undefined {
  return current === destination ? "page" : undefined;
}
