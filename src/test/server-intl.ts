import { createTranslator, type AbstractIntlMessages } from "next-intl";
import enMetadata from "@/messages/en/metadata.json";
import frMetadata from "@/messages/fr/metadata.json";

/**
 * A stand-in for `next-intl/server`, for tests of `generateMetadata`.
 *
 * Outside a React Server Component, next-intl resolves `next-intl/server` to a
 * build whose every function throws "not supported in Client Components". A
 * test of `generateMetadata` replaces the module with this one:
 *
 * ```ts
 * vi.mock("next-intl/server", () => import("@/test/server-intl"));
 * ```
 *
 * `getTranslations` reads the real catalogs, so a test breaks when a key is
 * removed or renamed, and asserts the text a crawler would read.
 */

/** The served locales' catalogs, as `src/i18n/request.ts` assembles them. */
const CATALOGS: ReadonlyMap<string, AbstractIntlMessages> = new Map([
  ["en", { metadata: enMetadata }],
  ["fr", { metadata: frMetadata }],
]);

/** The explicit-locale form of `getTranslations`, the one metadata uses. */
interface GetTranslationsOptions {
  readonly locale: string;
  readonly namespace?: string;
}

/**
 * Translator for one locale and namespace, read from the real catalogs.
 *
 * @param options The locale the page is served in and the namespace to read.
 * @returns The same translator `next-intl/server` returns on the server.
 * @throws When the locale has no catalog here, so a test cannot pass by
 *   silently reading another locale.
 */
export async function getTranslations({
  locale,
  namespace,
}: GetTranslationsOptions) {
  const messages = CATALOGS.get(locale);
  if (messages === undefined) {
    throw new Error(`No test catalog for locale "${locale}"`);
  }

  return createTranslator({ locale, messages, namespace });
}
