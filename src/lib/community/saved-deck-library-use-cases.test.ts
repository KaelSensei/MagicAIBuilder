import { describe, expect, it } from "vitest";

import {
  createLibraryFolder,
  deleteLibraryFolder,
  readSavedDeckLibrary,
  renameLibraryFolder,
} from "./saved-deck-library-use-cases";
import {
  FAKE_FOLDER_CREATED_AT,
  inMemorySavedDeckLibrary,
  type FakeLibraryBookmark,
  type FakeLibraryFolder,
} from "./testing/saved-deck-library-fakes";

const USER = "user-1";
const OTHER_USER = "user-2";
const IDEAS: FakeLibraryFolder = {
  id: "folder-ideas",
  userId: USER,
  name: "Ideas",
};
const COMBOS: FakeLibraryFolder = {
  id: "folder-combos",
  userId: USER,
  name: "Combos",
};
const THEIRS: FakeLibraryFolder = {
  id: "folder-theirs",
  userId: OTHER_USER,
  name: "Theirs",
};

function bookmark(
  deckId: string,
  overrides: Partial<FakeLibraryBookmark> = {}
): FakeLibraryBookmark {
  return {
    userId: USER,
    folderId: null,
    deckIsPublic: true,
    createdAt: new Date("2026-11-01T00:00:00.000Z"),
    deck: {
      id: deckId,
      name: `Deck ${deckId}`,
      commanderName: "Atraxa, Praetors' Voice",
      user: { username: "author", name: null },
    },
    ...overrides,
  };
}

const ports = (library: ReturnType<typeof inMemorySavedDeckLibrary>) => ({
  library,
  folders: library,
});

describe("readSavedDeckLibrary", () => {
  it("reads the caller's folders by name and their unfiled bookmarks, nobody else's", async () => {
    const library = inMemorySavedDeckLibrary({
      folders: [IDEAS, COMBOS, THEIRS],
      bookmarks: [
        bookmark("filed", { folderId: IDEAS.id }),
        bookmark("loose"),
        bookmark("foreign", { userId: OTHER_USER, folderId: THEIRS.id }),
      ],
    });

    const read = await readSavedDeckLibrary(USER, ports(library));

    expect(read.folders.map((folder) => folder.name)).toEqual([
      "Combos",
      "Ideas",
    ]);
    expect(read.folders[1]?.savedDecks.map((saved) => saved.deck.id)).toEqual([
      "filed",
    ]);
    expect(read.unfiled.map((saved) => saved.deck.id)).toEqual(["loose"]);
  });

  it("leaves out a saved deck its owner has made private since", async () => {
    const library = inMemorySavedDeckLibrary({
      bookmarks: [bookmark("hidden", { deckIsPublic: false })],
    });

    await expect(readSavedDeckLibrary(USER, ports(library))).resolves.toEqual({
      folders: [],
      unfiled: [],
    });
  });
});

describe("createLibraryFolder", () => {
  it("creates a folder owned by the caller and answers it", async () => {
    const library = inMemorySavedDeckLibrary();

    const created = await createLibraryFolder(
      { userId: USER, name: "Staples" },
      ports(library)
    );

    expect(created).toEqual({
      id: "folder-1",
      name: "Staples",
      createdAt: FAKE_FOLDER_CREATED_AT,
    });
    expect(library.folders.get(created.id)).toEqual({
      id: "folder-1",
      userId: USER,
      name: "Staples",
    });
  });
});

describe("renameLibraryFolder", () => {
  it("renames a folder the caller owns and answers its new name", async () => {
    const library = inMemorySavedDeckLibrary({ folders: [IDEAS] });

    await expect(
      renameLibraryFolder(
        { folderId: IDEAS.id, userId: USER, name: "Staples" },
        ports(library)
      )
    ).resolves.toEqual({ kind: "renamed", id: IDEAS.id, name: "Staples" });
    expect(library.folders.get(IDEAS.id)?.name).toBe("Staples");
  });

  it("answers another user's folder as a missing one and leaves it as it was", async () => {
    const library = inMemorySavedDeckLibrary({ folders: [THEIRS] });

    await expect(
      renameLibraryFolder(
        { folderId: THEIRS.id, userId: USER, name: "Stolen" },
        ports(library)
      )
    ).resolves.toEqual({ kind: "folder-not-found" });
    expect(library.folders.get(THEIRS.id)?.name).toBe("Theirs");
  });

  it("answers a folder id nobody owns as a missing folder", async () => {
    const library = inMemorySavedDeckLibrary();

    await expect(
      renameLibraryFolder(
        { folderId: "folder-gone", userId: USER, name: "Staples" },
        ports(library)
      )
    ).resolves.toEqual({ kind: "folder-not-found" });
  });
});

describe("deleteLibraryFolder", () => {
  it("deletes the caller's folder and keeps its saved decks, unfiled", async () => {
    const library = inMemorySavedDeckLibrary({
      folders: [IDEAS],
      bookmarks: [bookmark("filed", { folderId: IDEAS.id })],
    });

    await expect(
      deleteLibraryFolder({ folderId: IDEAS.id, userId: USER }, ports(library))
    ).resolves.toEqual({ kind: "deleted" });

    const read = await readSavedDeckLibrary(USER, ports(library));
    expect(read.folders).toEqual([]);
    expect(read.unfiled.map((saved) => saved.deck.id)).toEqual(["filed"]);
  });

  it("answers another user's folder as a missing one and keeps their decks filed", async () => {
    const library = inMemorySavedDeckLibrary({
      folders: [THEIRS],
      bookmarks: [
        bookmark("foreign", { userId: OTHER_USER, folderId: THEIRS.id }),
      ],
    });

    await expect(
      deleteLibraryFolder({ folderId: THEIRS.id, userId: USER }, ports(library))
    ).resolves.toEqual({ kind: "folder-not-found" });
    expect(library.folders.has(THEIRS.id)).toBe(true);
    expect(library.bookmarks[0]?.folderId).toBe(THEIRS.id);
  });
});
