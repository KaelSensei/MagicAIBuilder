/**
 * The deck store's command zone follows CR 702.124 when a commander or a
 * partner is picked: the store asks `pairCommanders` and refuses, or drops,
 * a second commander the partner rules do not allow.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const toastAdd = vi.hoisted(() => vi.fn());

vi.mock(import("@/lib/db/deck-api"), () => ({
  updateDeck: vi.fn().mockResolvedValue({}),
  addCard: vi.fn().mockResolvedValue({ id: "saved-row" }),
  removeCard: vi.fn().mockResolvedValue(undefined),
  lookupCardCache: vi.fn().mockResolvedValue(null),
}));

vi.mock(import("@/hooks/useToast"), async (importOriginal) => {
  const { useToastStore } = await importOriginal();
  useToastStore.setState({ add: toastAdd });
  return { useToastStore };
});

import * as deckApi from "@/lib/db/deck-api";
import { createEmptyDeck } from "./store-factories";
import { makeDeckCard } from "./store-card-faces";
import type { PairingCard } from "./partner-abilities";
import type { Deck } from "./types";
import type { ScryfallCard } from "@/lib/scryfall/types";
import {
  AMY_POND,
  BRALLIN,
  CLARA_OSWALD,
  ELLIE,
  KRAUM,
  PIR,
  SEFRIS,
  TENTH_DOCTOR,
  THRASIOS,
  TOOTHY,
  TYMNA,
  WILSON,
} from "./fixtures/partner-cards";

const { useDeckStore } = await import("./store");

/** A Scryfall card carrying a fixture's name, type line and Oracle text. */
function scryfallOf(card: PairingCard): ScryfallCard {
  return {
    id: `${card.name.toLowerCase().replaceAll(/\W+/g, "-")}-printing`,
    name: card.name,
    cmc: 0,
    type_line: card.typeLine,
    oracle_text: card.oracleText,
    color_identity: [],
    keywords: [],
    legalities: { commander: "legal" },
  };
}

/** Seeds the active deck with this command zone. */
function seedCommandZone(
  commander: PairingCard | null,
  partner: PairingCard | null,
  pairingType: Deck["pairingType"]
): void {
  const deck: Deck = {
    ...createEmptyDeck("deck-1", "Pairing"),
    commander: commander ? makeDeckCard(scryfallOf(commander)) : null,
    partner: partner ? makeDeckCard(scryfallOf(partner)) : null,
    pairingType,
  };
  useDeckStore.setState({
    decks: { "deck-1": deck },
    activeDeckId: "deck-1",
    gameChangerNames: new Set(),
    bannedNames: new Set(),
  });
}

function activeDeck(): Deck {
  const deck = useDeckStore.getState().decks["deck-1"];
  if (!deck) throw new Error("no active deck");
  return deck;
}

beforeEach(() => {
  vi.mocked(deckApi.updateDeck).mockClear();
  vi.mocked(deckApi.addCard).mockClear();
  toastAdd.mockClear();
});

describe("setPartner — refuses a second commander CR 702.124 forbids", () => {
  it.each([
    {
      rule: "702.124j: Pir names Toothy",
      commander: PIR,
      partner: BRALLIN,
      pairing: "partner_with",
    },
    {
      rule: "702.124m: Clara needs a Time Lord Doctor",
      commander: CLARA_OSWALD,
      partner: SEFRIS,
      pairing: "doctor",
    },
    {
      rule: "702.124k: Wilson needs a Background",
      commander: WILSON,
      partner: TYMNA,
      pairing: "background",
    },
    {
      rule: "702.124i: Ellie needs partner—Survivors",
      commander: ELLIE,
      partner: TYMNA,
      pairing: "survivors",
    },
  ] as const)(
    "$partner.name beside $commander.name ($rule)",
    async ({ commander, partner, pairing }) => {
      seedCommandZone(commander, null, pairing);

      await useDeckStore.getState().setPartner(scryfallOf(partner));

      expect(activeDeck().partner).toBeNull();
      expect(activeDeck().pairingType).toBe(pairing);
      expect(deckApi.updateDeck).not.toHaveBeenCalled();
      expect(deckApi.addCard).not.toHaveBeenCalled();
      expect(toastAdd).toHaveBeenCalledWith(
        "warning",
        `${partner.name} cannot share the command zone with ${commander.name}.`
      );
    }
  );
});

describe("setPartner — records the pairing the two commanders use", () => {
  it("pairs Amy Pond with a Time Lord Doctor through Doctor's companion (CR 702.124g)", async () => {
    seedCommandZone(AMY_POND, null, "partner_with");

    await useDeckStore.getState().setPartner(scryfallOf(TENTH_DOCTOR));

    expect(activeDeck().partner?.name).toBe("The Tenth Doctor");
    expect(activeDeck().pairingType).toBe("doctor");
    expect(deckApi.updateDeck).toHaveBeenCalledWith(
      "deck-1",
      expect.objectContaining({ pairingType: "doctor" })
    );
  });

  it("pairs Pir with Toothy, the card Pir names (CR 702.124j)", async () => {
    seedCommandZone(PIR, null, "partner_with");

    await useDeckStore.getState().setPartner(scryfallOf(TOOTHY));

    expect(activeDeck().partner?.name).toBe("Toothy, Imaginary Friend");
    expect(activeDeck().pairingType).toBe("partner_with");
  });
});

describe("setCommander — keeps the partner only when the pair stays legal", () => {
  it("drops a Partner commander beside a new partner-with commander (CR 702.124f)", async () => {
    seedCommandZone(TYMNA, THRASIOS, "partner");

    await useDeckStore.getState().setCommander(scryfallOf(PIR));

    expect(activeDeck().partner).toBeNull();
    expect(activeDeck().pairingType).toBe("partner_with");
    expect(deckApi.updateDeck).toHaveBeenCalledWith(
      "deck-1",
      expect.objectContaining({ partnerId: null, pairingType: "partner_with" })
    );
  });

  it("keeps a Partner commander beside another Partner commander (CR 702.124h)", async () => {
    seedCommandZone(TYMNA, THRASIOS, "partner");

    await useDeckStore.getState().setCommander(scryfallOf(KRAUM));

    expect(activeDeck().partner?.name).toBe("Thrasios, Triton Hero");
    expect(activeDeck().pairingType).toBe("partner");
  });

  it("opens the companion slot for a lone Time Lord Doctor (CR 702.124m)", async () => {
    seedCommandZone(null, null, "none");

    await useDeckStore.getState().setCommander(scryfallOf(TENTH_DOCTOR));

    expect(activeDeck().pairingType).toBe("doctor");
  });
});
