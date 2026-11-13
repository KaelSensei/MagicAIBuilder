/**
 * Characterization suite for the playtest action log, written before its split
 * (master plan PT-07). It pins what `PlaytestActionLog.test.tsx` leaves thin:
 * the export file names and contents, the composer's keyboard paths, the row's
 * save and cancel paths, the mana form's bounds, and when each filter row
 * shows. The behaviour pinned here is today's; the file-stem rule that
 * dropped an accented letter was fixed (B2) and its test now reads the fix.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import type { PlaytestActionLogEntry } from "@/lib/playtest/engine";
import { PlaytestActionLog } from "./PlaytestActionLog";

/** What the download link looked like at the moment it was clicked. */
interface SavedFile {
  readonly name: string;
  readonly blob: Blob;
}

let createObjectURL: ReturnType<typeof vi.fn>;
let saved: SavedFile[];

beforeEach(() => {
  saved = [];
  createObjectURL = vi.fn().mockReturnValue("blob:playtest-log");
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: createObjectURL,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    const blob: unknown = createObjectURL.mock.calls.at(-1)?.[0];
    if (!(blob instanceof Blob)) throw new Error("No Blob was created");
    saved.push({ name: this.download, blob });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** @returns the one file the test saved; throws when none or several were */
function savedFile(): SavedFile {
  const [file, ...others] = saved;
  if (file === undefined || others.length > 0) {
    throw new Error(`Expected one saved file, got ${saved.length}`);
  }
  return file;
}

function readText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

const ONE_ENTRY: readonly PlaytestActionLogEntry[] = [
  { id: 1, turn: 2, phase: "Main1", description: "Made mana" },
];

function renderLog(
  entries: readonly PlaytestActionLogEntry[],
  overrides: Partial<Parameters<typeof PlaytestActionLog>[0]> = {}
) {
  const handlers = {
    onAdd: vi.fn(),
    onEdit: vi.fn(),
    onRemove: vi.fn(),
  };
  renderWithIntl(
    <PlaytestActionLog
      deckName="Test"
      entries={entries}
      {...handlers}
      {...overrides}
    />
  );
  return handlers;
}

describe("PlaytestActionLog export files (characterization)", () => {
  it("saves the text log under the deck name with punctuation and spaces folded to hyphens", async () => {
    renderLog(ONE_ENTRY, { deckName: "  My Deck! v2 " });

    fireEvent.click(screen.getByRole("button", { name: "Text" }));

    const file = savedFile();
    expect(file.name).toBe("My-Deck-v2-playtest.txt");
    expect(file.blob.type).toBe("text/plain");
    await expect(readText(file.blob)).resolves.toBe(
      "  My Deck! v2  — Action log\n\nTurn 2\n- Main 1: Made mana"
    );
  });

  it("saves the JSON log as version 3 under the same stem", async () => {
    renderLog(ONE_ENTRY, { deckName: "My Deck" });

    fireEvent.click(screen.getByRole("button", { name: "JSON" }));

    const file = savedFile();
    expect(file.name).toBe("My-Deck-playtest.json");
    expect(file.blob.type).toBe("application/json");
    const parsed: unknown = JSON.parse(await readText(file.blob));
    expect(parsed).toEqual({
      version: 3,
      deckName: "My Deck",
      turns: [
        {
          turn: 2,
          entries: ONE_ENTRY,
          draws: 0,
          manaProduced: 0,
          cardsSeen: 0,
          lifeDelta: 0,
          countersChanged: 0,
        },
      ],
    });
  });

  it("falls back to the stem 'deck' when nothing of the name survives", () => {
    renderLog(ONE_ENTRY, { deckName: "!!!" });

    fireEvent.click(screen.getByRole("button", { name: "Text" }));

    expect(savedFile().name).toBe("deck-playtest.txt");
  });

  it("keeps the case of the name and an accented letter as its base letter in the stem (B2)", () => {
    renderLog(ONE_ENTRY, { deckName: "Ürza's Saga" });

    fireEvent.click(screen.getByRole("button", { name: "JSON" }));

    expect(savedFile().name).toBe("Urza-s-Saga-playtest.json");
  });

  it("hides the copy and export buttons while the log is empty", () => {
    renderLog([]);

    expect(
      screen.queryByRole("button", { name: "Copy log" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Text" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "JSON" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Actions will appear here as you play.")
    ).toBeInTheDocument();
  });

  it("confirms a copy in a status line", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    renderLog(ONE_ENTRY);

    fireEvent.click(screen.getByRole("button", { name: "Copy log" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Log copied")
    );
  });
});

describe("PlaytestActionLog composer (characterization)", () => {
  it("adds the draft on Enter and clears the field", () => {
    const { onAdd } = renderLog([]);
    const input = screen.getByLabelText(/record a manual action/i);

    fireEvent.change(input, { target: { value: "Tapped a land" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onAdd).toHaveBeenCalledWith("Tapped a land");
    expect(input).toHaveValue("");
  });

  it("ignores a blank draft", () => {
    const { onAdd } = renderLog([]);

    fireEvent.change(screen.getByLabelText(/record a manual action/i), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: /add action/i }));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("shows the mana form only when the game records mana", () => {
    renderLog([]);

    expect(screen.queryByLabelText("Mana amount")).not.toBeInTheDocument();
  });

  it("refuses a mana amount outside 1 to 100 or not a whole number", () => {
    const onRecordMana = vi.fn();
    renderLog([], { onRecordMana });
    const amount = screen.getByLabelText("Mana amount");
    const record = screen.getByRole("button", { name: "Record mana" });

    expect(record).toBeEnabled();
    for (const value of ["0", "101", "1.5", ""]) {
      fireEvent.change(amount, { target: { value } });
      expect(record, `amount ${JSON.stringify(value)}`).toBeDisabled();
    }
    fireEvent.change(amount, { target: { value: "100" } });
    expect(record).toBeEnabled();
    fireEvent.click(record);
    expect(onRecordMana).toHaveBeenCalledWith(100);
  });
});

describe("PlaytestActionLog rows (characterization)", () => {
  it("lists the newest action first", () => {
    renderLog([
      { id: 1, turn: 1, phase: "Draw", description: "First" },
      { id: 2, turn: 1, phase: "Main1", description: "Second" },
      { id: 3, turn: 2, phase: "Draw", description: "Third" },
    ]);

    const rows = screen.getAllByRole("listitem").map((row) => row.textContent);
    expect(rows).toEqual([
      expect.stringContaining("Third"),
      expect.stringContaining("Second"),
      expect.stringContaining("First"),
    ]);
  });

  it("saves an edited action when the field loses focus", () => {
    const { onEdit } = renderLog(ONE_ENTRY);

    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
    const input = screen.getByLabelText(/edit action/i);
    fireEvent.change(input, { target: { value: "Made two mana" } });
    fireEvent.blur(input);

    expect(onEdit).toHaveBeenCalledWith(1, "Made two mana");
    expect(screen.queryByLabelText(/edit action/i)).not.toBeInTheDocument();
  });

  it("keeps editing instead of saving a blank description", () => {
    const { onEdit } = renderLog(ONE_ENTRY);

    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
    const input = screen.getByLabelText(/edit action/i);
    fireEvent.change(input, { target: { value: "  " } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/edit action/i)).toBeInTheDocument();
  });

  it("starts an edit with the current description in the field", () => {
    renderLog(ONE_ENTRY);

    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));

    expect(screen.getByLabelText(/edit action/i)).toHaveValue("Made mana");
  });
});

describe("PlaytestActionLog filters (characterization)", () => {
  it("shows no turn or phase filter while the log covers one turn and one phase", () => {
    renderLog(ONE_ENTRY);

    expect(
      screen.queryByRole("button", { name: "Turn 2" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "All phases" })
    ).not.toBeInTheDocument();
  });

  it("offers the phases of the selected turn only", () => {
    renderLog([
      { id: 1, turn: 1, phase: "Draw", description: "First draw" },
      { id: 2, turn: 1, phase: "Main1", description: "First spell" },
      { id: 3, turn: 2, phase: "Combat", description: "Attack" },
      { id: 4, turn: 2, phase: "Main2", description: "Second spell" },
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Turn 2" }));

    expect(screen.getByRole("button", { name: "Combat" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Main 2" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Draw" })
    ).not.toBeInTheDocument();
  });

  it("hides the turn evidence while every action is a free-form note", () => {
    renderLog([
      { id: 1, turn: 1, phase: "Draw", description: "A note" },
      { id: 2, turn: 2, phase: "Draw", description: "Another note" },
    ]);

    expect(screen.queryByLabelText("Turn evidence")).not.toBeInTheDocument();
  });
});
