/**
 * Tables the four comment rules as the routes applied them before COM-13,
 * one row per viewer × fact combination, so a change to any rule shows up
 * as a flipped row rather than a route test somewhere else.
 */
import { describe, expect, it } from "vitest";

import {
  canDeleteComment,
  canEditComment,
  canPostOn,
  isReplyToSameDeck,
} from "./comment-policy";

const OWNER = "owner-1";
const AUTHOR = "author-1";
const STRANGER = "stranger-1";

const PUBLIC_DECK = { ownerId: OWNER, isPublic: true, shareEnabled: false };
const PRIVATE_DECK = { ownerId: OWNER, isPublic: false, shareEnabled: false };
const SHARED_PRIVATE_DECK = {
  ownerId: OWNER,
  isPublic: false,
  shareEnabled: true,
};
const OWNERLESS_PUBLIC_DECK = {
  ownerId: null,
  isPublic: true,
  shareEnabled: false,
};
const OWNERLESS_PRIVATE_DECK = {
  ownerId: null,
  isPublic: false,
  shareEnabled: false,
};

describe("canPostOn: a signed-in viewer who may see the deck may post", () => {
  it.each([
    ["the owner", PUBLIC_DECK, OWNER, true],
    ["a stranger", PUBLIC_DECK, STRANGER, true],
    ["an anonymous viewer", PUBLIC_DECK, null, false],
    ["the owner", PRIVATE_DECK, OWNER, true],
    ["a stranger", PRIVATE_DECK, STRANGER, false],
    ["an anonymous viewer", PRIVATE_DECK, null, false],
    ["a stranger, sharing on", SHARED_PRIVATE_DECK, STRANGER, false],
    ["a stranger", OWNERLESS_PUBLIC_DECK, STRANGER, true],
    ["an anonymous viewer", OWNERLESS_PUBLIC_DECK, null, false],
    ["a stranger", OWNERLESS_PRIVATE_DECK, STRANGER, false],
  ] as const)(
    "%s on a deck %o may post: %s",
    (_viewer, deck, viewerId, expected) => {
      expect(canPostOn(deck, viewerId)).toBe(expected);
    }
  );
});

describe("isReplyToSameDeck: the parent must exist on the reply's deck", () => {
  it.each([
    ["a parent on the same deck", { deckId: "deck-1" }, true],
    ["a parent on another deck", { deckId: "deck-2" }, false],
    ["no parent with that id", null, false],
  ] as const)("%s: %s", (_case, parent, expected) => {
    expect(isReplyToSameDeck(parent, "deck-1")).toBe(expected);
  });
});

describe("canEditComment: the author only", () => {
  it.each([
    ["the author", AUTHOR, true],
    ["the deck owner", OWNER, false],
    ["a stranger", STRANGER, false],
    ["an anonymous viewer", null, false],
  ] as const)("%s may edit: %s", (_viewer, viewerId, expected) => {
    expect(canEditComment({ authorId: AUTHOR }, viewerId)).toBe(expected);
  });
});

describe("canDeleteComment: the author or the deck owner", () => {
  it.each([
    ["the author", { ownerId: OWNER }, AUTHOR, true],
    ["the deck owner", { ownerId: OWNER }, OWNER, true],
    ["a stranger", { ownerId: OWNER }, STRANGER, false],
    ["an anonymous viewer", { ownerId: OWNER }, null, false],
    ["the author, ownerless deck", { ownerId: null }, AUTHOR, true],
    ["a stranger, ownerless deck", { ownerId: null }, STRANGER, false],
    ["an anonymous viewer, ownerless deck", { ownerId: null }, null, false],
  ] as const)("%s may delete: %s", (_viewer, deck, viewerId, expected) => {
    expect(canDeleteComment({ authorId: AUTHOR }, deck, viewerId)).toBe(
      expected
    );
  });
});
