/**
 * `archidekt/v1`: the Archidekt export of {@link EXPORT_DECK_V1}.
 *
 * Unverified: no person has yet recorded the Archidekt version and the date
 * of a successful import of this content (I-50 requirement 1.4).
 *
 * @module deck/exports/fixtures/archidekt-v1
 */
import { EXPORT_DECK_V1, type ExportFixture } from "./export-fixture";

/** The Archidekt export contract, version 1. */
export const ARCHIDEKT_EXPORT_V1: ExportFixture = {
  version: "archidekt/v1",
  target: "archidekt",
  verifiedImport: null,
  input: EXPORT_DECK_V1,
  expected: {
    content: [
      "Commander (2)",
      "1x Sidar Kondo of Jamuraa [Commander{top}]",
      "1x Vial Smasher the Fierce [Commander{top}]",
      "",
      "Mainboard (13)",
      "1x Sol Ring [Ramp]",
      "1x Fire // Ice [Instant]",
      '1x Kongming, "Sleeping Dragon" [Creature]',
      "10x Plains [Land]",
      "",
      "Sideboard (2)",
      "2x Negate [Instant]",
      "",
      "Considering (1)",
      "1x Counterspell [Instant]",
    ].join("\n"),
    fileName: "lim_dul_s_vault_archidekt.txt",
    mimeType: "text/plain",
    notices: [
      {
        kind: "cardDropped",
        cardName: "Lurrus of the Dream-Den",
        quantity: 1,
        from: "companion",
      },
    ],
  },
};
