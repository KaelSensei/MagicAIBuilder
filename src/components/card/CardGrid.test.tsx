import { renderWithIntl } from "@/test/render-with-intl";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { CardGrid } from "./CardGrid";

vi.mock("@/components/collection/CollectionBadge", () => ({ CollectionBadge: () => null }));
vi.mock("@/components/collection/QuickAddCollectionButton", () => ({ QuickAddCollectionButton: () => null }));

const SOL_RING: ScryfallCard = { id: "card-1", name: "Sol Ring", cmc: 1, type_line: "Artifact", color_identity: [] };
const ARCANE_SIGNET: ScryfallCard = { id: "card-2", name: "Arcane Signet", cmc: 2, type_line: "Artifact", color_identity: [] };

describe("CardGrid Considering action", () => {
  it("adds a grid result to Considering without dragging", () => {
    const onAddToMaybeboard = vi.fn();
    renderWithIntl(
      <CardGrid cards={[SOL_RING]} onAddToMaybeboard={onAddToMaybeboard} maybeboardNames={new Set()} />,
      { locale: "en" }
    );

    fireEvent.click(screen.getByRole("button", { name: "Add Sol Ring to Considering" }));

    expect(onAddToMaybeboard).toHaveBeenCalledWith(SOL_RING);
  });

  it("disables the action only for cards already in Considering", () => {
    renderWithIntl(
      <CardGrid cards={[SOL_RING, ARCANE_SIGNET]} onAddToMaybeboard={vi.fn()} maybeboardNames={new Set(["Sol Ring"])} />,
      { locale: "en" }
    );

    expect(screen.getByRole("button", { name: "Sol Ring is already in Considering" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add Arcane Signet to Considering" })).toBeEnabled();
  });

  it("shows no Considering action without an add handler", () => {
    renderWithIntl(<CardGrid cards={[SOL_RING]} />, { locale: "en" });

    expect(screen.queryByRole("button", { name: /Considering/ })).toBeNull();
  });
});
