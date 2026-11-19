/**
 * `plaintext/v1`: the plain-text export of {@link EXPORT_DECK_V1}.
 *
 * Unverified as a client import: plain text has no external client; the
 * app's own importer reads it (`parseTextDecklist`).
 *
 * @module deck/exports/fixtures/plaintext-v1
 */
import { EXPORT_DECK_V1, type ExportFixture } from "./export-fixture";

/** The plain-text export contract, version 1. */
export const PLAINTEXT_EXPORT_V1: ExportFixture = {
  version: "plaintext/v1",
  target: "plaintext",
  verifiedImport: null,
  input: EXPORT_DECK_V1,
  expected: {
    content: [
      "Commander",
      "1 Sidar Kondo of Jamuraa",
      "",
      "Partner",
      "1 Vial Smasher the Fierce",
      "",
      "Companion",
      "1 Lurrus of the Dream-Den",
      "",
      "Deck",
      "1 Sol Ring",
      "// Note: Turn-one play",
      "// Note: Keep it",
      "1 Fire // Ice",
      '1 Kongming, "Sleeping Dragon"',
      "10 Plains",
      "",
      "Sideboard",
      "2 Negate",
      "",
      "Considering",
      "1 Counterspell",
    ].join("\n"),
    fileName: "lim_dul_s_vault_plaintext.txt",
    mimeType: "text/plain",
    notices: [],
  },
};
