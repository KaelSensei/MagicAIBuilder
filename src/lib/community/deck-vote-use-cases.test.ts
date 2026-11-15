import { describe, expect, it } from "vitest";

import {
  castVote,
  clearVote,
  readVoteTally,
  type VoteUseCasePorts,
} from "./deck-vote-use-cases";
import type { DeckVisibilityFacts } from "./deck-visibility-policy";
import {
  inMemoryDeckVisibilityReader,
  inMemoryVoteStore,
  voterKey,
} from "./testing/deck-interaction-fakes";
import type { DeckVote } from "./votes";

const OWNER = "owner-1";
const VOTER = "voter-1";
const PUBLIC_DECK: DeckVisibilityFacts = {
  ownerId: OWNER,
  isPublic: true,
  shareEnabled: false,
};
const PRIVATE_DECK: DeckVisibilityFacts = {
  ownerId: OWNER,
  isPublic: false,
  shareEnabled: false,
};

function ports(
  decks: Readonly<Record<string, DeckVisibilityFacts>>,
  votes: readonly DeckVote[] = []
): {
  readonly ports: VoteUseCasePorts;
  readonly votes: ReturnType<typeof inMemoryVoteStore>;
} {
  const store = inMemoryVoteStore(votes);
  return {
    ports: { decks: inMemoryDeckVisibilityReader(decks), votes: store },
    votes: store,
  };
}

const THREE_VOTES: readonly DeckVote[] = [
  { userId: "a", deckId: "deck-1", value: 1 },
  { userId: "b", deckId: "deck-1", value: 1 },
  { userId: VOTER, deckId: "deck-1", value: -1 },
];

describe("readVoteTally", () => {
  it("tallies a public deck for an anonymous viewer, who has no vote of their own", async () => {
    const { ports: p } = ports({ "deck-1": PUBLIC_DECK }, THREE_VOTES);

    expect(
      await readVoteTally({ deckId: "deck-1", viewerId: null }, p)
    ).toEqual({
      kind: "ok",
      tally: { score: 1, upvotes: 2, downvotes: 1, viewerVote: null },
    });
  });

  it("reports the viewer's own vote when signed in", async () => {
    const { ports: p } = ports({ "deck-1": PUBLIC_DECK }, THREE_VOTES);

    const result = await readVoteTally(
      { deckId: "deck-1", viewerId: VOTER },
      p
    );

    expect(result.kind === "ok" && result.tally.viewerVote).toBe(-1);
  });

  it("counts only the deck's own votes", async () => {
    const { ports: p } = ports({ "deck-1": PUBLIC_DECK }, [
      ...THREE_VOTES,
      { userId: "a", deckId: "deck-2", value: -1 },
    ]);

    const result = await readVoteTally({ deckId: "deck-1", viewerId: null }, p);

    expect(result.kind === "ok" && result.tally.score).toBe(1);
  });

  it("lets the owner read the tally of their private deck", async () => {
    const { ports: p } = ports({ "deck-1": PRIVATE_DECK });

    expect(
      (await readVoteTally({ deckId: "deck-1", viewerId: OWNER }, p)).kind
    ).toBe("ok");
  });

  it("answers not-found for a private deck to anyone but its owner", async () => {
    const { ports: p } = ports({ "deck-1": PRIVATE_DECK }, THREE_VOTES);

    expect(
      await readVoteTally({ deckId: "deck-1", viewerId: VOTER }, p)
    ).toEqual({
      kind: "not-found",
    });
    expect(
      await readVoteTally({ deckId: "deck-1", viewerId: null }, p)
    ).toEqual({
      kind: "not-found",
    });
  });

  it("answers not-found for a deck that does not exist", async () => {
    const { ports: p } = ports({});

    expect(
      await readVoteTally({ deckId: "deck-1", viewerId: null }, p)
    ).toEqual({
      kind: "not-found",
    });
  });
});

describe("castVote", () => {
  it("stores an upvote and answers the tally including it", async () => {
    const { ports: p, votes } = ports({ "deck-1": PUBLIC_DECK });

    const result = await castVote(
      { deckId: "deck-1", voterId: VOTER, value: 1 },
      p
    );

    expect(result).toEqual({
      kind: "ok",
      tally: { score: 1, upvotes: 1, downvotes: 0, viewerVote: 1 },
    });
    expect(
      votes.rows.get(voterKey({ userId: VOTER, deckId: "deck-1" }))
    ).toEqual({
      userId: VOTER,
      deckId: "deck-1",
      value: 1,
    });
  });

  it("flipping a vote replaces it instead of stacking a second one", async () => {
    const { ports: p, votes } = ports({ "deck-1": PUBLIC_DECK });

    await castVote({ deckId: "deck-1", voterId: VOTER, value: 1 }, p);
    const result = await castVote(
      { deckId: "deck-1", voterId: VOTER, value: -1 },
      p
    );

    expect(votes.rows.size).toBe(1);
    expect(result).toEqual({
      kind: "ok",
      tally: { score: -1, upvotes: 0, downvotes: 1, viewerVote: -1 },
    });
  });

  it("refuses the owner's vote on their own deck and stores nothing", async () => {
    const { ports: p, votes } = ports({ "deck-1": PUBLIC_DECK });

    expect(
      await castVote({ deckId: "deck-1", voterId: OWNER, value: 1 }, p)
    ).toEqual({
      kind: "own-deck",
    });
    expect(votes.rows.size).toBe(0);
  });

  it("answers not-found for a private deck the voter cannot see, and stores nothing", async () => {
    const { ports: p, votes } = ports({ "deck-1": PRIVATE_DECK });

    expect(
      await castVote({ deckId: "deck-1", voterId: VOTER, value: 1 }, p)
    ).toEqual({
      kind: "not-found",
    });
    expect(votes.rows.size).toBe(0);
  });

  it("answers not-found for a deck that does not exist", async () => {
    const { ports: p } = ports({});

    expect(
      await castVote({ deckId: "deck-1", voterId: VOTER, value: 1 }, p)
    ).toEqual({
      kind: "not-found",
    });
  });
});

describe("clearVote", () => {
  it("removes only the voter's own vote and answers the remaining tally", async () => {
    const { ports: p, votes } = ports({ "deck-1": PUBLIC_DECK }, THREE_VOTES);

    const result = await clearVote({ deckId: "deck-1", voterId: VOTER }, p);

    expect(result).toEqual({
      kind: "ok",
      tally: { score: 2, upvotes: 2, downvotes: 0, viewerVote: null },
    });
    expect(votes.rows.size).toBe(2);
  });

  it("is idempotent when the voter has no vote", async () => {
    const { ports: p } = ports({ "deck-1": PUBLIC_DECK });

    expect(await clearVote({ deckId: "deck-1", voterId: VOTER }, p)).toEqual({
      kind: "ok",
      tally: { score: 0, upvotes: 0, downvotes: 0, viewerVote: null },
    });
  });

  it("does not reveal the tally of a deck the voter cannot see", async () => {
    const { ports: p, votes } = ports({ "deck-1": PRIVATE_DECK }, THREE_VOTES);

    expect(await clearVote({ deckId: "deck-1", voterId: VOTER }, p)).toEqual({
      kind: "not-found",
    });
    expect(votes.rows.size).toBe(3);
  });

  it("currently lets the owner clear a vote on their own deck and answers its tally (pinned: the route checked visibility only)", async () => {
    const { ports: p } = ports({ "deck-1": PRIVATE_DECK }, THREE_VOTES);

    expect(
      (await clearVote({ deckId: "deck-1", voterId: OWNER }, p)).kind
    ).toBe("ok");
  });
});
