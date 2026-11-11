/**
 * A typed stand-in for `@/i18n/navigation`, for component tests that render
 * links or read the router without next-intl's provider or Next's app router.
 *
 * Why: the typed mock form checks a factory against the real module
 * (ADR 0005, rule 5). next-intl's `Link` is a `forwardRef` component with
 * next/link's props, so the per-file arrow functions these tests used before
 * no longer type-check. This module gives one typed version of them:
 *
 * ```ts
 * vi.mock(import("@/i18n/navigation"), () => import("@/test/i18n-navigation-stub"));
 * ```
 *
 * A test that needs another pathname spreads the module and overrides
 * `usePathname`. `vi.mock` factories are hoisted above the file's imports, so
 * the module is imported inside the factory.
 */
import { forwardRef, type ComponentProps } from "react";
import { vi } from "vitest";
import type {
  Link as LocalizedLink,
  useRouter as useLocalizedRouter,
} from "@/i18n/navigation";

type LinkProps = ComponentProps<typeof LocalizedLink>;

/** The href an anchor shows: an object href (`{ pathname, query }`) shows its pathname. */
function hrefText(href: LinkProps["href"]): string {
  return typeof href === "string" ? href : (href.pathname ?? "");
}

/**
 * A plain `<a>` with the given href, without the locale prefix. The
 * navigation-only props of next/link (`prefetch`, `replace`, `scroll`, …) are
 * dropped so React does not warn about unknown DOM attributes; every other
 * prop, `className` and `onClick` included, reaches the anchor.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  {
    href,
    as,
    locale,
    prefetch,
    replace,
    scroll,
    shallow,
    passHref,
    legacyBehavior,
    onNavigate,
    transitionTypes,
    ...anchor
  },
  ref
) {
  return <a ref={ref} href={hrefText(href)} {...anchor} />;
});

/**
 * A router whose every method is a fresh `vi.fn()`; nothing navigates.
 * `bfcacheId` is part of the router type next-intl declares; no component
 * reads it.
 */
export function useRouter(): ReturnType<typeof useLocalizedRouter> {
  return {
    bfcacheId: "test",
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  };
}

/** The current pathname without the locale prefix: the home page. */
export function usePathname(): string {
  return "/";
}
