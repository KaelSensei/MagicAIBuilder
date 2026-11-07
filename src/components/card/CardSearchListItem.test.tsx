import { renderWithIntl } from "@/test/render-with-intl";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { CardSearchListItem } from "./CardSearchListItem";

vi.mock("@/components/collection/CollectionBadge", () => ({ CollectionBadge: () => null }));

const CARD: ScryfallCard = { id: "card-1", name: "Sol Ring", cmc: 1, type_line: "Artifact", color_identity: [] };

describe("CardSearchListItem", () => {
  it("adds a result to Considering without opening the card", () => {
    const onClick = vi.fn();
    const onAddToMaybeboard = vi.fn();
    renderWithIntl(
      <CardSearchListItem card={CARD} onClick={onClick} onAddToMaybeboard={onAddToMaybeboard} />,
      { locale: "en" }
    );

    fireEvent.click(screen.getByRole("button", { name: "Add Sol Ring to Considering" }));

    expect(onAddToMaybeboard).toHaveBeenCalledWith(CARD);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("still opens the card from the row itself", () => {
    const onClick = vi.fn();
    renderWithIntl(<CardSearchListItem card={CARD} onClick={onClick} onAddToMaybeboard={vi.fn()} />, { locale: "en" });

    fireEvent.click(screen.getByText("Sol Ring"));

    expect(onClick).toHaveBeenCalledWith(CARD);
  });

  it("shows no Considering action when the editor does not provide one", () => {
    renderWithIntl(<CardSearchListItem card={CARD} />, { locale: "en" });

    expect(screen.queryByRole("button", { name: /Considering/ })).toBeNull();
  });
});
