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

  const userByEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, email: true, image: true },
  });
  if (userByEmail) {
    return userByEmail;
  }

  return prisma.user.create({
    data: {
      email: normalizedEmail,
      name: sessionUser.name ?? null,
      image: sessionUser.image ?? null,
    },
    select: { id: true, name: true, email: true, image: true },
  });
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

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

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

  // Allow access to legacy decks (no userId) or owned decks
  if (deck.userId && deck.userId !== result.session.user.id) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { userId: result.session.user.id, deck };
}
