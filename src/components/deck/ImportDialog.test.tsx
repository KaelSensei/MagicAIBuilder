import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/render-with-intl";
import { aScryfallCard } from "@/test/builders/scryfall";
import { aTextFile } from "@/test/builders/text-file";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImportDialog } from "./ImportDialog";
import { CardLookupError } from "@/lib/deck/card-lookup-error";
import { logger } from "@/lib/logger";

const addCard = vi.hoisted(() => vi.fn());
const fetchInBatches = vi.hoisted(() => vi.fn());

vi.mock(import("@/lib/deck/batch-fetch"), () => ({ fetchInBatches }));
vi.mock("@/lib/deck/store", () => ({
  useDeckStore: (select: (state: object) => unknown) => select({
    activeDeckId: "deck-1",
    addCard,
    setCommander: vi.fn(),
    setPartner: vi.fn(),
    setCompanion: vi.fn(),
  }),
}));
vi.mock(import("@/components/deck/ImportFromUrlTab"), () => ({
  ImportFromUrlTab: () => <></>,
}));

beforeEach(() => {
  addCard.mockClear();
  fetchInBatches.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

it("previews a pasted list before adding cards", async () => {
  fetchInBatches.mockResolvedValueOnce([]);
  renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />);

  fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), {
    target: { value: "Commander\n1 Atraxa, Praetors' Voice\n\nDeck\n2 Sol Ring\n\nSideboard\n1 Negate" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));

  expect(await screen.findByText("Commanders: Atraxa, Praetors' Voice")).toBeInTheDocument();
  expect(screen.getByText("Main 2 · Sideboard 1 · Maybeboard 0")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Import this preview" })).toBeInTheDocument();
  expect(fetchInBatches).toHaveBeenCalledOnce();
  expect(addCard).not.toHaveBeenCalled();
});

it("shows both commanders in a pasted-list preview", async () => {
  fetchInBatches.mockResolvedValueOnce([]);
  renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />);

  fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), {
    target: { value: "Commander\n1 Jaheira, Friend of the Forest\n1 Clan Crafter" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));

  expect(await screen.findByText("Commanders: Jaheira, Friend of the Forest, Clan Crafter")).toBeInTheDocument();
  expect(addCard).not.toHaveBeenCalled();
});

it("labels each preview row with its destination zone", async () => {
  fetchInBatches.mockResolvedValueOnce([]);
  renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />);

  fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), {
    target: { value: "Deck\n1 Sol Ring\nSideboard\n1 Negate\nConsidering\n1 Arcane Signet" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));

  expect(await screen.findByText("Preview ready — review before importing.")).toBeInTheDocument();
  expect(screen.getByText("1 × Sol Ring").closest("li")).toHaveTextContent("Main");
  expect(screen.getByText("1 × Negate").closest("li")).toHaveTextContent("Sideboard");
  expect(screen.getByText("1 × Arcane Signet").closest("li")).toHaveTextContent("Maybeboard");
  expect(addCard).not.toHaveBeenCalled();
});

it("labels a secondary-zone preview row in French", async () => {
  fetchInBatches.mockResolvedValueOnce([]);
  renderWithIntl(
    <ImportDialog open onOpenChange={vi.fn()} />,
    { locale: "fr" }
  );

  fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), {
    target: { value: "Sideboard\n1 Negate" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Prévisualiser la liste" }));

  expect(await screen.findByText("Réserve")).toBeInTheDocument();
  expect(screen.getByText("1 × Negate").closest("li")).toHaveTextContent("Réserve");
});

// WCAG 2.2 SC 1.3.1 and 4.1.2: the placeholder is an English sample list,
// not a label, so the text box carries its own name from the catalogue.
it("names the decklist text box for a screen reader", () => {
  renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />);

  expect(
    screen.getByRole("textbox", { name: "Decklist to import" })
  ).toHaveAttribute("placeholder", expect.stringContaining("Sol Ring"));
});

it("names the decklist text box in French", () => {
  renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />, {
    locale: "fr",
  });

  expect(
    screen.getByRole("textbox", { name: "Liste de deck à importer" })
  ).toBeInTheDocument();
});

it("discards a stale preview when the pasted list changes", async () => {
  fetchInBatches.mockResolvedValueOnce([]);
  renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />);

  const input = screen.getByPlaceholderText(/Atraxa, Praetors' Voice/);
  fireEvent.change(input, { target: { value: "1 Sol Ring" } });
  fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));
  expect(await screen.findByRole("button", { name: "Import this preview" })).toBeInTheDocument();

  fireEvent.change(input, { target: { value: "1 Arcane Signet" } });
  expect(screen.queryByRole("button", { name: "Import this preview" })).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Preview decklist" })).toBeInTheDocument();
});

