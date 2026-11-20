/**
 * Resolving a primer's `[[Card Name]]` mentions against the deck's cards, and listing the names
 * that resolve to none.
 *
 * Community context, pure. A mention links to the deck row's stored printing on Scryfall; the
 * name the author typed never becomes part of the destination.
 */
import { describe, expect, it } from "vitest";
import { aDeckCard } from "@/test/builders/card";
import { parsePrimer, type PrimerCardMention } from "./primer-markdown";
import {
  primerCardIndex,
  resolvePrimerCard,
  unresolvedPrimerCardNames,
} from "./primer-card-links";

const SOL_RING_ID = "fc817e07-c1f3-469f-9cf7-0945dea7400f";
const DELVER_ID = "11bf83bb-c95b-4b4f-9a56-ce7a1816307a";

const mention = (
  name: string,
  setCode: string | null = null
): PrimerCardMention => ({ kind: "card", name, setCode });

const solRing = aDeckCard({
  id: "row-sol-ring",
  name: "Sol Ring",
  scryfallId: SOL_RING_ID,
  imageUri: "https://cards.scryfall.io/normal/front/f/c/sol-ring.jpg",
});

const delver = aDeckCard({
  id: "row-delver",
  name: "Delver of Secrets // Insectile Aberration",
  scryfallId: DELVER_ID,
  imageUri: "https://cards.scryfall.io/normal/front/1/1/delver.jpg",
});

describe("resolvePrimerCard", () => {
  const index = primerCardIndex([solRing, delver]);

  it("links a deck card to its stored printing's Scryfall page, with its image", () => {
    expect(resolvePrimerCard(index, mention("Sol Ring"))).toEqual({
      name: "Sol Ring",
      href: `https://scryfall.com/card/${SOL_RING_ID}`,
      imageUri: solRing.imageUri,
    });
  });

  it("matches the name whatever its case", () => {
    expect(resolvePrimerCard(index, mention("sOL rING"))?.name).toBe(
      "Sol Ring"
    );
  });

  it.each([
    ["its front face", "Delver of Secrets"],
    ["its full name", "Delver of Secrets // Insectile Aberration"],
  ])("matches a double-faced card by %s", (_case, name) => {
    expect(resolvePrimerCard(index, mention(name))?.href).toBe(
      `https://scryfall.com/card/${DELVER_ID}`
    );
  });

  it("does not match a double-faced card by its back face", () => {
    expect(resolvePrimerCard(index, mention("Insectile Aberration"))).toBe(
      null
    );
  });

  it("resolves [[Name|SET]] to the deck's row of that name (rows store no set code yet)", () => {
    expect(resolvePrimerCard(index, mention("Sol Ring", "C21"))?.href).toBe(
      `https://scryfall.com/card/${SOL_RING_ID}`
    );
  });

  it("resolves a name the deck does not hold to nothing", () => {
    expect(resolvePrimerCard(index, mention("Not In This Deck"))).toBe(null);
  });

  it("resolves a markup or javascript: name to nothing", () => {
    expect(
      resolvePrimerCard(index, mention('<img src=x onerror="alert(1)">'))
    ).toBe(null);
    expect(resolvePrimerCard(index, mention("javascript:alert(1)"))).toBe(null);
  });

  it("leaves out a row whose stored id is not a Scryfall id, so no link is built from it", () => {
    const tampered = primerCardIndex([
      aDeckCard({ name: "Sol Ring", scryfallId: "../../evil" }),
      aDeckCard({ name: "Arcane Signet" }),
    ]);

    expect(resolvePrimerCard(tampered, mention("Sol Ring"))).toBe(null);
    expect(resolvePrimerCard(tampered, mention("Arcane Signet"))).toBe(null);
  });

  it("keeps the first row when the deck holds the name twice", () => {
    const twice = primerCardIndex([
      solRing,
      aDeckCard({
        id: "row-2",
        name: "Sol Ring",
        scryfallId: "00000000-0000-4000-8000-000000000000",
      }),
    ]);

    expect(resolvePrimerCard(twice, mention("Sol Ring"))?.href).toBe(
      `https://scryfall.com/card/${SOL_RING_ID}`
    );
  });
});

describe("unresolvedPrimerCardNames", () => {
  it("lists each name outside the deck once, in document order, as first written", () => {
    const blocks = parsePrimer(
      "## Keep [[Unknown A]]\n\n[[Sol Ring]] and [[unknown a]].\n\n- [[Unknown B|M21]]\n- [[Delver of Secrets]]"
    );

    expect(
      unresolvedPrimerCardNames(blocks, primerCardIndex([solRing, delver]))
    ).toEqual(["Unknown A", "Unknown B"]);
  });

  it("lists nothing when every mention resolves", () => {
    expect(
      unresolvedPrimerCardNames(
        parsePrimer("Keep [[Sol Ring]]."),
        primerCardIndex([solRing])
      )
    ).toEqual([]);
  });
});
