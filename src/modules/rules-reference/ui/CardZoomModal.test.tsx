/**
 * The card zoom as a dialog (master plan RR-05): what the shared `Modal` gives
 * it, focus in, focus back to the tile and the keyboard, and what it keeps from
 * the native dialog it replaced, the arrow-key navigation, the printings button
 * and the backdrop. The page suite (`GameChangersPageClient.test.tsx`) covers
 * the zoom inside the real page; this one drives the component alone through
 * the shared kit, from a tile-like trigger.
 */
import { useState } from "react";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CardZoomModal } from "./CardZoomModal";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { aScryfallCard } from "@/test/builders/scryfall";
import { renderWithIntl } from "@/test/render";

const SOL_RING = aScryfallCard({
  id: "sol-ring",
  name: "Sol Ring",
  type_line: "Artifact",
  image_uris: {
    grid: "https://cards.scryfall.io/normal/front/sol-ring.webp",
    display: "https://cards.scryfall.io/large/front/sol-ring.webp",
  },
});
const RHYSTIC_STUDY = aScryfallCard({
  id: "rhystic-study",
  name: "Rhystic Study",
  type_line: "Enchantment",
});
const PAGE: readonly ScryfallCard[] = [SOL_RING, RHYSTIC_STUDY];

/** A tile that opens the zoom of Sol Ring, as the page's `CardTile` does. */
function ZoomPage({ onOpenPrintings }: { onOpenPrintings?: () => void }) {
  const [zoomed, setZoomed] = useState<ScryfallCard | null>(null);
  return (
    <>
      <button type="button" onClick={() => setZoomed(SOL_RING)}>
        View Sol Ring
      </button>
      {zoomed && (
        <CardZoomModal
          card={zoomed}
          cards={PAGE}
          onClose={() => setZoomed(null)}
          onNavigate={setZoomed}
          onOpenPrintings={onOpenPrintings ?? (() => undefined)}
        />
      )}
    </>
  );
}

async function openZoom(onOpenPrintings?: () => void) {
  const user = userEvent.setup();
  renderWithIntl(<ZoomPage onOpenPrintings={onOpenPrintings} />);
  const tile = screen.getByRole("button", { name: "View Sol Ring" });
  await user.click(tile);
  return { user, tile };
}

const zoomOf = (name: string) =>
  screen.getByRole("dialog", { name: `${name} — zoom` });

describe("CardZoomModal", () => {
  it("opens as a dialog named after the card, with its display-size image, type and position", async () => {
    await openZoom();

    const zoom = zoomOf("Sol Ring");
    expect(within(zoom).getByRole("img", { name: "Sol Ring" })).toHaveAttribute(
      "src",
      "https://cards.scryfall.io/large/front/sol-ring.webp"
    );
    expect(within(zoom).getByText("Artifact")).toBeInTheDocument();
    expect(within(zoom).getByText("1 / 2")).toBeInTheDocument();
  });

  it("moves focus to its close button when it opens, and hides the page behind it", async () => {
    await openZoom();

    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    expect(
      screen.queryByRole("button", { name: "View Sol Ring" })
    ).not.toBeInTheDocument();
  });

  it("steps to the next and previous card with the arrow keys, stopping at both ends", async () => {
    const { user } = await openZoom();
    expect(screen.queryByRole("button", { name: "Previous card" })).toBeNull();

    await user.keyboard("{ArrowRight}");
    expect(zoomOf("Rhystic Study")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next card" })).toBeNull();

    await user.keyboard("{ArrowRight}");
    expect(zoomOf("Rhystic Study")).toBeInTheDocument();

    await user.keyboard("{ArrowLeft}");
    expect(zoomOf("Sol Ring")).toBeInTheDocument();

    await user.keyboard("{ArrowLeft}");
    expect(zoomOf("Sol Ring")).toBeInTheDocument();
  });

  it("steps with the side buttons too", async () => {
    const { user } = await openZoom();

    await user.click(screen.getByRole("button", { name: "Next card" }));
    expect(zoomOf("Rhystic Study")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous card" }));
    expect(zoomOf("Sol Ring")).toBeInTheDocument();
  });

  it("closes on Escape and gives focus back to the tile that opened it", async () => {
    const { user, tile } = await openZoom();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(tile).toHaveFocus());
  });

  it("closes with its close button and gives focus back to the tile", async () => {
    const { user, tile } = await openZoom();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(tile).toHaveFocus());
  });

  it("closes when the visitor presses the backdrop around the card", async () => {
    const { user } = await openZoom();

    await user.click(screen.getByRole("button", { name: "Close preview" }));

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps Tab inside the dialog", async () => {
    const { user } = await openZoom();

    await user.tab();
    expect(screen.getByRole("button", { name: "View all arts" })).toHaveFocus();
    await user.tab();
    await user.tab();
    await user.tab();
    // Past the last control, focus wraps to the first instead of leaving.
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it("asks for the card's printings from its 'View all arts' button", async () => {
    const onOpenPrintings = vi.fn();
    const { user } = await openZoom(onOpenPrintings);

    await user.click(screen.getByRole("button", { name: "View all arts" }));

    expect(onOpenPrintings).toHaveBeenCalledTimes(1);
  });

  it("draws no image for a card Scryfall lists none for", () => {
    renderWithIntl(
      <CardZoomModal
        card={RHYSTIC_STUDY}
        cards={PAGE}
        onClose={() => undefined}
        onNavigate={() => undefined}
        onOpenPrintings={() => undefined}
      />
    );

    const zoom = zoomOf("Rhystic Study");
    expect(within(zoom).queryByRole("img")).toBeNull();
    expect(within(zoom).getByText("2 / 2")).toBeInTheDocument();
  });
});
