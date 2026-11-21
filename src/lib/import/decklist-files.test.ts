import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseTextDecklist } from "@/lib/deck/import";
import {
  DECKLIST_FILE_LIMITS,
  checkDecklistFileChoice,
  readDecklistFile,
  readDecklistFiles,
} from "./decklist-files";

/**
 * The pure side of the file import (I-62 slice 1's text adapter, for one
 * deck): a file's name and text in, decklist text and problems out.
 */

const FIXTURES = join(__dirname, "fixtures/decklist-files");

function fixture(name: string): string {
  return readFileSync(join(FIXTURES, name), "utf8");
}

function lines(count: number): string {
  return Array.from({ length: count }, (_, index) => `1 Card ${index + 1}`).join("\n");
}

describe("checkDecklistFileChoice", () => {
  it("accepts up to ten .txt, .dek and .csv files of at most 1 MB, whatever the extension's case", () => {
    const files = ["a.txt", "b.DEK", "c.Csv", ...Array.from({ length: 7 }, (_, i) => `${i}.txt`)].map((name) => ({
      name,
      size: DECKLIST_FILE_LIMITS.maxBytes,
    }));

    expect(checkDecklistFileChoice(files)).toEqual([]);
  });

  it("refuses an eleventh file", () => {
    const files = Array.from({ length: 11 }, (_, i) => ({ name: `${i}.txt`, size: 10 }));

    expect(checkDecklistFileChoice(files)).toEqual([{ kind: "too-many-files", count: 11 }]);
  });

  it("refuses, by name, a file over 1 MB and a file of another type", () => {
    expect(
      checkDecklistFileChoice([
        { name: "huge.txt", size: DECKLIST_FILE_LIMITS.maxBytes + 1 },
        { name: "deck.pdf", size: 10 },
        { name: "no-extension", size: 10 },
      ])
    ).toEqual([
      { kind: "file-too-large", file: "huge.txt" },
      { kind: "unsupported-extension", file: "deck.pdf" },
      { kind: "unsupported-extension", file: "no-extension" },
    ]);
  });
});

describe("readDecklistFile — text", () => {
  it("keeps a text file as written, without its byte-order mark, CRLF endings or trailing blank lines", () => {
    const read = readDecklistFile("atraxa.txt", "﻿Commander\r\n1 Atraxa, Praetors' Voice\r\n\r\nDeck\r\n1 Sol Ring\r\n\r\n");

    expect(read).toEqual({
      ok: true,
      format: "text",
      text: "Commander\n1 Atraxa, Praetors' Voice\n\nDeck\n1 Sol Ring",
      lineCount: 5,
      problems: [],
    });
  });

  it("lists a line with no letter by its line number, but not comments or the 99 heading", () => {
    const read = readDecklistFile("list.txt", "// Main\n99\n1 Sol Ring\n----\n# Lands\n4");

    expect(read.ok && read.problems).toEqual([
      { line: 4, content: "----" },
      { line: 6, content: "4" },
    ]);
  });
});

describe("readDecklistFile — MTGO .dek", () => {
  it("turns each Cards element into a line and puts the sideboard under its heading, guessing no commander", () => {
    const read = readDecklistFile("burn.dek", fixture("burn-56-main-4-side.dek"));

    expect(read.ok).toBe(true);
    const text = read.ok ? read.text : "";
    expect(text.split("\n").slice(0, 3)).toEqual(["Deck", "4 Lightning Bolt", "4 Lava Spike"]);
    expect(text.split("\n").slice(-5)).toEqual([
      "Sideboard",
      "1 Smash to Smithereens",
      "1 Path to Exile",
      "1 Kor Firewalker",
      "1 Deflecting Palm",
    ]);
    const parsed = parseTextDecklist(text);
    expect(parsed.commander).toBeNull();
    expect(parsed.cards.filter((card) => card.zone === undefined).reduce((sum, card) => sum + card.quantity, 0)).toBe(56);
    expect(parsed.cards.filter((card) => card.zone === "sideboard")).toHaveLength(4);
  });

  it("unescapes XML references in a name and keeps a hostile newline on the card's own line", () => {
    const read = readDecklistFile(
      "vault.dek",
      `<Deck><Cards Quantity="1" Sideboard="false" Name="Lim-D&#251;l&apos;s Vault" />` +
        `<Cards Quantity="1" Sideboard="false" Name="R&amp;D&#x27;s Secret Lair &amp;#65;" />` +
        `<Cards Quantity="2" Sideboard="false" Name="Fire&#10;Sideboard" /></Deck>`
    );

    expect(read.ok && read.text).toBe("Deck\n1 Lim-Dûl's Vault\n1 R&D's Secret Lair &#65;\n2 Fire Sideboard");
  });

  it("lists an element without a name or a positive quantity by the line it starts on", () => {
    const read = readDecklistFile(
      "broken.dek",
      [
        "<Deck>",
        '  <Cards Quantity="4" Sideboard="false" Name="Lightning Bolt" />',
        '  <Cards Quantity="0" Sideboard="false" Name="Lava Spike" />',
        '  <Cards Quantity="4" Sideboard="false" />',
        "</Deck>",
      ].join("\n")
    );

    expect(read.ok && read.text).toBe("Deck\n4 Lightning Bolt");
    expect(read.ok && read.problems.map((problem) => problem.line)).toEqual([3, 4]);
  });

  it("refuses a .dek file with no Cards element", () => {
    expect(readDecklistFile("notes.dek", "1 Lightning Bolt")).toEqual({
      ok: false,
      refusal: { kind: "not-a-dek-deck", file: "notes.dek" },
    });
  });
});

