import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { servedLocaleFor } from "./alternates";

/**
 * Page titles and descriptions in the language the page is served in.
 *
 * Every `generateMetadata` under `[locale]` used to write English, so a
 * crawler reading `/fr/...` found a French page with an English title and
 * description. The text now lives in the `metadata` message namespace, one
 * entry per page.
 */

/** Props Next.js passes to `generateMetadata` under the `[locale]` segment. */
export interface LocaleMetadataProps {
  readonly params: Promise<{ readonly locale: string }>;
}

/** Pages whose title and description are fixed text, keyed by namespace. */
export const FIXED_PAGE_NAMESPACES = [
  "collection",
  "rules.comprehensive",
  "rules.gameChangers",
  "settings.apiKeys",
  "settings.notifications",
  "apiChangelog",
] as const;

/** A page whose title and description do not depend on what it shows. */
export type FixedPageNamespace = (typeof FIXED_PAGE_NAMESPACES)[number];

/** A page's entry in the `metadata` message namespace. */
export type MetadataNamespace =
  FixedPageNamespace | "commanderDecks" | "deck" | "profile" | "share" | "site";

/**
 * Translator for one page's metadata messages.
 *
 * @param localeParam The `[locale]` segment as the route supplies it; one that
 *   is not served reads the default locale (see `servedLocaleFor`).
 * @param namespace The page's entry under `metadata`.
 * @returns A translator scoped to `metadata.<namespace>`.
 */
export function metadataTranslations(
  localeParam: string,
  namespace: MetadataNamespace
) {
  return getTranslations({
    locale: servedLocaleFor(localeParam),
    namespace: `metadata.${namespace}`,
  });
}

/**
 * `generateMetadata` for a page whose title and description are fixed text.
 *
 * @param namespace The page's entry under `metadata`, holding `title` and
 *   `description`.
 * @param rest Anything else the page declares, such as a robots directive.
 * @returns A `generateMetadata` for the page to export.
 */
export function fixedPageMetadata(
  namespace: FixedPageNamespace,
  rest: Omit<Metadata, "title" | "description"> = {}
): (props: LocaleMetadataProps) => Promise<Metadata> {
  return async ({ params }) => {
    const { locale } = await params;
    const t = await metadataTranslations(locale, namespace);

    return { ...rest, title: t("title"), description: t("description") };
  };
}
