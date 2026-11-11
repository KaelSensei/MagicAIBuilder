import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import type { ApiCard, ApiSharedDeck } from "@/lib/deck/share-types";
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
