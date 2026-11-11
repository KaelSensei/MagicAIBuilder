/**
 * Session guards for route handlers: `requireAuth` (a signed-in user whose row
 * still exists) and `requireDeckOwner` (that user owns the deck).
 *
 * Each returns either its value or a ready `NextResponse` (401, 403 or 404)
 * for the handler to return. Outside production, `PLAYWRIGHT_TEST=1` signs an
 * anonymous caller in as a fixed test user. Bearer keys of the public API are
 * checked in `lib/api/authenticate.ts`, never here.
 *
 * @module auth/helpers
 */
import "server-only";
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isUniqueViolation } from "@/lib/db/prisma-errors";

/** Session with guaranteed user.id */
export interface AuthenticatedSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    createdAt: Date;
    onboardingDone: boolean;
  };
}

/** The user columns a resolved session exposes. */
const SESSION_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  createdAt: true,
  onboardingDone: true,
} as const;

/** The identity the Playwright bypass signs an anonymous caller in as. */
const PLAYWRIGHT_USER = {
  email: "playwright@test.local",
  name: "Playwright",
  image: null,
} as const;

/**
 * Look up the user a session token names. Never creates one.
 *
 * The row is written at sign-in, before the token exists: on a first OAuth
 * sign-in the Prisma adapter creates it and the JWT callback copies its id into
 * the token; a credentials sign-in needs the row /api/auth/signup made. So a
 * token whose row is gone belongs to a deleted account, and it is signed out.
 * Re-creating the row from the token's email would bring the account back,
 * empty, on every device still holding the 7-day cookie.
 *
 * @param userId - the id the session token carries; empty when the token has none
 * @returns the user, or null when the token names no live row
 */
function findSessionUser(
  userId: string
): Promise<AuthenticatedSession["user"] | null> {
  if (!userId) {
    return Promise.resolve(null);
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: SESSION_USER_SELECT,
  });
}

/**
 * Find or create the Playwright user. The test bypass is the only caller that
 * may create a user per request: it has no sign-in, so no adapter wrote the row.
 *
 * @returns the Playwright user, or null when it cannot be read back
 */
async function provisionPlaywrightUser(): Promise<
  AuthenticatedSession["user"] | null
> {
  try {
    return await prisma.user.upsert({
      where: { email: PLAYWRIGHT_USER.email },
      update: {},
      create: PLAYWRIGHT_USER,
      select: SESSION_USER_SELECT,
    });
  } catch (error) {
    // Prisma's upsert is a read-then-write, not an atomic INSERT ... ON
    // CONFLICT, so concurrent callers for the same email all miss and all
    // insert. Losing that race is expected, not a failure: read the row the
    // winner just wrote.
    if (!isUniqueViolation(error)) {
      throw error;
    }

    return prisma.user.findUnique({
      where: { email: PLAYWRIGHT_USER.email },
      select: SESSION_USER_SELECT,
    });
  }
}

/**
 * Get authenticated session or return a 401 response.
 * Use in API route handlers that require authentication.
 *
 * @returns Either the session or a NextResponse 401
 */
export async function requireAuth(): Promise<
  | { session: AuthenticatedSession; error?: never }
  | { session?: never; error: NextResponse }
> {
  const session = await auth();

  const isTestBypass =
    process.env.PLAYWRIGHT_TEST === "1" && process.env.NODE_ENV !== "production";
  if (isTestBypass && !session?.user) {
    const user = await provisionPlaywrightUser();
    if (!user) {
      return {
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }
    return { session: { user } };
  }

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Resolve against the database rather than trusting the JWT's id outright.
  //
  // The id rides in a signed cookie, so it outlives the row it points at: an
  // account deleted while a device is still signed in, or a database rebuilt
  // under live sessions. Trusting that id made reads quietly return nothing
  // (the listing showed "no decks yet") while every write died on a
  // foreign-key violation and surfaced as a 500.
  //
  // A token whose row is gone is answered 401, so the caller signs in again.
  // It is never healed by re-creating the user from the token's email: that
  // brought deleted accounts back. The cost is one indexed primary-key lookup
  // per authenticated request.
  const user = await findSessionUser(session.user.id);
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session: { user } };
}

/**
 * Load a deck and verify the current user owns it.
 * Returns 401 if not authenticated, 404 if not found, 403 if not owner.
 *
 * @param deckId - The deck ID to verify ownership for
 * @returns The userId + deck, or an error response
 */
export async function requireDeckOwner(deckId: string): Promise<
  | { userId: string; deck: { id: string; userId: string | null }; error?: never }
  | { userId?: never; deck?: never; error: NextResponse }
> {
  const result = await requireAuth();
  if (result.error) return result;

  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    select: { id: true, userId: true },
  });

  if (!deck) {
    return { error: NextResponse.json({ error: "Deck not found" }, { status: 404 }) };
  }

  // Only the owner may access a deck; ownerless (legacy) decks are denied
  if (deck.userId !== result.session.user.id) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { userId: result.session.user.id, deck };
}
