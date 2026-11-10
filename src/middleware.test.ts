import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";

/** Header the stubbed locale middleware stamps on every response it serves. */
const { SERVED_BY_LOCALE_MIDDLEWARE } = vi.hoisted(() => ({
  SERVED_BY_LOCALE_MIDDLEWARE: "x-test-served-by-locale-middleware",
}));

// NextAuth's wrapper resolves the session from cookies before calling the
// handler. The tests supply `auth` on the request themselves, so the wrapper is
// reduced to the handler it wraps.
vi.mock("next-auth", () => ({
  default: () => ({ auth: <Handler>(handler: Handler) => handler }),
}));

vi.mock("next-intl/middleware", () => ({
  default: () => () => {
    const response = NextResponse.next();
    response.headers.set(SERVED_BY_LOCALE_MIDDLEWARE, "1");
    return response;
  },
}));

import middleware from "./middleware";
import { sanitizeCallbackUrl } from "@/lib/auth/callback-url";

/**
 * Runs the middleware the way a signed-out visitor or a crawler reaches it.
 *
 * @param pathname Request pathname, with or without a locale prefix.
 * @returns The middleware's response.
 */
async function visitSignedOut(pathname: string): Promise<Response | void> {
  const request = Object.assign(
    new NextRequest(`http://localhost:3000${pathname}`),
    { auth: null }
  );

  return middleware(request, { params: Promise.resolve({}) });
}

describe("middleware for a signed-out visitor", () => {
  it("serves the rules reference pages in every served locale", async () => {
    const gameChangers = await visitSignedOut("/rules/game-changers");
    const comprehensive = await visitSignedOut("/fr/rules/comprehensive");

    expect(gameChangers?.headers.get(SERVED_BY_LOCALE_MIDDLEWARE)).toBe("1");
    expect(comprehensive?.headers.get(SERVED_BY_LOCALE_MIDDLEWARE)).toBe("1");
  });

  it("sends the private deck list to the localized sign-in page", async () => {
    const response = await visitSignedOut("/fr/decks");
    const location = response?.headers.get("location") ?? "";

    expect(response?.headers.get(SERVED_BY_LOCALE_MIDDLEWARE)).toBeNull();
    expect(new URL(location).pathname).toBe("/fr/auth/signin");
  });

  /**
   * The sign-in form only follows a same-origin path. An absolute URL, even
   * one naming this site, falls back to the deck list, so the page the visitor
   * asked for has to travel as a path.
   */
  it("hands sign-in the requested page as a path the form will follow", async () => {
    const response = await visitSignedOut("/fr/collection?view=list");
    const location = new URL(response?.headers.get("location") ?? "");
    const callbackUrl = location.searchParams.get("callbackUrl");

    expect(callbackUrl).toBe("/fr/collection?view=list");
    expect(sanitizeCallbackUrl(callbackUrl)).toBe("/fr/collection?view=list");
  });
});
