/**
 * `edhrec/v1`: the EDHREC deck-check export of {@link EXPORT_DECK_V1}.
 *
 * Unverified: no person has yet recorded the date of a successful paste of
 * this content into EDHREC's deck check (I-50 requirement 1.4).
 *
 * @module deck/exports/fixtures/edhrec-v1
 */
import { EXPORT_DECK_V1, type ExportFixture } from "./export-fixture";

/** The EDHREC export contract, version 1. */
export const EDHREC_EXPORT_V1: ExportFixture = {
  version: "edhrec/v1",
  target: "edhrec",
  verifiedImport: null,
  input: EXPORT_DECK_V1,
  expected: {
    content: [
      "1 Sidar Kondo of Jamuraa",
      "1 Vial Smasher the Fierce",
      "1 Sol Ring",
      "1 Fire // Ice",
      '1 Kongming, "Sleeping Dragon"',
      "10 Plains",
    ].join("\n"),
    fileName: "lim_dul_s_vault_edhrec.txt",
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
