import { beforeEach, describe, expect, it } from "vitest";
import { act, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { useCollectionStore } from "@/lib/collection/store";
import type { CollectionCard } from "@/lib/collection/types";
import type { DeckCard } from "@/lib/deck/types";
import { CardListItem } from "./CardListItem";

function deckCard(overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: "row-sol-ring",
    scryfallId: "sol-ring-c21",
    name: "Sol Ring",
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Artifact",
    oracleText: "{T}: Add {C}{C}.",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "ramp",
    quantity: 1,
    zone: "main",
    ...overrides,
  };
}

function collectionCopy(
  scryfallId: string,
  quantity: number,
  foil = false
): CollectionCard {
  return {
    id: `collection-${scryfallId}-${foil ? "foil" : "normal"}`,
    scryfallId,
    name: scryfallId,
    quantity,
    foil,
    condition: null,
    acquiredAt: null,
    price: null,
    imageUri: "",
    createdAt: new Date("2026-11-01T00:00:00Z"),
  };
}

/** Puts these copies in the player's collection, as `loadCollection` would. */
function ownCopies(...copies: readonly CollectionCard[]): void {
  const normal: Record<string, CollectionCard> = {};
  const foil: Record<string, CollectionCard> = {};
  for (const copy of copies) {
    (copy.foil ? foil : normal)[copy.scryfallId] = copy;
  }
  useCollectionStore.setState({
    collectionCards: normal,
    collectionCardsFoil: foil,
  });
}

beforeEach(() => {
  useCollectionStore.setState({ collectionCards: {}, collectionCardsFoil: {} });
});

describe("CardListItem ownership badge", () => {
  it("marks a card whose printing is in the collection as owned, with the copy count", () => {
    ownCopies(collectionCopy("sol-ring-c21", 2));

    renderWithIntl(<CardListItem card={deckCard()} />);

    expect(screen.getByText("Owned")).toBeInTheDocument();
    expect(
      screen.getByText("Owned: 2 copies of this printing in your collection")
    ).toBeInTheDocument();
    expect(screen.queryByText("Buy")).not.toBeInTheDocument();
  });

  it("asks the player to buy a card whose printing is not in the collection", () => {
    ownCopies(collectionCopy("counterspell-mh2", 1));

    renderWithIntl(<CardListItem card={deckCard()} />);

    expect(screen.getByText("Buy")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Buy: 1 more copy of this printing needed, 0 in your collection"
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("Owned")).not.toBeInTheDocument();
  });

  it("does not count another printing of the same card", () => {
    ownCopies(collectionCopy("sol-ring-cmr", 4));

    renderWithIntl(
      <CardListItem card={deckCard({ scryfallId: "sol-ring-c21" })} />
    );

    expect(screen.getByText("Buy")).toBeInTheDocument();
  });

  it("counts foil and non-foil copies of the printing together", () => {
    ownCopies(
      collectionCopy("rats-m12", 2),
      collectionCopy("rats-m12", 1, true)
    );

    renderWithIntl(
      <CardListItem
        card={deckCard({
          scryfallId: "rats-m12",
          name: "Relentless Rats",
          quantity: 3,
        })}
      />
    );

    expect(
      screen.getByText("Owned: 3 copies of this printing in your collection")
    ).toBeInTheDocument();
  });

  it("asks for the missing copies when the collection holds fewer than the deck needs", () => {
    ownCopies(collectionCopy("rats-m12", 3));

    renderWithIntl(
      <CardListItem
        card={deckCard({
          scryfallId: "rats-m12",
          name: "Relentless Rats",
          quantity: 20,
        })}
      />
    );

    expect(
      screen.getByText(
        "Buy: 17 more copies of this printing needed, 3 in your collection"
      )
    ).toBeInTheDocument();
  });

  // CR 205.4c: a land with the basic supertype is basic, Snow-Covered basics included.
  it.each([
    ["Forest", "Basic Land — Forest"],
    ["Snow-Covered Forest", "Basic Snow Land — Forest"],
    ["Wastes", "Basic Land"],
  ])("never asks the player to buy a basic land: %s", (name, typeLine) => {
    ownCopies(collectionCopy("sol-ring-c21", 1));

    renderWithIntl(
      <CardListItem
        card={deckCard({
          scryfallId: `${name}-printing`,
          name,
          typeLine,
          quantity: 30,
        })}
      />
    );

    expect(screen.queryByText("Buy")).not.toBeInTheDocument();
    expect(screen.queryByText("Owned")).not.toBeInTheDocument();
  });

  it("still asks for a nonbasic land with a basic land type", () => {
    ownCopies(collectionCopy("sol-ring-c21", 1));

    renderWithIntl(
      <CardListItem
        card={deckCard({
          scryfallId: "dryad-arbor",
          name: "Dryad Arbor",
          typeLine: "Land Creature — Forest Dryad",
        })}
      />
    );

    expect(screen.getByText("Buy")).toBeInTheDocument();
  });

  it("shows no badge while the collection is empty, as for a guest", () => {
    renderWithIntl(<CardListItem card={deckCard()} />);

    expect(screen.queryByText("Buy")).not.toBeInTheDocument();
    expect(screen.queryByText("Owned")).not.toBeInTheDocument();
  });

  it("turns Buy into Owned when the player adds the printing to the collection", () => {
    ownCopies(collectionCopy("counterspell-mh2", 1));
    renderWithIntl(<CardListItem card={deckCard()} />);
    expect(screen.getByText("Buy")).toBeInTheDocument();

    act(() => {
      ownCopies(
        collectionCopy("counterspell-mh2", 1),
        collectionCopy("sol-ring-c21", 1)
      );
    });

    expect(screen.getByText("Owned")).toBeInTheDocument();
    expect(screen.queryByText("Buy")).not.toBeInTheDocument();
  });

  it("reads in French for a French player", () => {
    ownCopies(collectionCopy("sol-ring-c21", 1), collectionCopy("rats-m12", 3));

    renderWithIntl(
      <>
        <CardListItem card={deckCard()} />
        <CardListItem
          card={deckCard({
            id: "row-rats",
            scryfallId: "rats-m12",
            name: "Relentless Rats",
            quantity: 5,
          })}
        />
      </>,
      { locale: "fr" }
    );

    expect(screen.getByText("Possédée")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Possédée : 1 exemplaire de cette édition dans ta collection"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Acheter")).toBeInTheDocument();
    expect(
      screen.getByText(
        "À acheter : 2 exemplaires manquants de cette édition, 3 dans ta collection"
      )
    ).toBeInTheDocument();
  });
});
