/**
 * The follow use cases wired over the shared Prisma client: what
 * `/api/community/users/[username]/follow` imports.
 *
 * Community context, follows. The composition root of `follow-use-cases.ts`
 * until COM-18 moves the context to `src/modules/community/` and this becomes
 * part of its `server.ts` (ADR 0002). `server-only`: a client import of it
 * fails the build.
 *
 * @module social/follow-server
 */
import "server-only";

import { prisma } from "@/lib/db/prisma";
import type { FollowUseCasePorts } from "@/lib/social/follow-use-cases";
import {
  prismaFollowStore,
  prismaUserIdLookup,
} from "@/lib/social/prisma-follow-store";

/** The follow use cases' ports over the shared client; one instance per server process. */
export const followUseCasePorts: FollowUseCasePorts = {
  users: prismaUserIdLookup(prisma),
  follows: prismaFollowStore(prisma),
};
