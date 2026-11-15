import { act, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuickAddCollectionButton } from "./QuickAddCollectionButton";
import { useCollectionStore } from "@/lib/collection/store";
import type { AddToCollectionInput } from "@/lib/collection/types";
import { aScryfallCard } from "@/test/builders/scryfall";
import { renderWithProviders } from "@/test/render";

const SIGNED_IN = {
  user: { id: "player-1", name: "Kael" },
  expires: "2099-01-01T00:00:00.000Z",
};

// The store's real action posts to /api/collection. The button's own job ends at
// the input it hands over, so that handover is what these tests observe. The
// promise stays pending until the test settles it inside `act`, as the store
// would once its POST answered.
const realAddToCollection = useCollectionStore.getState().addToCollection;
let settleAdd: () => void = () => {};
const addToCollection = vi.fn<(input: AddToCollectionInput) => Promise<void>>(
  () =>
    new Promise<void>((resolve) => {
      settleAdd = resolve;
    })
);

beforeEach(() => {
  addToCollection.mockClear();
  useCollectionStore.setState({
    collectionCards: {},
    collectionCardsFoil: {},
    addToCollection,
  });
});

afterEach(() => {
  // Unmount before the store changes, or the subscription re-renders the
  // button outside act.
  cleanup();
  useCollectionStore.setState({ addToCollection: realAddToCollection });
});

async function clickAdd(usd: string | null | undefined) {
  const user = userEvent.setup();
  renderWithProviders(
    <QuickAddCollectionButton
      card={aScryfallCard({ name: "Sol Ring", prices: { usd } })}
    />,
    { session: SIGNED_IN }
  );
  await user.click(screen.getByRole("button", { name: "Own" }));
  await act(async () => settleAdd());
  expect(screen.getByText("Added!")).toBeInTheDocument();
}

describe("QuickAddCollectionButton price", () => {
  it("adds the card with Scryfall's USD price as a number", async () => {
    await clickAdd("1.25");

    expect(addToCollection).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Sol Ring", quantity: 1, price: 1.25 })
    );
  });

  it("adds the card without a price when Scryfall has none", async () => {
    await clickAdd(null);

    expect(addToCollection).toHaveBeenCalledWith(
      expect.objectContaining({ price: null })
    );
  });

  it("adds the card without a price, not NaN, when Scryfall's price string is not a number", async () => {
    await clickAdd("N/A");

    expect(addToCollection).toHaveBeenCalledWith(
      expect.objectContaining({ price: null })
    );
  });
});
