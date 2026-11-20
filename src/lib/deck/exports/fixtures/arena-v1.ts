/**
 * `arena/v1`: the MTG Arena export of {@link EXPORT_DECK_V1}.
 *
 * Unverified: no person has yet recorded the MTG Arena client version and
 * the date of a successful import of this content (I-50 requirement 1.4).
 *
 * @module deck/exports/fixtures/arena-v1
 */
import { EXPORT_DECK_V1, type ExportFixture } from "./export-fixture";

/** The MTG Arena export contract, version 1. */
export const ARENA_EXPORT_V1: ExportFixture = {
  version: "arena/v1",
  target: "arena",
  verifiedImport: null,
  input: EXPORT_DECK_V1,
  expected: {
    content: [
      "Companion",
      "1 Lurrus of the Dream-Den",
      "",
      "Commander",
      "1 Sidar Kondo of Jamuraa",
      "1 Vial Smasher the Fierce",
      "",
      "Deck",
      "1 Sol Ring",
      "1 Fire // Ice",
      '1 Kongming, "Sleeping Dragon"',
      "10 Plains",
      "",
      "Sideboard",
      "2 Negate",
      "1 Lurrus of the Dream-Den",
    ].join("\n"),
    fileName: "lim_dul_s_vault_arena.txt",
    mimeType: "text/plain",
    notices: [
      {
        kind: "cardDropped",
        cardName: "Counterspell",
        quantity: 1,
        from: "maybeboard",
      },
    ],
  },
};
