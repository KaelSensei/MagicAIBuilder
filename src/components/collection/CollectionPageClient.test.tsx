import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useCollectionStore } from "@/lib/collection/store";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useFormatter: () => ({ number: (value: number) => String(value) }),
}));
vi.mock("./AddToCollectionDialog", () => ({ AddToCollectionDialog: () => null }));
vi.mock("@/components/card/PrintingSelectorModal", () => ({ PrintingSelectorModal: () => null }));
vi.mock("@/components/collection/AcquisitionPlanPanel", () => ({ AcquisitionPlanPanel: () => null }));
vi.mock("@/components/collection/PrintingDeckUsage", () => ({ PrintingDeckUsage: () => null }));

import { CollectionPageClient } from "./CollectionPageClient";

beforeEach(() => {
  useCollectionStore.setState({
    collectionCards: {},
    collectionCardsFoil: {},
    isLoading: false,
    loadError: false,
  });
  vi.restoreAllMocks();
});

it("shows a retryable error instead of an empty collection after the initial load fails", async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: false })
    .mockResolvedValueOnce({ ok: true, json: async () => [] });
  vi.stubGlobal("fetch", fetchMock);

  render(<CollectionPageClient />);

  expect(await screen.findByRole("alert")).toHaveTextContent("loadFailed");
  expect(screen.queryByText("empty.title")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "retry" }));
  expect(await screen.findByText("empty.title")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it("keeps cached cards visible with a refresh warning", async () => {
  useCollectionStore.setState({
    collectionCards: {
      "printing-1": {
        id: "owned-1",
        scryfallId: "printing-1",
        name: "Sol Ring",
        quantity: 1,
        foil: false,
        condition: "NM",
        acquiredAt: null,
        price: 1,
        imageUri: "https://example.com/card.jpg",
        createdAt: new Date("2024-01-01"),
      },
    },
  });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

  render(<CollectionPageClient />);

  expect(await screen.findByRole("alert")).toHaveTextContent("loadFailed");
  expect(screen.getByText("Sol Ring")).toBeInTheDocument();
  expect(screen.queryByText("empty.title")).not.toBeInTheDocument();
});
