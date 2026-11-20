/**
 * `moxfield/v1`: the Moxfield export of {@link EXPORT_DECK_V1}.
 *
 * Unverified: no person has yet recorded the Moxfield version and the date
 * of a successful import of this content (I-50 requirement 1.4).
 *
 * @module deck/exports/fixtures/moxfield-v1
 */
import { EXPORT_DECK_V1, type ExportFixture } from "./export-fixture";

/** The Moxfield export contract, version 1. */
export const MOXFIELD_EXPORT_V1: ExportFixture = {
  version: "moxfield/v1",
  target: "moxfield",
  verifiedImport: null,
  input: EXPORT_DECK_V1,
  expected: {
    content: [
      "// Commander",
      "1 Sidar Kondo of Jamuraa",
      "",
      "// Partner",
      "1 Vial Smasher the Fierce",
      "",
      "// Companion",
      "1 Lurrus of the Dream-Den",
      "",
      "// Deck",
      "1 Sol Ring",
      "1 Fire // Ice",
      '1 Kongming, "Sleeping Dragon"',
      "10 Plains",
      "",
      "// Sideboard",
      "2 Negate",
      "",
      "// Considering",
      "1 Counterspell",
    ].join("\n"),
    fileName: "lim_dul_s_vault_moxfield.txt",
    mimeType: "text/plain",
    notices: [],
  },
};
