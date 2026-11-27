/**
 * Every toast the deck store raises by key has a message in each locale's
 * catalog, and that message formats with the values the store passes (card
 * names, counts). The parity test (`i18n/catalog.test.ts`) compares each
 * locale's key paths with English only: a key missing from English too, or a
 * placeholder the store does not fill, would show the player a raw key path or
 * an error instead of a sentence (I-04).
 *
 * Reads all ten catalogs from disk, the dormant ones included.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createTranslator,
  type AbstractIntlMessages,
  type Messages,
} from "next-intl";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { LocalizedToast } from "@/hooks/useToast";
import { DECK_FAILURE_TOASTS } from "./failure-toasts";
import {
  DECK_NOTICE_TOASTS,
  commanderGameChangerToast,
  gameChangerAddedToast,
  unpairableToast,
} from "./notice-toasts";

const MESSAGES_DIR = join(process.cwd(), "src", "messages");

/** Every locale directory under `src/messages`. */
const LOCALES = readdirSync(MESSAGES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

/** Each toast the deck store raises by key, with values as the store fills them. */
const RAISED: readonly LocalizedToast[] = [
  ...Object.values(DECK_FAILURE_TOASTS),
  ...Object.values(DECK_NOTICE_TOASTS),
  gameChangerAddedToast("Cyclonic Rift", 1),
  gameChangerAddedToast("Cyclonic Rift", 2),
  gameChangerAddedToast("Cyclonic Rift", 4),
  commanderGameChangerToast("Urza, Lord High Artificer"),
  unpairableToast("Tymna the Weaver", "Kenrith, the Returned King"),
];

/** A message catalog: nested objects whose leaves are ICU message strings. */
const catalogSchema: z.ZodType<AbstractIntlMessages> = z.lazy(() =>
  z.record(z.string(), z.union([z.string(), catalogSchema]))
);

/** One locale's `deck` namespace, keyed as `src/i18n/request.ts` keys it. */
function deckCatalog(locale: string): AbstractIntlMessages {
  const deck: unknown = JSON.parse(
    readFileSync(join(MESSAGES_DIR, locale, "deck.json"), "utf8")
  );
  return { deck: catalogSchema.parse(deck) };
}

describe.each(LOCALES)("the %s catalog", (locale) => {
  it.each(RAISED.map((toast) => [toast.key, toast] as const))(
    "has %s, and it formats with the store's values",
    (_key, toast) => {
      const errors: string[] = [];
      const translate = createTranslator<Messages>({
        locale,
        messages: deckCatalog(locale),
        onError: (error) => errors.push(error.message),
      });

      const text = translate(toast.key, toast.values);

      expect(errors).toEqual([]);
      expect(text).not.toBe(toast.key);
    }
  );
});
