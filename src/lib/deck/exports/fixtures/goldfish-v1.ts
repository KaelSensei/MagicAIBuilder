/**
 * `goldfish/v1`: the MTGGoldfish export of {@link EXPORT_DECK_V1}.
 *
 * Unverified: no person has yet recorded the MTGGoldfish version and the
 * date of a successful import of this content (I-50 requirement 1.4).
 *
 * @module deck/exports/fixtures/goldfish-v1
 */
import { EXPORT_DECK_V1, type ExportFixture } from "./export-fixture";

/** The MTGGoldfish export contract, version 1. */
export const GOLDFISH_EXPORT_V1: ExportFixture = {
  version: "goldfish/v1",
  target: "goldfish",
  verifiedImport: null,
  input: EXPORT_DECK_V1,
  expected: {
    content: [
      "1 Sol Ring",
      "1 Fire // Ice",
      '1 Kongming, "Sleeping Dragon"',
      "10 Plains",
      "",
      "1 Sidar Kondo of Jamuraa",
      "1 Vial Smasher the Fierce",
    ].join("\n"),
    fileName: "lim_dul_s_vault_goldfish.txt",
    mimeType: "text/plain",
    notices: [
      {
        kind: "cardDropped",
        cardName: "Lurrus of the Dream-Den",
        quantity: 1,
        from: "companion",
      },
      {
        kind: "cardDropped",
        cardName: "Negate",
        quantity: 2,
        from: "sideboard",
      },
      {
        kind: "cardDropped",
        cardName: "Counterspell",
        quantity: 1,
        from: "maybeboard",
      },
    ],
  },
};