it("reuses preview validation when the player confirms the import", async () => {
  fetchInBatches.mockResolvedValueOnce([{ name: "Sol Ring" }]);
  renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />);

  fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), {
    target: { value: "1 Sol Ring" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));
  expect(await screen.findByRole("button", { name: "Import this preview" })).toBeInTheDocument();
  expect(fetchInBatches).toHaveBeenCalledWith([{ name: "Sol Ring" }]);

  fireEvent.click(screen.getByRole("button", { name: "Import this preview" }));
  await waitFor(() => expect(screen.getByText(/Successfully imported/)).toBeInTheDocument());
  expect(fetchInBatches).toHaveBeenCalledOnce();
  expect(addCard).toHaveBeenCalledOnce();
});

it("shows unresolved names before confirmation without changing the deck", async () => {
  fetchInBatches.mockResolvedValueOnce([{ name: "Sol Ring" }]);
  renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />);

  fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), {
    target: { value: "1 Sol Ring\n1 Definitely Not A Card" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));

  expect(await screen.findByText("Definitely Not A Card")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Cards not found in Scryfall (1):");
  expect(addCard).not.toHaveBeenCalled();
});

it("does not confirm a pasted list when no card resolves", async () => {
  fetchInBatches.mockResolvedValueOnce([]);
  renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />);

  fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), {
    target: { value: "1 Definitely Not A Card" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));

  expect(await screen.findByText("Definitely Not A Card")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Import this preview" })).toBeDisabled();
  expect(addCard).not.toHaveBeenCalled();
});

it("shows duplicate card decisions before confirming a pasted list", async () => {
  fetchInBatches.mockResolvedValueOnce([{ name: "Sol Ring" }]);
  renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />);

  fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), {
    target: { value: "1 Sol Ring\n1 sol ring" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));

  expect(await screen.findByText("Duplicate decisions: Sol Ring")).toBeInTheDocument();
  expect(addCard).not.toHaveBeenCalled();
});

it("flags a commander repeated in the pasted main deck", async () => {
  fetchInBatches.mockResolvedValueOnce([{ name: "Atraxa, Praetors' Voice" }]);
  renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />);

  fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), {
    target: { value: "Commander\n1 Atraxa, Praetors' Voice\nDeck\n1 Atraxa, Praetors' Voice" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));

  expect(await screen.findByText("Duplicate decisions: Atraxa, Praetors' Voice")).toBeInTheDocument();
});

it("ignores a validation result that arrives after the dialog closes", async () => {
  let finishValidation: ((cards: { name: string }[]) => void) | undefined;
  fetchInBatches.mockReturnValueOnce(new Promise((resolve) => {
    finishValidation = resolve;
  }));

  function DialogHarness() {
    const [open, setOpen] = useState(true);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>Open import</button>
        <ImportDialog open={open} onOpenChange={setOpen} />
      </>
    );
  }

  renderWithIntl(<DialogHarness />);
  fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), {
    target: { value: "1 Sol Ring" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    finishValidation?.([{ name: "Sol Ring" }]);
  });
  fireEvent.click(screen.getByRole("button", { name: "Open import" }));

  expect(screen.queryByRole("button", { name: "Import this preview" })).not.toBeInTheDocument();
});

it.each([
  ["en", "Close"],
  ["fr", "Fermer"],
] as const)("names the header close button in %s", (locale, name) => {
  renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />, { locale });

  expect(screen.getByRole("button", { name })).toBeInTheDocument();
});

