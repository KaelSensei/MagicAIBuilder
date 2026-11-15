import { describe, expect, it } from "vitest";

import {
  canActOnDeck,
  isOwnDeck,
  type DeckActionDecision,
} from "./deck-interaction-policy";
import type { DeckVisibilityFacts } from "./deck-visibility-policy";

const OWNER = "owner-1";
const STRANGER = "voter-1";

function deck(
  isPublic: boolean,
  ownerId: string | null = OWNER,
  shareEnabled = false
): DeckVisibilityFacts {
  return { ownerId, isPublic, shareEnabled };
}

const ALLOWED: DeckActionDecision = { allowed: true };
const HIDDEN: DeckActionDecision = { allowed: false, reason: "hidden" };
const OWN_DECK: DeckActionDecision = { allowed: false, reason: "own-deck" };

describe("isOwnDeck", () => {
  it("is true for the deck's owner", () => {
    expect(isOwnDeck({ ownerId: OWNER }, OWNER)).toBe(true);
  });

  it("is false for anyone else", () => {
    expect(isOwnDeck({ ownerId: OWNER }, STRANGER)).toBe(false);
  });

  it("is false for an ownerless deck: it belongs to nobody", () => {
    expect(isOwnDeck({ ownerId: null }, STRANGER)).toBe(false);
  });
});

describe("canActOnDeck", () => {
  // Every actor × visibility × sharing combination the routes can meet,
  // exactly once. Sharing never matters: these routes are reached by id.
  it.each<{
    readonly who: string;
    readonly deck: DeckVisibilityFacts;
    readonly actor: string;
    readonly expected: DeckActionDecision;
  }>([
    {
      who: "the owner, public deck",
      deck: deck(true),
      actor: OWNER,
      expected: OWN_DECK,
    },
    {
      who: "the owner, private deck",
      deck: deck(false),
      actor: OWNER,
      expected: OWN_DECK,
    },
    {
      who: "the owner, private deck with sharing on",
      deck: deck(false, OWNER, true),
      actor: OWNER,
      expected: OWN_DECK,
    },
    {
      who: "a stranger, public deck",
      deck: deck(true),
      actor: STRANGER,
      expected: ALLOWED,
    },
    {
      who: "a stranger, public deck with sharing on",
      deck: deck(true, OWNER, true),
      actor: STRANGER,
      expected: ALLOWED,
    },
    {
      who: "a stranger, private deck: public only, answered as missing",
      deck: deck(false),
      actor: STRANGER,
      expected: HIDDEN,
    },
    {
      who: "a stranger, private deck with sharing on: a share link grants no action",
      deck: deck(false, OWNER, true),
      actor: STRANGER,
      expected: HIDDEN,
    },
    {
      who: "anyone, ownerless public deck",
      deck: deck(true, null),
      actor: STRANGER,
      expected: ALLOWED,
    },
    {
      who: "anyone, ownerless private deck",
      deck: deck(false, null),
      actor: STRANGER,
      expected: HIDDEN,
    },
  ])("$who", ({ deck: facts, actor, expected }) => {
    expect(canActOnDeck(facts, actor)).toEqual(expected);
  });
});
