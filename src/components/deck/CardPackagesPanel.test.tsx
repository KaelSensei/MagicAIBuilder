import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import type { DeckCard } from "@/lib/deck/types";
import { CardPackagesPanel } from "./CardPackagesPanel";

const cards: DeckCard[] = [
  {
    id: "sol-ring",
    scryfallId: "scryfall-sol-ring",
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
    category: "ramp",
    quantity: 1,
    zone: "main",
  },
];

function response(body: unknown, ok = true): Response {
  return { ok, json: vi.fn().mockResolvedValue(body) } as unknown as Response;
}

describe("CardPackagesPanel", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("saves only selected deck cards as a reusable package", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(response([]));
    renderWithIntl(<CardPackagesPanel deckId="deck-1" cards={cards} />);

    fireEvent.click(screen.getByRole("button", { name: "Card packages" }));
    fireEvent.click(screen.getByRole("button", { name: "Create package" }));
    fireEvent.change(screen.getByLabelText("Package name"), {
      target: { value: "Fast mana" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /Sol Ring/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save package" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1]).toEqual([
      "/api/community/card-packages",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"scryfallId":"scryfall-sol-ring"'),
      }),
    ]);
  });

  it("previews legality and applies only selected ready cards", async () => {
    const onApplied = vi.fn();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        response([
          {
            id: "package-1",
            name: "Interaction core",
            description: "",
            category: "interaction",
            author: { username: "brewer", name: null },
            cards: [],
          },
        ])
      )
      .mockResolvedValueOnce(
        response({
          readyCount: 1,
          blockedCount: 1,
          cards: [
            { scryfallId: "ready", name: "Counterspell", quantity: 1, status: "ready", issues: [] },
            { scryfallId: "blocked", name: "Demonic Tutor", quantity: 1, status: "blocked", issues: [{ kind: "colorIdentity", message: "Off colour" }] },
          ],
        })
      )
      .mockResolvedValueOnce(response({ addedCount: 1, blockedCount: 0 }));

    renderWithIntl(
      <CardPackagesPanel deckId="deck-1" cards={cards} onApplied={onApplied} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Card packages" }));
    await screen.findByText("Interaction core");
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    expect(await screen.findByText("Counterspell")).toBeDefined();
    expect(screen.getByText("Demonic Tutor")).toBeDefined();
    expect(screen.getByRole("checkbox", { name: /Demonic Tutor/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Add 1 card" }));

    await waitFor(() => expect(onApplied).toHaveBeenCalledOnce());
    expect(fetchMock.mock.calls[2]?.[1]).toEqual(
      expect.objectContaining({ body: JSON.stringify({ deckId: "deck-1", acceptedScryfallIds: ["ready"] }) })
    );
  });

  it("shows private packages in the owner's library", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([{
        id: "private-1", name: "My mana base", description: "", category: "mana-base",
        isPublic: false, author: { username: "owner", name: null }, cards: [],
      }]));

    renderWithIntl(<CardPackagesPanel deckId="deck-1" cards={cards} />);
    fireEvent.click(screen.getByRole("button", { name: "Card packages" }));
    fireEvent.click(screen.getByRole("button", { name: "My packages" }));

    expect(await screen.findByText("My mana base")).toBeDefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/community/card-packages?scope=mine");
  });
});
