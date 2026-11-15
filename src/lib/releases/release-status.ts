/**
 * Whether a card is a preview, upcoming or released: the one release status every surface reads
 * (I-73 requirement 3.1).
 *
 * Release coordination, pure. During preview season Scryfall lists a new card with its set's
 * future `released_at` and marks it `not_legal` until a few days before release
 * (https://scryfall.com/docs/api/cards, read 2026-11-15). Today the app shows such a card as "not
 * legal", with no date. This status lets the wording say "Preview: legal in Commander from
 * <date>" instead (I-73 slice 2). The legality verdict stays Scryfall's (3.2); the status only
 * changes the words.
 *
 * Not responsible for: the wording, the legality verdict (I-67, I-48), the release calendar
 * (`SetRelease`, I-73 slice 3).
 *
 * @module releases/release-status
 */
import type { ScryfallCard } from "@/lib/scryfall/types";
import { releaseDayOf } from "./release-day";

/**
 * Where a card stands against its release.
 *
 * - `preview`: released after today, and Scryfall does not yet mark it legal in Commander.
 * - `upcoming`: released after today, and Scryfall already marks it legal.
 * - `released`: out, or a reprint of a card that already is.
 *
 * `releasesOn` is the set's release day, "YYYY-MM-DD".
 */
export type ReleaseStatus =
  | { readonly kind: "preview"; readonly releasesOn: string }
  | { readonly kind: "upcoming"; readonly releasesOn: string }
  | { readonly kind: "released" };

/**
 * The card fields `releaseStatus` reads. Structural, so any printing Scryfall sent fits.
 */
export type ReleaseDatedCard = Pick<ScryfallCard, "released_at" | "reprint" | "legalities">;

/**
 * The release status of a card on a given day.
 *
 * The status describes the card's earliest printing: a reprint (`reprint: true`) already exists,
 * so it is `released` even when its new set comes out later. A card with no `released_at`, as
 * in card JSON cached before the field was read, is `released`, which keeps today's wording. A
 * card released today is `released`.
 *
 * @param card - a printing as Scryfall sent it
 * @param today - now; read as its UTC calendar day (`releaseDayOf`)
 * @returns the status, with the release day when the card is not out yet
 */
export function releaseStatus(card: ReleaseDatedCard, today: Date): ReleaseStatus {
  const releasesOn = card.released_at;
  if (card.reprint === true || releasesOn === undefined || releasesOn <= releaseDayOf(today)) {
    return { kind: "released" };
  }
  return card.legalities?.commander === "legal"
    ? { kind: "upcoming", releasesOn }
    : { kind: "preview", releasesOn };
}
