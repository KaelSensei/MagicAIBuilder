import React from "react";
import { screen, within, type RenderResult } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import {
  divergenceCard,
  RULE_DIVERGENCE_DECK,
  sharedDeckOf,
} from "@/lib/deck/fixtures/rule-divergence-deck";
import type { ApiCard, ApiSharedDeck } from "@/lib/deck/share-types";
import { computeDeckStats } from "@/lib/deck/stats";
import type { Deck } from "@/lib/deck/types";
import { ManaCurve } from "./ManaCurve";
import { ShareDeckView } from "./ShareDeckView";

vi.mock(import("next/navigation"), () => ({
  useRouter: () => ({
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));
vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

const ATRAXA = "d0d33d52-3d28-4635-b985-51e126289259";
const SOL_RING = "fc817e07-c1f3-469f-9cf7-0945dea7400f";

/** A card saved before Scryfall's 2026-10-14 WebP change, with its JPEG URLs. */
function storedCard(
  id: string,
  name: string,
  extra: Partial<ApiCard>
): ApiCard {
  const path = `front/${id[0]}/${id[1]}/${id}.jpg?1599707796`;
  return {
    id: `row-${name}`,
    name,
    manaCost: "",
    cmc: 1,
    colorIdentity: [],
    imageUri: `https://cards.scryfall.io/normal/${path}`,
    artCropUri: `https://cards.scryfall.io/art_crop/${path}`,
    category: "artifact",
    quantity: 1,
    isCommander: false,
    isPartner: false,
    isGameChanger: false,
    ...extra,
  };
}

const deck: ApiSharedDeck = {
  id: "deck-1",
  name: "Superfriends",
  format: "commander",
  targetBracket: 3,
  budget: null,
  cards: [
    storedCard(ATRAXA, "Atraxa", { category: "commander", isCommander: true }),
    storedCard(SOL_RING, "Sol Ring", {}),
  ],
};

describe("ShareDeckView images", () => {
  // Scryfall retires the art_crop JPEG on 2027-01-01.
  it("draws stored JPEG art crops and card images from Scryfall's WebP versions", () => {
    const { container } = renderWithIntl(<ShareDeckView deck={deck} />, {
      locale: "en",
    });
    const html = container.innerHTML;

    expect(html).toContain(
      `https://cards.scryfall.io/art/front/d/0/${ATRAXA}.webp?1599707796`
    );
    expect(html).toContain(
      `https://cards.scryfall.io/art/front/f/c/${SOL_RING}.webp?1599707796`
    );
    expect(html).toContain(
      `https://cards.scryfall.io/grid/front/f/c/${SOL_RING}.webp?1599707796`
    );
    expect(html).not.toMatch(/cards\.scryfall\.io\/(art_crop|normal)\//);
  });
});

// ─── Characterization: the shared page's numbers against the analysis ─────────
//
// `ShareDeckView` computes its own stats panel, mana curve and colour bar from
// the share rows instead of calling `computeDeckStats`, so a player who shares
// a deck sees other numbers than the builder showed. The share select has no
// `zone` column, so "Considering" rows reach the page as main-deck rows
// (pinned by `api/share/route.test.ts`). These tests render the page for the
// deck in `lib/deck/fixtures/rule-divergence-deck.ts` and pin both answers
// side by side; `lib/deck/rule-divergences.characterization.test.ts` pins the
// rest. B2-41 makes the page use the analysis numbers and flips them. They
// live in this file because rendering the page needs the `@/i18n/navigation`
// stub above, and a new file may not add a mock of a repository module
// (ADR 0005, rule 5).

const DECK = RULE_DIVERGENCE_DECK;

function renderSharedPage(deck: Deck): RenderResult {
  return renderWithIntl(<ShareDeckView deck={sharedDeckOf(deck)} />, {
    locale: "en",
  });
}

/** The value beside a label in the page's Stats panel. */
function statValue(label: string): string | null {
  const panel = screen.getByRole("heading", { name: "Stats" }).parentElement;
  if (!panel) throw new Error("the Stats panel has no container");
  return within(panel).getByText(label).nextElementSibling?.textContent ?? null;
}

/** The mana curve buckets that hold cards, as their accessible labels. */
function filledCurveBuckets(scope: HTMLElement): readonly string[] {
  return within(scope)
    .getAllByRole("button", { name: /at CMC/ })
    .map((bar) => bar.getAttribute("aria-label") ?? "")
    .filter((label) => !label.startsWith("0 cards"));
}

/** The colour bar's segments, as "<colour>: <count>". */
function colourSegments(container: HTMLElement): readonly string[] {
  return [...container.querySelectorAll("[title]")]
    .map((segment) => segment.getAttribute("title") ?? "")
    .filter((title) => /^[WUBRGC]: /.test(title));
}

describe("ShareDeckView against computeDeckStats", () => {
  it("currently counts rows, not copies, for the card total and the land count: 9 and 2 where computeDeckStats counts 24 and 19 (pinned; see B2-41)", () => {
    const stats = computeDeckStats(DECK);

    renderSharedPage(DECK);

    expect(statValue("Total cards")).toBe("9");
    expect(statValue("Lands")).toBe("2");
    expect(screen.getByText("9 cards")).toBeInTheDocument();
    expect(stats.totalCards).toBe(24);
    expect(stats.lands).toBe(19);
  });

  it("currently puts the companion and Considering in the mana curve and the average mana value, which computeDeckStats leaves out (pinned; see B2-41)", () => {
    const stats = computeDeckStats(DECK);

    const { container } = renderSharedPage(DECK);

    expect(filledCurveBuckets(container)).toEqual([
      "1 card at CMC 0",
      "3 cards at CMC 3",
      "1 card at CMC 4",
      "2 cards at CMC 5",
    ]);
    expect(statValue("Avg. CMC")).toBe("3");
    expect(stats.manaCurve).toEqual({ 0: 1, 3: 3, 5: 1 });
    expect(stats.avgCmc).toBe(2.25);
  });

  it("currently draws the colour bar from colour identity, one per row with lands and the command zone, where computeDeckStats counts mana symbols per copy of each nonland card (pinned; see B2-41)", () => {
    const stats = computeDeckStats(DECK);

    const { container } = renderSharedPage(DECK);

    expect(colourSegments(container)).toEqual(["U: 4", "G: 5"]);
    expect(stats.colorDistribution).toEqual({ G: 3, U: 2 });
  });

  it("currently counts the Game Changer and the card-draw row in Considering: 2 each where computeDeckStats counts 1 (pinned; see B2-38, B2-41)", () => {
    const stats = computeDeckStats(DECK);

    renderSharedPage(DECK);

    expect(screen.getByText("2 Game Changers")).toBeInTheDocument();
    expect(statValue("Game Changers")).toBe("2");
    expect(statValue("Card draw")).toBe("2");
    expect(stats.gameChangersCount).toBe(1);
    expect(stats.draw).toBe(1);
  });

  it("currently floors a half mana value into the 0 bucket, where computeDeckStats keeps a 0.5 key that the builder's chart never draws (pinned; see B2-41)", () => {
    // An Un-set card: Scryfall gives Little Girl a mana value of 0.5.
    const halfManaDeck: Deck = {
      ...DECK,
      commander: null,
      companion: null,
      cards: [
        divergenceCard({
          name: "Little Girl",
          manaCost: "{HW}",
          cmc: 0.5,
          typeLine: "Creature — Human Child",
          colorIdentity: ["W"],
          category: "creature",
        }),
      ],
      maybeboard: [],
    };
    const stats = computeDeckStats(halfManaDeck);

    const sharedPage = renderSharedPage(halfManaDeck);
    const builderChart = renderWithIntl(<ManaCurve curve={stats.manaCurve} />, {
      locale: "en",
    });

    expect(filledCurveBuckets(sharedPage.container)).toEqual([
      "1 card at CMC 0",
    ]);
    expect(stats.manaCurve).toEqual({ 0.5: 1 });
    expect(filledCurveBuckets(builderChart.container)).toEqual([]);
  });
});
