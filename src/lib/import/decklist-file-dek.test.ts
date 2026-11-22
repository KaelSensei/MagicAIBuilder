import { describe, expect, it } from "vitest";
import { readMtgoDek } from "./decklist-file-dek";

/**
 * Solitary tests of the pure `.dek` reader: an XML comment is not part of the
 * deck, so a `Cards` element inside one adds no card.
 */

describe("readMtgoDek — XML comments", () => {
  it("adds no card for a Cards element inside a comment", () => {
    const decklist = readMtgoDek(
      [
        '<Cards CatID="1" Quantity="1" Sideboard="false" Name="Sol Ring" />',
        '<!-- <Cards CatID="2" Quantity="4" Sideboard="false" Name="Lightning Bolt" /> -->',
      ].join("\n")
    );

    expect(decklist).toEqual({ lines: ["Deck", "1 Sol Ring"], unreadable: [] });
  });

  it("ignores a comment that spans several lines and keeps the file's line numbers after it", () => {
    const decklist = readMtgoDek(
      [
        "<Deck>",
        "  <!--",
        '  <Cards Quantity="4" Sideboard="false" Name="Lightning Bolt" />',
        '  <Cards Quantity="2" Sideboard="true" Name="Negate" />',
        "  -->",
        '  <Cards Quantity="1" Sideboard="false" Name="Sol Ring" />',
        '  <Cards Quantity="0" Sideboard="false" Name="Lava Spike" />',
        "</Deck>",
      ].join("\n")
    );

    expect(decklist?.lines).toEqual(["Deck", "1 Sol Ring"]);
    expect(decklist?.unreadable.map((problem) => problem.line)).toEqual([7]);
  });

  it("ignores every comment of a file, and reads the cards between them", () => {
    const decklist = readMtgoDek(
      [
        '<!-- <Cards Quantity="4" Sideboard="false" Name="Lightning Bolt" /> -->',
        '<Cards Quantity="1" Sideboard="false" Name="Sol Ring" />',
        '<!-- sideboard --><Cards Quantity="2" Sideboard="true" Name="Negate" />',
        '<!-- <Cards Quantity="3" Sideboard="true" Name="Duress" /> -->',
      ].join("\n")
    );

    expect(decklist).toEqual({ lines: ["Deck", "1 Sol Ring", "Sideboard", "2 Negate"], unreadable: [] });
  });

  it("ignores everything after an unterminated comment and lists that comment as unreadable", () => {
    const decklist = readMtgoDek(
      [
        "<Deck>",
        '  <Cards Quantity="1" Sideboard="false" Name="Sol Ring" />',
        '  <!-- <Cards Quantity="4" Sideboard="false" Name="Lightning Bolt" /> --',
        '  <Cards Quantity="2" Sideboard="true" Name="Negate" />',
        "</Deck>",
      ].join("\n")
    );

    expect(decklist?.lines).toEqual(["Deck", "1 Sol Ring"]);
    expect(decklist?.unreadable).toEqual([
      { line: 3, content: '<!-- <Cards Quantity="4" Sideboard="false" Name="Lightning B' },
    ]);
  });

  it("does not close a comment with the `>` of its own `<!-->`", () => {
    const decklist = readMtgoDek(
      [
        '<Cards Quantity="1" Sideboard="false" Name="Sol Ring" />',
        '<!--> <Cards Quantity="4" Sideboard="false" Name="Lightning Bolt" /> -->',
      ].join("\n")
    );

    expect(decklist?.lines).toEqual(["Deck", "1 Sol Ring"]);
  });

  it("refuses a file whose only Cards elements are commented out, as it refuses one with none", () => {
    expect(readMtgoDek('<!-- <Cards Quantity="1" Sideboard="false" Name="Sol Ring" /> -->')).toBeNull();
  });
});
