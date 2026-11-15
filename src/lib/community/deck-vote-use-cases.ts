/**
 * Voting on a community deck: read the tally, cast or flip a vote, clear it.
 *
 * Community context, deck interactions. `/api/community/decks/[id]/vote`
 * calls these after the session and the body are checked, and maps each
 * outcome to a status; the HTTP concerns stay in the route. The use cases
 * depend on the ports in `deck-interaction-ports.ts` only, so they run in
 * Vitest with in-memory fakes and no database (ADR 0005). The rules are
 * `canActOnDeck` (`deck-interaction-policy.ts`) and `canViewDeck`
 * (`deck-visibility-policy.ts`); the arithmetic is `calculateVoteScore`
 * (`votes.ts`).
 *
 * @module community/deck-vote-use-cases
 */
import { canActOnDeck } from "@/lib/community/deck-interaction-policy";
import type {
  DeckVisibilityReader,
  VoteStore,
} from "@/lib/community/deck-interaction-ports";
import {
  canViewDeck,
  DECK_ACCESS_BY_ID,
} from "@/lib/community/deck-visibility-policy";
import {
  calculateVoteScore,
  type DeckVote,
  type VoteTally,
  type VoteValue,
} from "@/lib/community/votes";

/** The adapters the vote use cases run on; `deck-interaction-server.ts` passes the real ones. */
export interface VoteUseCasePorts {
  readonly decks: DeckVisibilityReader;
  readonly votes: VoteStore;
}

/** The tally plus the viewer's own vote, null when they have not voted or are signed out. */
export interface ViewerVoteTally extends VoteTally {
  readonly viewerVote: VoteValue | null;
}

/** A tally answered to someone who may see the deck, or a deck they may not see. */
export type VoteTallyResult =
  | { readonly kind: "ok"; readonly tally: ViewerVoteTally }
  | { readonly kind: "not-found" };

/**
 * The outcome of {@link castVote}:
 * - `ok`: the vote is stored and the tally includes it;
 * - `not-found`: no deck has this id, or the voter may not see it (a private
 *   deck answers as a missing one);
 * - `own-deck`: the voter owns the deck.
 */
export type CastVoteResult = VoteTallyResult | { readonly kind: "own-deck" };

/** Who asks for a deck's tally. */
export interface ReadVoteTallyQuery {
  readonly deckId: string;
  /** The signed-in viewer, or null when signed out. */
  readonly viewerId: string | null;
}

/** One vote to store: +1 or -1, already parsed by the route. */
export interface CastVoteCommand {
  readonly deckId: string;
  readonly voterId: string;
  readonly value: VoteValue;
}

/** The vote to clear; clearing a vote that does not exist is not an error. */
export interface ClearVoteCommand {
  readonly deckId: string;
  readonly voterId: string;
}

function tallyFor(
  votes: readonly DeckVote[],
  viewerId: string | null
): ViewerVoteTally {
  return {
    ...calculateVoteScore(votes),
    viewerVote: votes.find((vote) => vote.userId === viewerId)?.value ?? null,
  };
}

async function tallyOf(
  deckId: string,
  viewerId: string | null,
  ports: VoteUseCasePorts
): Promise<VoteTallyResult> {
  return {
    kind: "ok",
    tally: tallyFor(await ports.votes.listVotes(deckId), viewerId),
  };
}

/**
 * The tally of a deck the viewer may see, with their own vote.
 *
 * A deck the viewer may not see is not read at all: its tally is never
 * computed, so nothing about a private deck leaks through a count.
 */
export async function readVoteTally(
  { deckId, viewerId }: ReadVoteTallyQuery,
  ports: VoteUseCasePorts
): Promise<VoteTallyResult> {
  const deck = await ports.decks.readVisibility(deckId);
  if (!deck || !canViewDeck(deck, viewerId, DECK_ACCESS_BY_ID).allowed) {
    return { kind: "not-found" };
  }
  return tallyOf(deckId, viewerId, ports);
}

/**
 * Casts the voter's vote, replacing their earlier one on the deck, and
 * answers the new tally.
 *
 * The vote is stored only when `canActOnDeck` allows it: the voter must be
 * able to see the deck and must not own it. The tally is read after the
 * write, as the route did, so it includes the vote just cast.
 */
export async function castVote(
  { deckId, voterId, value }: CastVoteCommand,
  ports: VoteUseCasePorts
): Promise<CastVoteResult> {
  const deck = await ports.decks.readVisibility(deckId);
  if (!deck) return { kind: "not-found" };

  const decision = canActOnDeck(deck, voterId);
  if (!decision.allowed) {
    return { kind: decision.reason === "own-deck" ? "own-deck" : "not-found" };
  }

  await ports.votes.saveVote({ userId: voterId, deckId, value });
  return tallyOf(deckId, voterId, ports);
}

/**
 * Clears the voter's vote on a deck they may see, and answers the tally.
 *
 * Only visibility is checked, not ownership: the owner "clears" nothing and
 * gets their deck's tally, as the route answered before this use case
 * existed. Idempotent: clearing a vote that does not exist answers the
 * unchanged tally.
 */
export async function clearVote(
  { deckId, voterId }: ClearVoteCommand,
  ports: VoteUseCasePorts
): Promise<VoteTallyResult> {
  const deck = await ports.decks.readVisibility(deckId);
  if (!deck || !canViewDeck(deck, voterId, DECK_ACCESS_BY_ID).allowed) {
    return { kind: "not-found" };
  }
  await ports.votes.removeVote({ userId: voterId, deckId });
  return tallyOf(deckId, voterId, ports);
}
