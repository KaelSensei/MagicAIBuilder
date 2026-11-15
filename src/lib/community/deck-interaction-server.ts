/**
 * The vote and rating use cases wired over the shared Prisma client: what
 * the `/api/community/decks/[id]/vote` and `.../ratings` routes import.
 *
 * Community context, deck interactions. The composition root of
 * `deck-vote-use-cases.ts` and `deck-rating-use-cases.ts` until COM-18 moves
 * the context to `src/modules/community/` and this becomes its `server.ts`
 * (ADR 0002). `server-only`: a client import of it fails the build.
 *
 * @module community/deck-interaction-server
 */
import "server-only";

import { prisma } from "@/lib/db/prisma";
import type { RatingUseCasePorts } from "@/lib/community/deck-rating-use-cases";
import type { VoteUseCasePorts } from "@/lib/community/deck-vote-use-cases";
import { prismaRatingStore } from "@/lib/community/prisma-rating-store";
import { prismaVoteStore } from "@/lib/community/prisma-vote-store";
import { prismaDeckVisibilityReader } from "@/lib/community/visible-deck";

/** The vote use cases' ports over the shared client; one instance per server process. */
export const voteUseCasePorts: VoteUseCasePorts = {
  decks: prismaDeckVisibilityReader,
  votes: prismaVoteStore(prisma),
};

/** The rating use cases' ports over the shared client; one instance per server process. */
export const ratingUseCasePorts: RatingUseCasePorts = {
  decks: prismaDeckVisibilityReader,
  ratings: prismaRatingStore(prisma),
};
