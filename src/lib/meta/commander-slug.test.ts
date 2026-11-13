/**
 * The commander slug as a pure function: what `commanderToSlug` makes of a
 * name and what `isCommanderSlug` accepts. Moved here from `fetch.test.ts`
 * when the fetchers moved into `src/modules/meta-insights` (MI-03): the slug
 * belongs to the community context (COM-02) and stays in `src/lib/meta`. The
 * SQL parity of the slug is `commander-slug-parity.test.ts`.
 */
import { describe, expect, it } from "vitest";
import { commanderToSlug, isCommanderSlug } from "./commander-slug";

// ─── commanderToSlug ──────────────────────────────────────────────────────────
describe("commanderToSlug", () => {
  it("converts simple name", () =>
    expect(commanderToSlug("Atraxa")).toBe("atraxa"));

  it("converts name with comma and apostrophe", () =>
    expect(commanderToSlug("Atraxa, Praetors' Voice")).toBe(
      "atraxa-praetors-voice"
    ));

  it("converts multi-word name", () =>
    expect(commanderToSlug("The Ur-Dragon")).toBe("the-ur-dragon"));

  it("handles trailing/leading spaces", () =>
    expect(commanderToSlug("  Sol Ring  ")).toBe("sol-ring"));

  it("strips quotes and punctuation", () =>
    expect(commanderToSlug("Tymna the Weaver")).toBe("tymna-the-weaver"));

  it("lowercases everything", () =>
    expect(commanderToSlug("KENRITH")).toBe("kenrith"));

  it("handles empty string", () => expect(commanderToSlug("")).toBe(""));

  it("collapses multiple spaces", () =>
    expect(commanderToSlug("A  B  C")).toBe("a-b-c"));

  it("keeps numbers", () =>
    expect(commanderToSlug("Sliver Overlord 2")).toBe("sliver-overlord-2"));

  it("strips special chars Edgar example", () =>
    expect(commanderToSlug("Edgar, Charmed Groom")).toBe(
      "edgar-charmed-groom"
    ));

  // EDHREC answered 200 with this commander's page for each slug below, and 403 for the
  // slug with the accented letter dropped
  // (https://json.edhrec.com/pages/commanders/<slug>.json, read 2026-11-11).
  it.each([
    ["Lim-Dûl the Necromancer", "lim-dul-the-necromancer"],
    ["Arna Kennerüd, Skycaptain", "arna-kennerud-skycaptain"],
    ["Ratonhnhaké꞉ton", "ratonhnhaketon"],
    ["Éowyn, Fearless Knight", "eowyn-fearless-knight"],
    ["Márton Stromgald", "marton-stromgald"],
    ["Glóin, Dwarf Emissary", "gloin-dwarf-emissary"],
  ])(
    "builds the slug EDHREC serves for %s, accents transliterated",
    (name, slug) => expect(commanderToSlug(name)).toBe(slug)
  );
});

// ─── isCommanderSlug ──────────────────────────────────────────────────────────
// The commander page 404s on any slug this rejects, so it must accept
// everything commanderToSlug makes from a real name.
describe("isCommanderSlug", () => {
  it("accepts every slug commanderToSlug makes from a name with a letter or digit", () => {
    const names = [
      "Atraxa, Praetors' Voice",
      "The Ur-Dragon",
      "  Sol Ring  ",
      "Sliver Overlord 2",
      "Lim-Dûl the Necromancer",
      "Esika, Queen of Myrr // The Prismatic Bridge",
    ];

    for (const name of names) {
      expect(isCommanderSlug(commanderToSlug(name))).toBe(true);
    }
  });

  it("rejects what commanderToSlug never makes", () => {
    for (const slug of ["", "-", "---", "Atraxa", "not_a_slug", "a?b", "a b"]) {
      expect(isCommanderSlug(slug)).toBe(false);
    }
  });
});
