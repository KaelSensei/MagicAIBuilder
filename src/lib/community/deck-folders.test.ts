import { describe, expect, it } from "vitest";
import { readSavedDeckFolders } from "./deck-folders";

describe("readSavedDeckFolders", () => {
  it("keeps valid folders and unfiled decks", () => {
    const savedDeck = {
      createdAt: "2026-09-24T10:00:00.000Z",
      deck: {
        id: "deck-1",
        name: "Bant Value",
        commanderName: "Atraxa",
        user: { username: "kael", name: null },
      },
    };

    expect(
      readSavedDeckFolders({
        folders: [{ id: "folder-1", name: "Ideas", savedDecks: [savedDeck] }],
        unfiled: [savedDeck],
      })
    ).toEqual({
      folders: [{ id: "folder-1", name: "Ideas", savedDecks: [savedDeck] }],
      unfiled: [savedDeck],
    });
  });

  it("discards malformed API entries", () => {
    expect(
      readSavedDeckFolders({
        folders: [
          { id: "folder-1", name: "Ideas", savedDecks: [{ deck: null }] },
        ],
        unfiled: [{ createdAt: 42 }],
      })
    ).toEqual({ folders: [], unfiled: [] });
  });
});
