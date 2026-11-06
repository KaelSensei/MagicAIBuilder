import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { ShoppingListModal } from "./ShoppingListModal";

const sol: DeckCard = {
  id: "sol-ring",
  scryfallId: "sol-ring",
  name: "Sol Ring",
  manaCost: "{1}",
  cmc: 1,
  typeLine: "Artifact",
  oracleText: "",
  colorIdentity: [],
  isGameChanger: false,
  isBanned: false,
  price: 1,
  imageUri: "",
  artCropUri: "",
  category: "artifact",
  quantity: 1,
  zone: "main",
};

const signet: DeckCard = { ...sol, id: "signet", scryfallId: "signet", name: "Arcane Signet" };

const deck: Deck = {
  id: "deck-1",
  name: "Shared cards",
  commander: null,
  partner: null,
  companion: null,
  pairingType: "none",
  cards: [sol, signet],
  maybeboard: [],
  format: "commander",
  cardCount: 2,
  targetBracket: 1,
  manualBracket: null,
  budget: null,
  description: "",
  tags: [],
  shareToken: null,
  shareEnabled: false,
  isPublic: false,
  isAIGenerated: false,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

interface PendingResponse {
  readonly ok: boolean;
}

describe("ShoppingListModal intent rollback", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not let a failed toggle wipe a later successful one", async () => {
    const puts: Array<(response: PendingResponse) => void> = [];
    let resolveLoad: (response: PendingResponse & { json: () => Promise<unknown> }) => void = () => {};
    const load = new Promise<PendingResponse & { json: () => Promise<unknown> }>((resolve) => {
      resolveLoad = resolve;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        if (init?.method === "PUT") {
          return new Promise<PendingResponse>((resolve) => {
            puts.push(resolve);
          });
        }
        return load;
      })
    );

    renderWithIntl(
      <ShoppingListModal deck={deck} ownedQuantities={{}} ownerId="owner" onClose={vi.fn()} />
    );

    await act(async () => {
      resolveLoad({ ok: true, json: () => Promise.resolve({ intents: [] }) });
    });

    fireEvent.click(await screen.findByRole("button", { name: "Buy later: Sol Ring" }));
    fireEvent.click(screen.getByRole("button", { name: "Proxy now: Arcane Signet" }));
    expect(puts).toHaveLength(2);

    await act(async () => {
      puts[1]?.({ ok: true });
      puts[0]?.({ ok: false });
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Buy now: Arcane Signet" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    });
    expect(screen.getByRole("button", { name: "Buy later: Sol Ring" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });
});
