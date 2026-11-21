/**
 * The export dialog's Registration sheet row: the player prints the decklist
 * registration sheet, or downloads it as an `.html` file, in their locale
 * (I-50, thirteenth-pass scope line).
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Deck } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { renderWithProviders } from "@/test/render";
import { ExportModal } from "./ExportModal";

const DECK: Deck = aDeck({
  name: "Minsc & Boo",
  commander: aDeckCard({ id: "cmd", name: "Minsc & Boo, Timeless Heroes" }),
  cards: [
    aDeckCard({ id: "c1", name: "Sol Ring" }),
    aDeckCard({ id: "c2", name: "Counterspell", zone: "maybeboard" }),
  ],
});

/** The text of each document the browser was asked to print. */
function recordPrints(): string[] {
  const printed: string[] = [];
  const append = document.body.append.bind(document.body);
  vi.spyOn(document.body, "append").mockImplementation((...nodes) => {
    append(...nodes);
    for (const node of nodes) {
      if (!(node instanceof HTMLIFrameElement)) continue;
      const view = node.contentWindow;
      if (!view) continue;
      vi.spyOn(view, "print").mockImplementation(() => {
        printed.push(view.document.body.textContent ?? "");
      });
    }
  });
  return printed;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ExportModal registration sheet", () => {
  it("offers to print and to download the registration sheet", () => {
    renderWithProviders(<ExportModal deck={DECK} onClose={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "Print registration sheet" })
    ).toBeInTheDocument();
    expect(
      screen.getByTitle("Download Registration sheet file")
    ).toBeInTheDocument();
  });

  it("downloads the sheet as an .html file named after the deck", async () => {
    const user = userEvent.setup();
    const saved: string[] = [];
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: (blob: Blob) => {
        saved.push(blob.type);
        return "blob:registration-sheet";
      },
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      saved.push(this.download);
    });
    renderWithProviders(<ExportModal deck={DECK} onClose={vi.fn()} />);

    await user.click(screen.getByTitle("Download Registration sheet file"));

    expect(saved).toEqual(["text/html", "minsc___boo_registration.html"]);
  });

  it("prints the sheet alone, in the player's language", async () => {
    const user = userEvent.setup();
    const printed = recordPrints();
    renderWithProviders(<ExportModal deck={DECK} onClose={vi.fn()} />, {
      locale: "fr",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Imprimer la feuille d’inscription",
      })
    );

    expect(printed).toHaveLength(1);
    expect(printed[0]).toContain("Feuille d’inscription de decklist");
    expect(printed[0]).toContain("Commandant");
    expect(printed[0]).toContain("1 Minsc & Boo, Timeless Heroes");
    expect(printed[0]).not.toContain("Counterspell");
  });

  it("names the Considering card the sheet leaves out", () => {
    renderWithProviders(<ExportModal deck={DECK} onClose={vi.fn()} />);

    expect(
      screen.getByText("Registration sheet leaves out 1 card")
    ).toBeInTheDocument();
  });
});