describe("readDecklistFile — CSV", () => {
  it("keeps a quoted name with a comma whole and maps the zone column to the parser's headings", () => {
    const read = readDecklistFile("quoted.csv", fixture("quoted-names.csv"));

    expect(read.ok && read.text).toBe(
      [
        "Deck",
        "1 Jace, the Mind Sculptor",
        "4 Brainstorm",
        "Sideboard",
        "2 Fire // Ice",
        "Maybeboard",
        "1 Kozilek, the Great Distortion",
      ].join("\n")
    );
  });

  it("matches headers regardless of case and spaces, ignores other columns and reads \"\" as one quote", () => {
    const read = readDecklistFile(
      "export.csv",
      ' QTY ,Edition,  card name ,BOARD\r\n1,cmr,"Jeska, Thrice Reborn",COMMANDER\r\n1,znr,"Say ""Hi""",whatever\r\n'
    );

    expect(read.ok && read.text).toBe('Commander\n1 Jeska, Thrice Reborn\nDeck\n1 Say "Hi"');
  });

  it("lists a row without a whole positive quantity or a name, by the line it starts on", () => {
    const read = readDecklistFile("rows.csv", 'Amount,Name\n1,"Two\nLines"\nfour,Brainstorm\n2,\n\n3,Ponder');

    expect(read.ok && read.text).toBe("Deck\n1 Two Lines\n3 Ponder");
    expect(read.ok && read.problems).toEqual([
      { line: 4, content: "four,Brainstorm" },
      { line: 5, content: "2," },
    ]);
  });

  it("refuses a CSV whose header names no quantity or no name column", () => {
    expect(readDecklistFile("cards.csv", "Card,Copies\nSol Ring,1")).toEqual({
      ok: false,
      refusal: { kind: "csv-unknown-columns", file: "cards.csv" },
    });
  });
});

describe("readDecklistFiles", () => {
  it("joins the files in the order chosen and names the file of each unreadable line", () => {
    const outcome = readDecklistFiles([
      { name: "main.txt", text: "Deck\n4 Brainstorm\n---" },
      { name: "side.csv", text: "Qty,Name,Board\n2,Negate,Sideboard" },
    ]);

    expect(outcome).toEqual({
      ok: true,
      text: "Deck\n4 Brainstorm\n---\nSideboard\n2 Negate",
      files: [
        { name: "main.txt", format: "text", lineCount: 3 },
        { name: "side.csv", format: "csv", lineCount: 2 },
      ],
      problems: [{ file: "main.txt", line: 3, content: "---" }],
    });
  });

  it("refuses a joined decklist over 500 lines instead of letting the parser cut it", () => {
    const outcome = readDecklistFiles([
      { name: "a.txt", text: lines(300) },
      { name: "b.txt", text: lines(201) },
    ]);

    expect(outcome).toEqual({ ok: false, refusals: [{ kind: "too-many-lines", count: 501 }] });
  });

  it("accepts exactly 500 lines, every one of which the parser reads", () => {
    const outcome = readDecklistFiles([{ name: "a.txt", text: lines(DECKLIST_FILE_LIMITS.maxLines) }]);

    expect(outcome.ok).toBe(true);
    expect(parseTextDecklist(outcome.ok ? outcome.text : "").cards).toHaveLength(500);
  });

  it("refuses the whole choice when one file cannot be read as its type", () => {
    const outcome = readDecklistFiles([
      { name: "main.txt", text: "1 Sol Ring" },
      { name: "side.dek", text: "not xml" },
    ]);

    expect(outcome).toEqual({ ok: false, refusals: [{ kind: "not-a-dek-deck", file: "side.dek" }] });
  });
});
