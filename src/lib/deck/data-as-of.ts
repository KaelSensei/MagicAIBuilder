/**
 * The data-as-of line on a deck (I-86).
 *
 * One line says the rules file's effective date, that prices are the USD
 * amount stored with each card, and that card data is not loaded from the
 * daily file until a load date exists. A missing date is absent. Nothing
 * here fetches Scryfall, EDHREC or a price, and nothing turns a missing
 * price into zero.
 *
 * @module deck/data-as-of
 */
import { BUNDLED_RULES_EFFECTIVE_ON } from "@/modules/rules-reference";

/** Dates the line may show. Null means the product did not store one. */
export interface DataAsOfFacts {
  readonly rulesEffectiveOn: string | null;
  readonly priceStoredOn: string | null;
  readonly cardDataLoadedOn: string | null;
}

/** The three sentences, as data. The view turns them into catalogue strings. */
export interface DataAsOfLine {
  readonly rules: { readonly kind: "dated"; readonly isoDate: string } | { readonly kind: "absent" };
  readonly prices:
    | { readonly kind: "stored-with-card" }
    | { readonly kind: "dated"; readonly isoDate: string };
  readonly cardData:
    | { readonly kind: "not-from-daily-file" }
    | { readonly kind: "loaded"; readonly isoDate: string };
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A real `YYYY-MM-DD` date, or null.
 *
 * An impossible day such as February 31 is null. The line then omits the
 * date instead of letting `Date` roll it into March.
 *
 * @param value - A stored date, or null when nothing was stored.
 * @returns The same string when it is a real calendar day, otherwise null.
 */
function realIsoDate(value: string | null): string | null {
  if (value === null) return null;
  const match = ISO_DATE.exec(value);
  if (match === null) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  const sameDay =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return sameDay ? value : null;
}

/**
 * The three facts the data-as-of line is allowed to say.
 *
 * A null or impossible price date stays "stored with each card", not a
 * guessed day and not zero. A null card-data date stays "not loaded from
 * the daily file". When I-67 or I-59 pass a real date, that date replaces
 * the placeholder.
 *
 * @param facts - Dates already stored. This function does not look anything up.
 * @returns The three parts of the line.
 */
export function describeDataAsOf(facts: DataAsOfFacts): DataAsOfLine {
  const rules = realIsoDate(facts.rulesEffectiveOn);
  const prices = realIsoDate(facts.priceStoredOn);
  const cardData = realIsoDate(facts.cardDataLoadedOn);
  return {
    rules: rules === null ? { kind: "absent" } : { kind: "dated", isoDate: rules },
    prices: prices === null ? { kind: "stored-with-card" } : { kind: "dated", isoDate: prices },
    cardData: cardData === null ? { kind: "not-from-daily-file" } : { kind: "loaded", isoDate: cardData },
  };
}

/**
 * The facts the product can show today.
 *
 * The rules date is the bundled edition. No price date and no daily-file
 * load are stored, so those two stay placeholders.
 *
 * @returns Facts for the builder and the public deck. No I/O.
 */
export function currentDataAsOfFacts(): DataAsOfFacts {
  return {
    rulesEffectiveOn: BUNDLED_RULES_EFFECTIVE_ON,
    priceStoredOn: null,
    cardDataLoadedOn: null,
  };
}
