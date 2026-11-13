/**
 * Characterization of what the search grid renders for a double-faced card (master plan CC-01).
 *
 * `CardGrid` builds the two faces itself (`buildDfcFaces`) and hands them to `CardImage`, which
 * renders `CardFlip`. These tests pin the surface a player sees, so that CC-04 can move the face
 * mapping into one `lib/scryfall/faces.ts` without changing it. The collection badge and the
 * quick-add button are out of scope here: the collection store is empty and the viewer is a
 * guest, so both render nothing.
 *
 * The transform, modal and split cards are the recorded catalog fixtures; the expected URLs are
 * written out so a test reads as what the player's browser requests.
 *
 * @module components/card/CardGrid.test
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { RECORDED_CATALOG_CARDS } from "@/lib/scryfall/fixtures/catalog-cards-v1";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { aScryfallCard } from "@/test/builders/scryfall";
import { renderWithProviders } from "@/test/render";
import { CardGrid } from "./CardGrid";

/** Delver of Secrets // Insectile Aberration: a transform card (CR 712.1). */
const DELVER: ScryfallCard = RECORDED_CATALOG_CARDS.transform;
/** Valakut Awakening // Valakut Stoneforge: a modal double-faced card with a land back (CR 712.3). */
const VALAKUT: ScryfallCard = RECORDED_CATALOG_CARDS.modalDoubleFaced;
/** Fire // Ice: a split card (CR 709.1), two faces on one side, so no flip. */
const FIRE_ICE: ScryfallCard = RECORDED_CATALOG_CARDS.split;

const DELVER_FRONT_GRID =
  "https://cards.scryfall.io/grid/front/6/9/6904ea20-e504-47da-95a0-08739fdde260.webp?1783908173";
const DELVER_BACK_GRID =
  "https://cards.scryfall.io/grid/back/6/9/6904ea20-e504-47da-95a0-08739fdde260.webp?1783908173";
const FIRE_ICE_GRID =
  "https://cards.scryfall.io/grid/front/1/8/18303862-4726-4136-814f-157aa7006579.webp?1783918420";

/** Renders the grid for a guest with an empty collection; returns the click spy. */
function renderGrid(cards: readonly ScryfallCard[]) {
  const onCardClick = vi.fn();
  renderWithProviders(<CardGrid cards={cards} onCardClick={onCardClick} />, {
    session: null,
  });
  return onCardClick;
}

describe("CardGrid — a double-faced card", () => {
  it("shows the front face's own grid image, named after the face and not the card", () => {
    renderGrid([DELVER]);

    expect(screen.getByAltText("Delver of Secrets")).toHaveAttribute(
      "src",
      DELVER_FRONT_GRID
    );
    expect(
      screen.queryByAltText("Delver of Secrets // Insectile Aberration")
    ).toBeNull();
    expect(
      screen.queryByText("Delver of Secrets // Insectile Aberration")
    ).toBeNull();
  });

  it("mounts the back face behind the front, hidden from assistive technology", () => {
    renderGrid([DELVER]);

    const back = screen.getByAltText("Insectile Aberration");
    expect(back).toHaveAttribute("src", DELVER_BACK_GRID);
    expect(back.closest("[aria-hidden]")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });

  it("offers one flip control named after the hidden face; the add button follows the shown face", () => {
    const onCardClick = renderGrid([DELVER]);
    expect(
      screen.getByRole("button", { name: "Add Delver of Secrets to deck" })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Turn over: Insectile Aberration" })
    );

    expect(
      screen.getByRole("button", { name: "Show front: Delver of Secrets" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Insectile Aberration to deck" })
    ).toBeInTheDocument();
    expect(onCardClick).not.toHaveBeenCalled();
  });

  it("adds the whole card, not the shown face, when the flipped card is clicked", () => {
    const onCardClick = renderGrid([DELVER]);
    fireEvent.click(
      screen.getByRole("button", { name: "Turn over: Insectile Aberration" })
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Add Insectile Aberration to deck" })
    );

    expect(onCardClick).toHaveBeenCalledTimes(1);
    expect(onCardClick).toHaveBeenCalledWith(DELVER);
  });

  it("marks a transform card as double-faced and a modal card with a land back as a flexible land", () => {
    renderGrid([DELVER, VALAKUT]);

    expect(screen.getByTitle("Double-faced card")).toHaveTextContent(/^△▽$/);
    expect(screen.getByTitle("Flexible land (MDFC)")).toHaveTextContent(
      /^△▽ LAND$/
    );
  });

  it("marks a modal card whose back is a spell as plain double-faced", () => {
    const spellBothSides = aScryfallCard({
      layout: "modal_dfc",
      card_faces: [
        { name: "Front spell", type_line: "Instant" },
        { name: "Back spell", type_line: "Sorcery" },
      ],
    });

    renderGrid([spellBothSides]);

    expect(screen.getByTitle("Double-faced card")).toBeInTheDocument();
    expect(screen.queryByTitle("Flexible land (MDFC)")).toBeNull();
  });

  it("builds each face's image from the card id and its side when a face lists no images", () => {
    const bareFaces = aScryfallCard({
      id: "0f0f0f0f-0000-4000-8000-000000000002",
      layout: "transform",
      card_faces: [{ name: "Front" }, { name: "Back" }],
    });

    renderGrid([bareFaces]);

    expect(screen.getByAltText("Front")).toHaveAttribute(
      "src",
      "https://cards.scryfall.io/grid/front/0/f/0f0f0f0f-0000-4000-8000-000000000002.webp"
    );
    expect(screen.getByAltText("Back")).toHaveAttribute(
      "src",
      "https://cards.scryfall.io/grid/back/0/f/0f0f0f0f-0000-4000-8000-000000000002.webp"
    );
  });

  it("shows a split card, which has faces but no double-faced layout, as one image named after the card", () => {
    renderGrid([FIRE_ICE]);

    expect(screen.getByAltText("Fire // Ice")).toHaveAttribute(
      "src",
      FIRE_ICE_GRID
    );
    expect(screen.queryByRole("button", { name: /^Turn over:/ })).toBeNull();
    expect(screen.queryByTitle("Double-faced card")).toBeNull();
  });
});
