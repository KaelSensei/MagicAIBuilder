/**
 * `tappedout/v1`: the TappedOut export of {@link EXPORT_DECK_V1}.
 *
 * Unverified: no person has yet recorded the TappedOut version and the date
 * of a successful import of this content (I-50 requirement 1.4). No source
 * confirms a sideboard or Considering syntax for TappedOut's paste box
 * (searched 2026-11-19), so those cards and the companion are left out with
 * a notice.
 *
 * @module deck/exports/fixtures/tappedout-v1
 */
import { EXPORT_DECK_V1, type ExportFixture } from "./export-fixture";

/** The TappedOut export contract, version 1. */
export const TAPPEDOUT_EXPORT_V1: ExportFixture = {
  version: "tappedout/v1",
  target: "tappedout",
  verifiedImport: null,
  input: EXPORT_DECK_V1,
  expected: {
    content: [
      "1x Sidar Kondo of Jamuraa *CMDR*",
      "1x Vial Smasher the Fierce *CMDR*",
      "1x Sol Ring",
      "1x Fire // Ice",
      '1x Kongming, "Sleeping Dragon"',
      "10x Plains",
    ].join("\n"),
    fileName: "lim_dul_s_vault_tappedout.txt",
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