describe("importing decklist files", () => {
  const FIXTURES = join(process.cwd(), "src/lib/import/fixtures/decklist-files");

  function fixtureFile(name: string): File {
    return aTextFile(name, readFileSync(join(FIXTURES, name), "utf8"));
  }

  it("fills the text from an MTGO .dek file and previews its main deck and sideboard", async () => {
    fetchInBatches.mockImplementationOnce(async (names: readonly { name: string }[]) =>
      names.map(({ name }) => aScryfallCard({ name }))
    );
    renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />);

    await userEvent.upload(screen.getByLabelText("Decklist files"), fixtureFile("burn-56-main-4-side.dek"));

    expect(await screen.findByText("Read burn-56-main-4-side.dek as an MTGO .dek file, 20 lines.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/)).toHaveDisplayValue(
      /^Deck\n4 Lightning Bolt\n[\s\S]*\nSideboard\n1 Smash to Smithereens\n/
    );
    fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));

    expect(await screen.findByText("Main 56 · Sideboard 4 · Maybeboard 0")).toBeInTheDocument();
    expect(screen.getByText("4 × Lightning Bolt").closest("li")).toHaveTextContent("Main");
    for (const name of ["Smash to Smithereens", "Path to Exile", "Kor Firewalker", "Deflecting Palm"]) {
      expect(screen.getByText(`1 × ${name}`).closest("li")).toHaveTextContent("Sideboard");
    }
    expect(screen.queryByText(/Commanders:/)).not.toBeInTheDocument();
    expect(addCard).not.toHaveBeenCalled();
  });

  it("fills the text from a text file as if it were pasted, and says how it was read", async () => {
    const atraxa = ["Commander", "1 Atraxa, Praetors' Voice", "Deck"];
    const cards = Array.from({ length: 97 }, (_, index) => `1 Card ${index + 1}`);
    renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />);

    await userEvent.upload(screen.getByLabelText("Decklist files"), aTextFile("atraxa.txt", [...atraxa, ...cards].join("\n")));

    expect(await screen.findByText("Read atraxa.txt as a text decklist, 100 lines.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/)).toHaveDisplayValue(/^Commander\n1 Atraxa/);
    expect(screen.getByRole("button", { name: "Preview decklist" })).toBeEnabled();
  });

  it("replaces the text the box held, and says so", async () => {
    renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />);
    const textBox = screen.getByPlaceholderText(/Atraxa, Praetors' Voice/);
    fireEvent.change(textBox, { target: { value: "1 Island" } });

    await userEvent.upload(screen.getByLabelText("Decklist files"), aTextFile("ramp.txt", "1 Sol Ring"));

    expect(
      await screen.findByText("Read ramp.txt as a text decklist, 1 line. The files' text replaced what the box held.")
    ).toBeInTheDocument();
    expect(textBox).toHaveDisplayValue("1 Sol Ring");
  });

  it("keeps a quoted CSV name holding a comma as one card", async () => {
    fetchInBatches.mockImplementationOnce(async (names: readonly { name: string }[]) =>
      names.map(({ name }) => aScryfallCard({ name }))
    );
    renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />);

    await userEvent.upload(screen.getByLabelText("Decklist files"), fixtureFile("quoted-names.csv"));
    expect(await screen.findByText("Read quoted-names.csv as a CSV file, 7 lines.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));

    expect(await screen.findByText("1 × Jace, the Mind Sculptor")).toBeInTheDocument();
    expect(screen.getByText("2 × Fire // Ice").closest("li")).toHaveTextContent("Sideboard");
    expect(screen.getByText("1 × Kozilek, the Great Distortion").closest("li")).toHaveTextContent("Maybeboard");
  });

  it("joins a main-deck file and a sideboard file in the order chosen and names each", async () => {
    renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />);

    await userEvent.upload(screen.getByLabelText("Decklist files"), [
      aTextFile("main.txt", "4 Brainstorm"),
      aTextFile("side.csv", "Qty,Name,Board\n2,Negate,Sideboard"),
    ]);

    expect(
      await screen.findByText("Read main.txt as a text decklist, 1 line. Read side.csv as a CSV file, 2 lines.")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/)).toHaveDisplayValue("4 Brainstorm\nSideboard\n2 Negate");
  });

  it("lists an unreadable line with its file and line number", async () => {
    renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />);

    await userEvent.upload(screen.getByLabelText("Decklist files"), aTextFile("burn.csv", "Count,Name\n4,Lightning Bolt\nfour,Lava Spike"));

    expect(
      await screen.findByText(
        "Read burn.csv as a CSV file, 2 lines. Could not read 1 line: burn.csv, line 3 (“four,Lava Spike”)."
      )
    ).toBeInTheDocument();
  });

  describe("refusals leave the text box as it was", () => {
    async function chooseAfterTyping(files: File | File[]) {
      renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />);
      fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), { target: { value: "1 Island" } });
      // `accept` only filters the chooser's default view: a player can still pick "All files".
      await userEvent.setup({ applyAccept: false }).upload(screen.getByLabelText("Decklist files"), files);
    }

    it("refuses unknown CSV headers and names the accepted columns", async () => {
      await chooseAfterTyping(aTextFile("cards.csv", "Card,Copies\nSol Ring,1"));

      expect(
        await screen.findByText(
          "cards.csv has no column the import knows. Quantity: Count, Quantity, Qty or Amount. Name: Name or Card Name. Zone, optional: Board or Section. The text box was not changed."
        )
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/)).toHaveDisplayValue("1 Island");
    });

    it("refuses an eleventh file", async () => {
      await chooseAfterTyping(Array.from({ length: 11 }, (_, index) => aTextFile(`${index}.txt`, "1 Sol Ring")));

      expect(
        await screen.findByText("Choose at most 10 files at once; you chose 11. The text box was not changed.")
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/)).toHaveDisplayValue("1 Island");
    });

    it("refuses a file over 1 MB before reading it", async () => {
      const read = vi.fn();
      await chooseAfterTyping(aTextFile("huge.txt", "x".repeat(1_000_001), { onRead: read }));

      expect(
        await screen.findByText("huge.txt is larger than 1 MB, so it was not read. The text box was not changed.")
      ).toBeInTheDocument();
      expect(read).not.toHaveBeenCalled();
    });

    it("refuses a decklist over 500 lines and states the limit", async () => {
      await chooseAfterTyping(aTextFile("long.txt", Array.from({ length: 501 }, () => "1 Island").join("\n")));

      expect(
        await screen.findByText("The decklist has 501 lines; the import reads at most 500. The text box was not changed.")
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/)).toHaveDisplayValue("1 Island");
    });

    it("refuses a .pdf by name", async () => {
      await chooseAfterTyping(aTextFile("deck.pdf", "%PDF-1.7"));

      expect(
        await screen.findByText("deck.pdf is not a .txt, .dek or .csv file. The text box was not changed.")
      ).toBeInTheDocument();
    });

    it("keeps the preview already shown when a file is refused", async () => {
      fetchInBatches.mockResolvedValueOnce([aScryfallCard({ name: "Island" })]);
      renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />);
      fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), { target: { value: "1 Island" } });
      fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));
      expect(await screen.findByRole("button", { name: "Import this preview" })).toBeInTheDocument();

      await userEvent.setup({ applyAccept: false }).upload(screen.getByLabelText("Decklist files"), aTextFile("deck.pdf", "%PDF"));

      expect(await screen.findByText(/deck\.pdf is not a \.txt/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Import this preview" })).toBeEnabled();
    });

    it("refuses a .dek file that holds no Cards element", async () => {
      await chooseAfterTyping(aTextFile("notes.dek", "1 Lightning Bolt"));

      expect(
        await screen.findByText("notes.dek is not an MTGO .dek deck: it has no Cards element. The text box was not changed.")
      ).toBeInTheDocument();
    });
  });

  it("says how a file was read in French", async () => {
    renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />, { locale: "fr" });

    await userEvent.upload(screen.getByLabelText("Fichiers de liste de deck"), aTextFile("liste.txt", "1 Sol Ring\n2 Island"));

    expect(await screen.findByText("liste.txt lu comme liste en texte, 2 lignes.")).toBeInTheDocument();
  });
});

