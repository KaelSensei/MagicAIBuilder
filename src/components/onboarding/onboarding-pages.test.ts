// @vitest-environment node
/**
 * The page rule of the onboarding dialog: it never opens by itself on a page a
 * visitor can read without an account, except in the guest builder, the one
 * public page whose steps it describes (I-39 functional requirement 1.1).
 */
import { describe, expect, it } from "vitest";
import { onboardingMayOpenUnasked } from "./onboarding-pages";

describe("onboardingMayOpenUnasked", () => {
  it("keeps the dialog closed on the landing page", () => {
    expect(onboardingMayOpenUnasked("/")).toBe(false);
  });

  it("keeps the dialog closed on a public deck page", () => {
    expect(onboardingMayOpenUnasked("/deck/deck-1")).toBe(false);
  });

  it("keeps the dialog closed on the French landing page", () => {
    expect(onboardingMayOpenUnasked("/fr")).toBe(false);
  });

  it.each([
    "/share/abc123XYZABC",
    "/u/player-1",
    "/commanders/atraxa-praetors-voice/decks",
    "/rules/game-changers",
    "/auth/signin",
    "/auth/signup",
    "/fr/deck/deck-1",
  ])("keeps the dialog closed on the public page %s", (pathname) => {
    expect(onboardingMayOpenUnasked(pathname)).toBe(false);
  });

  it.each([
    "/builder/guest",
    "/fr/builder/guest",
    "/decks",
    "/builder/deck-1",
    "/collection",
  ])("lets the dialog open on %s", (pathname) => {
    expect(onboardingMayOpenUnasked(pathname)).toBe(true);
  });
});
