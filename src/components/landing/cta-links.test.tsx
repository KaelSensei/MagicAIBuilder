/**
 * Pins the Lumen classes of the landing's call-to-action links before they
 * move onto the shared button variants (master plan P1-50, audit com S-11):
 * every class a link carried as a local constant must still be on it after
 * the refactor. `toHaveClass` is a superset check, so inert classes the
 * shared base adds are tolerated; the pull request lists them.
 *
 * Sociable: the real Auth.js `SessionProvider` takes the session as a prop.
 * The one module replaced is `@/i18n/navigation`: next-intl's navigation
 * imports `next/navigation` without an extension, which Vitest cannot load
 * outside a bundler, so component tests use the shared typed stub.
 */
import type { ReactElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import enCommon from "@/messages/en/common.json";
import enLanding from "@/messages/en/landing.json";
import { FinalCta } from "./FinalCta";
import { Hero } from "./Hero";
import { LandingNavbar } from "./LandingNavbar";

// eslint-disable-next-line no-restricted-syntax -- the one seam left; the header says why and what removes it
vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

const SIGNED_IN: Session = {
  user: { id: "user-1" },
  expires: "2099-01-01T00:00:00.000Z",
};

/** The violet pill of the hero and of the closing call to action. */
const HERO_PILL =
  "inline-flex items-center gap-2 rounded-[var(--lumen-radius-pill)] bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white shadow-[var(--lumen-shadow-sm)] transition-colors hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";

/** The quiet accent-coloured link next to the hero's pill. */
const HERO_QUIET_LINK =
  "inline-flex items-center rounded-[var(--lumen-radius-pill)] px-4 py-2.5 text-sm font-medium text-[var(--accent-text)] transition-colors hover:bg-[var(--accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]";

/** The violet pill of the landing bar, shorter than the hero's. */
const NAVBAR_PILL =
  "inline-flex items-center rounded-[var(--lumen-radius-pill)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-[var(--lumen-shadow-sm)] transition-colors hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";

function classesOf(list: string): readonly string[] {
  return list.split(" ");
}

function renderLanding(ui: ReactElement, session: Session | null) {
  return render(
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <NextIntlClientProvider
        locale="en"
        messages={{ landing: enLanding, common: enCommon }}
      >
        {ui}
      </NextIntlClientProvider>
    </SessionProvider>
  );
}

describe("Hero", () => {
  it("offers a visitor the guest deck as the violet pill and the capabilities as the quiet link", () => {
    renderLanding(<Hero />, null);

    const pill = screen.getByRole("link", { name: "Start a guest deck" });
    expect(pill).toHaveAttribute("href", "/builder/guest");
    expect(pill).toHaveClass(...classesOf(HERO_PILL));

    const quiet = screen.getByRole("link", { name: "Explore capabilities" });
    expect(quiet).toHaveAttribute("href", "#capabilities");
    expect(quiet).toHaveClass(...classesOf(HERO_QUIET_LINK));
  });

  it("sends a signed-in player to their decks with the same pill", () => {
    renderLanding(<Hero />, SIGNED_IN);

    const pill = screen.getByRole("link", { name: "Open my decks" });
    expect(pill).toHaveAttribute("href", "/decks");
    expect(pill).toHaveClass(...classesOf(HERO_PILL));
  });
});

describe("FinalCta", () => {
  it("closes with the violet pill, spaced below the subtitle", () => {
    renderLanding(<FinalCta />, SIGNED_IN);

    const pill = screen.getByRole("link", { name: "Open my decks" });
    expect(pill).toHaveAttribute("href", "/decks");
    expect(pill).toHaveClass(...classesOf(HERO_PILL), "mt-6");
  });
});

describe("LandingNavbar", () => {
  it("offers a visitor the guest deck as the bar's pill", () => {
    renderLanding(<LandingNavbar />, null);

    const pill = screen.getByRole("link", { name: "Guest deck" });
    expect(pill).toHaveAttribute("href", "/builder/guest");
    expect(pill).toHaveClass(...classesOf(NAVBAR_PILL));
  });

  it("sends a signed-in player to their decks with the bar's pill", () => {
    renderLanding(<LandingNavbar />, SIGNED_IN);

    const pill = screen.getByRole("link", { name: "My Decks" });
    expect(pill).toHaveAttribute("href", "/decks");
    expect(pill).toHaveClass(...classesOf(NAVBAR_PILL));
  });
});
