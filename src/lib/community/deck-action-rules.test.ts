import { describe, expect, it } from "vitest";

import {
  canReportDeck,
  canSaveDeck,
  isOwnDeck,
  type DeckActionDecision,
  type DeckActionFacts,
} from "./deck-action-rules";

const OWNER = "owner-1";
const STRANGER = "stranger-1";

const PUBLIC_DECK: DeckActionFacts = { ownerId: OWNER, isPublic: true };
const PRIVATE_DECK: DeckActionFacts = { ownerId: OWNER, isPublic: false };
const OWNERLESS_PUBLIC_DECK: DeckActionFacts = {
  ownerId: null,
  isPublic: true,
};
const OWNERLESS_PRIVATE_DECK: DeckActionFacts = {
  ownerId: null,
  isPublic: false,
};

const ALLOWED: DeckActionDecision = { allowed: true };
const HIDDEN: DeckActionDecision = { allowed: false, reason: "hidden" };
const OWN_DECK: DeckActionDecision = { allowed: false, reason: "own-deck" };

describe("isOwnDeck", () => {
  it("is true for the owner only", () => {
    expect(isOwnDeck(PUBLIC_DECK, OWNER)).toBe(true);
    expect(isOwnDeck(PUBLIC_DECK, STRANGER)).toBe(false);
  });

  it("gives an ownerless deck to nobody", () => {
    expect(isOwnDeck(OWNERLESS_PUBLIC_DECK, STRANGER)).toBe(false);
  });
});

describe("canReportDeck", () => {
  it.each([
    ["a stranger reports a public deck", PUBLIC_DECK, STRANGER, ALLOWED],
    ["the owner reports their own public deck", PUBLIC_DECK, OWNER, OWN_DECK],
    ["a stranger reports a private deck", PRIVATE_DECK, STRANGER, HIDDEN],
    ["the owner reports their own private deck", PRIVATE_DECK, OWNER, HIDDEN],
    [
      "anyone reports an ownerless public deck",
      OWNERLESS_PUBLIC_DECK,
      STRANGER,
      ALLOWED,
    ],
    [
      "anyone reports an ownerless private deck",
      OWNERLESS_PRIVATE_DECK,
      STRANGER,
      HIDDEN,
    ],
  ])("%s", (_case, deck, reporterId, expected) => {
    expect(canReportDeck(deck, reporterId)).toEqual(expected);
  });
});

describe("canSaveDeck", () => {
  it.each([
    ["a public deck may be saved", PUBLIC_DECK, ALLOWED],
    ["a private deck is hidden", PRIVATE_DECK, HIDDEN],
    ["an ownerless public deck may be saved", OWNERLESS_PUBLIC_DECK, ALLOWED],
    ["an ownerless private deck is hidden", OWNERLESS_PRIVATE_DECK, HIDDEN],
  ])("%s", (_case, deck, expected) => {
    expect(canSaveDeck(deck)).toEqual(expected);
  });

  it("currently lets the owner bookmark their own public deck (pinned; see the COM-14 follow-up)", () => {
    // The save route never compared the saver to the owner; the rule reads no actor.
    expect(canSaveDeck(PUBLIC_DECK)).toEqual(ALLOWED);
  });
});
