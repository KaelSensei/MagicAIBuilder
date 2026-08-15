import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/** Session with guaranteed user.id */
export interface AuthenticatedSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

interface SessionUserCandidate {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

/** Prisma's error code for a unique-constraint violation. */
const UNIQUE_VIOLATION = "P2002";

/**
 * @param error - a rejected Prisma promise's reason
 * @returns whether the write lost a race to a concurrent insert
 */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === UNIQUE_VIOLATION
  );
}

async function resolveAuthenticatedUser(
  sessionUser: SessionUserCandidate
): Promise<AuthenticatedSession["user"] | null> {
  if (sessionUser.id) {
    const userById = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, name: true, email: true, image: true },
    });
    if (userById) {
      return userById;
    }
  }

  const normalizedEmail = sessionUser.email?.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const select = { id: true, name: true, email: true, image: true } as const;

  try {
    return await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {},
      create: {
        email: normalizedEmail,
        name: sessionUser.name ?? null,
        image: sessionUser.image ?? null,
      },
      select,
    });
  } catch (error) {
    // Prisma's upsert is a read-then-write, not an atomic INSERT ... ON
    // CONFLICT, so concurrent callers for the same email all miss and all
    // insert. Losing that race is expected, not a failure: read the row the
    // winner just wrote.
    if (!isUniqueViolation(error)) {
      throw error;
    }

    return prisma.user.findUnique({ where: { email: normalizedEmail }, select });
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
    const user = await resolveAuthenticatedUser({
      email: "playwright@test.local",
      name: "Playwright",
      image: null,
    });
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

  // Fast path: trust the JWT-verified user ID (avoids a DB round-trip)
  if (session.user.id) {
    return {
      session: {
        user: {
          id: session.user.id,
          name: session.user.name ?? null,
          email: session.user.email ?? null,
          image: session.user.image ?? null,
        },
      },
    };
  }

  // Fallback: resolve by email when ID is missing (e.g. first OAuth sign-in)
  const user = await resolveAuthenticatedUser(session.user);
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
