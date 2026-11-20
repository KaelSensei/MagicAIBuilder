/**
 * The `<target>/v1` export fixtures (I-50 requirement 1.4): each target's
 * result for the `v1` deck matches its fixture byte for byte, and the same
 * deck always gives the same result (1.5).
 */
import { describe, expect, it } from "vitest";
import { EXPORT_TARGETS, exportDeck } from "@/lib/deck/export";
import type { ExportFixture } from "./exports/fixtures/export-fixture";
import { ARCHIDEKT_EXPORT_V1 } from "./exports/fixtures/archidekt-v1";
import { ARENA_EXPORT_V1 } from "./exports/fixtures/arena-v1";
import { EDHREC_EXPORT_V1 } from "./exports/fixtures/edhrec-v1";
import { GOLDFISH_EXPORT_V1 } from "./exports/fixtures/goldfish-v1";
import { MOXFIELD_EXPORT_V1 } from "./exports/fixtures/moxfield-v1";
import { MTGO_EXPORT_V1 } from "./exports/fixtures/mtgo-v1";
import { PLAINTEXT_EXPORT_V1 } from "./exports/fixtures/plaintext-v1";
import { TAPPEDOUT_EXPORT_V1 } from "./exports/fixtures/tappedout-v1";

const FIXTURES: readonly ExportFixture[] = [
  MOXFIELD_EXPORT_V1,
  ARENA_EXPORT_V1,
  MTGO_EXPORT_V1,
  TAPPEDOUT_EXPORT_V1,
  ARCHIDEKT_EXPORT_V1,
  GOLDFISH_EXPORT_V1,
  EDHREC_EXPORT_V1,
  PLAINTEXT_EXPORT_V1,
];

describe("export fixtures, version 1", () => {
  it("cover every shipped target once", () => {
    expect(FIXTURES.map((fixture) => fixture.target)).toEqual([
      ...EXPORT_TARGETS,
    ]);
  });

  it.each(FIXTURES)("$version matches its content byte for byte", (fixture) => {
    expect(exportDeck(fixture.input, fixture.target).content).toBe(
      fixture.expected.content
    );
  });

  it.each(FIXTURES)(
    "$version matches its file name, MIME type and notices",
    (fixture) => {
      expect(exportDeck(fixture.input, fixture.target)).toEqual(
        fixture.expected
      );
    }
  );

  it.each(FIXTURES)(
    "$version gives the same result on every run",
    (fixture) => {
      expect(exportDeck(fixture.input, fixture.target)).toEqual(
        exportDeck(fixture.input, fixture.target)
      );
    }
  );
});