it("says the card lookup did not answer when Scryfall fails, instead of the browser's own words", async () => {
  fetchInBatches.mockRejectedValueOnce(
    new CardLookupError(new DOMException("signal timed out", "TimeoutError"))
  );
  renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />);

  fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), {
    target: { value: "1 Sol Ring" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));

  expect(
    await screen.findByText(
      "The card lookup did not answer. Nothing was imported; try again."
    )
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Preview decklist" })
  ).toBeEnabled();
  expect(addCard).not.toHaveBeenCalled();
});

// The real `fetchInBatches` wraps every failure in a CardLookupError, so only
// a fault in the dialog's own code reaches this; the player still reads no
// exception text (I-01).
it("says the card lookup did not answer when the preview throws anything else, in French", async () => {
  vi.spyOn(logger, "error").mockImplementation(() => undefined);
  fetchInBatches.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />, {
    locale: "fr",
  });

  fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), {
    target: { value: "1 Sol Ring" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Prévisualiser la liste" })
  );

  expect(
    await screen.findByText(
      "La recherche des cartes n’a pas répondu. Rien n’a été importé ; réessayez."
    )
  ).toBeInTheDocument();
  expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument();
});

// The real store catches every failed write and raises its own toast
// (ImportDialog.failure.test.tsx), so only a fault reaches this; the player
// still reads no exception text (I-01).
it("says the import failed when adding the cards throws, with none of the thrown text", async () => {
  vi.spyOn(logger, "error").mockImplementation(() => undefined);
  fetchInBatches.mockResolvedValueOnce([aScryfallCard({ name: "Sol Ring" })]);
  addCard.mockRejectedValueOnce(new Error("[addCard] HTTP 500: boom"));
  renderWithIntl(<ImportDialog open onOpenChange={vi.fn()} />);

  fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), {
    target: { value: "1 Sol Ring" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "Import this preview" })
  );

  expect(await screen.findByText("Failed to import cards.")).toBeInTheDocument();
  expect(screen.queryByText(/HTTP 500|boom/)).not.toBeInTheDocument();
});
