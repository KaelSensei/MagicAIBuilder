import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { renderWithProviders } from "@/test/render";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useUIStore } from "@/lib/ui/store";
import type { Deck, DeckCard } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { ExportModal } from "./ExportModal";

const NO_RESULTS: ScryfallCard[] = [];
const ignoreCard = (): void => undefined;

/** A creature row named after its id, so the exported text tells the rows apart. */
function makeCard(id: string): DeckCard {
  return aDeckCard({
    id,
    scryfallId: id,
    name: `Card ${id}`,
    category: "creature",
    cmc: 1,
    typeLine: "Creature",
  });
}

const DECK: Deck = aDeck({
  name: "Kenrith Goodstuff",
  commander: makeCard("cmd"),
  cards: [makeCard("c1"), makeCard("c2")],
  cardCount: 3,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
});

/**
 * The builder's wiring around the export dialog: the UI store opens it, and
 * the page-wide shortcut listener also reacts to Escape.
 */
function BuilderExport() {
  useKeyboardShortcuts({ searchResults: NO_RESULTS, onAddCard: ignoreCard });
  const showExport = useUIStore((s) => s.showExportModal);
  const setShowExport = useUIStore((s) => s.setShowExportModal);
  return (
    <>
      <button type="button" onClick={() => setShowExport(true)}>
        Export
      </button>
      {showExport && (
        <ExportModal deck={DECK} onClose={() => setShowExport(false)} />
      )}
    </>
  );
}

/** Renders the builder's export wiring and opens Export from its button. */
async function openExport() {
  const user = userEvent.setup();
  renderWithProviders(<BuilderExport />);
  const exportTrigger = screen.getByRole("button", { name: "Export" });
  await user.click(exportTrigger);
  return { user, exportTrigger };
}

/** Opens the proxy sheet dialog on top of Export, as the player does. */
async function openProxyOverExport() {
  const { user, exportTrigger } = await openExport();
  const proxyTrigger = screen.getByRole("button", {
    name: /Export Proxy Sheets/,
  });
  await user.click(proxyTrigger);
  return { user, exportTrigger, proxyTrigger };
}

describe("ExportModal", () => {
  beforeEach(() => {
    useUIStore.setState({
      showExportModal: false,
      showKeyboardModal: false,
      showImportModal: false,
    });
  });

  it("is a modal dialog named by its title", async () => {
    await openExport();

    expect(
      screen.getByRole("dialog", { name: "Export Options" })
    ).toBeInTheDocument();
    // Modal: the builder behind leaves the accessibility tree while it is open.
    expect(
      screen.queryByRole("button", { name: "Export" })
    ).not.toBeInTheDocument();
  });

  it("closes only the proxy dialog when Escape is pressed over it", async () => {
    const { user, proxyTrigger } = await openProxyOverExport();
    expect(
      screen.getByRole("dialog", { name: "Export Proxy Sheets" })
    ).toBeInTheDocument();
    const searchClears = useUIStore.getState().searchClearSignal;

    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("dialog", { name: "Export Proxy Sheets" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Export Options" })
    ).toBeInTheDocument();
    // The page-wide shortcut must not treat the consumed Escape as its own.
    expect(useUIStore.getState().showExportModal).toBe(true);
    expect(useUIStore.getState().searchClearSignal).toBe(searchClears);
    await waitFor(() => expect(proxyTrigger).toHaveFocus());
  });

  it("closes Export on the next Escape and returns focus to the builder's Export button", async () => {
    const { user, exportTrigger } = await openProxyOverExport();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Export Proxy Sheets/ })
      ).toHaveFocus()
    );

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(useUIStore.getState().showExportModal).toBe(false);
    await waitFor(() => expect(exportTrigger).toHaveFocus());
  });
});
