import { describe, expect, it } from "vitest";

import type { SavedDeckDraft } from "./deck-action-ports";
import type { DeckVisibilityFacts } from "./deck-visibility-policy";
import {
  removeSavedDeck,
  savePublicDeck,
  type SavedDeckUseCasePorts,
} from "./saved-deck-use-cases";
import {
  inMemoryDeckFactsReader,
  inMemoryDeckFolderReader,
  inMemorySavedDeckStore,
  saverKey,
  type FakeFolder,
} from "./testing/deck-action-fakes";

const OWNER = "owner-1";
const USER = "user-1";
const DECK = "deck-1";
const PUBLIC_DECK: DeckVisibilityFacts = {
  ownerId: OWNER,
  isPublic: true,
  shareEnabled: false,
};
const PRIVATE_DECK: DeckVisibilityFacts = {
  ownerId: OWNER,
  isPublic: false,
  shareEnabled: false,
};
const OWN_FOLDER: FakeFolder = { id: "folder-1", userId: USER };
const OTHER_FOLDER: FakeFolder = { id: "other-folder", userId: "user-2" };

function ports(
  decks: Readonly<Record<string, DeckVisibilityFacts>>,
  seed: readonly SavedDeckDraft[] = []
): {
  readonly ports: SavedDeckUseCasePorts;
  readonly savedDecks: ReturnType<typeof inMemorySavedDeckStore>;
} {
  const savedDecks = inMemorySavedDeckStore(seed);
  return {
    ports: {
      decks: inMemoryDeckFactsReader(decks),
      folders: inMemoryDeckFolderReader([OWN_FOLDER, OTHER_FOLDER]),
      savedDecks,
    },
    savedDecks,
  };
}

const bookmark = (store: ReturnType<typeof inMemorySavedDeckStore>) =>
  store.rows.get(saverKey({ userId: USER, deckId: DECK }));

describe("savePublicDeck", () => {
  it("saves a public deck into a folder the caller owns", async () => {
    const { ports: p, savedDecks } = ports({ [DECK]: PUBLIC_DECK });

    await expect(
      savePublicDeck({ deckId: DECK, userId: USER, folderId: "folder-1" }, p)
    ).resolves.toEqual({ kind: "saved", folderId: "folder-1" });
    expect(bookmark(savedDecks)).toEqual({
      userId: USER,
      deckId: DECK,
      folderId: "folder-1",
    });
  });

  it("saves a public deck at the library's root without asking about folders", async () => {
    const { ports: p, savedDecks } = ports({ [DECK]: PUBLIC_DECK });

    await expect(
      savePublicDeck({ deckId: DECK, userId: USER, folderId: null }, p)
    ).resolves.toEqual({ kind: "saved", folderId: null });
    expect(bookmark(savedDecks)).toMatchObject({ folderId: null });
  });

  it("moves an earlier bookmark of the same deck instead of adding a second one", async () => {
    const { ports: p, savedDecks } = ports({ [DECK]: PUBLIC_DECK }, [
      { userId: USER, deckId: DECK, folderId: null },
    ]);

    await savePublicDeck(
      { deckId: DECK, userId: USER, folderId: "folder-1" },
      p
    );

    expect(savedDecks.rows.size).toBe(1);
    expect(bookmark(savedDecks)).toMatchObject({ folderId: "folder-1" });
  });

  it("answers deck-not-found for a private deck and stores nothing", async () => {
    const { ports: p, savedDecks } = ports({ [DECK]: PRIVATE_DECK });

    await expect(
      savePublicDeck({ deckId: DECK, userId: USER, folderId: "folder-1" }, p)
    ).resolves.toEqual({ kind: "deck-not-found" });
    expect(savedDecks.rows.size).toBe(0);
  });

  it("answers deck-not-found for a deck that does not exist", async () => {
    const { ports: p } = ports({});

    await expect(
      savePublicDeck({ deckId: DECK, userId: USER, folderId: null }, p)
    ).resolves.toEqual({ kind: "deck-not-found" });
  });

  it("answers folder-not-found for another user's folder and stores nothing", async () => {
    const { ports: p, savedDecks } = ports({ [DECK]: PUBLIC_DECK });

    await expect(
      savePublicDeck(
        { deckId: DECK, userId: USER, folderId: "other-folder" },
        p
      )
    ).resolves.toEqual({ kind: "folder-not-found" });
    expect(savedDecks.rows.size).toBe(0);
  });

  it("currently lets the owner bookmark their own public deck (pinned; see the COM-14 follow-up)", async () => {
    const { ports: p } = ports({ [DECK]: PUBLIC_DECK });

    await expect(
      savePublicDeck({ deckId: DECK, userId: OWNER, folderId: null }, p)
    ).resolves.toEqual({ kind: "saved", folderId: null });
  });
});

describe("removeSavedDeck", () => {
  it("removes only the caller's bookmark", async () => {
    const { ports: p, savedDecks } = ports({ [DECK]: PUBLIC_DECK }, [
      { userId: USER, deckId: DECK, folderId: null },
      { userId: "user-2", deckId: DECK, folderId: null },
    ]);

    await removeSavedDeck({ deckId: DECK, userId: USER }, p);

    expect(bookmark(savedDecks)).toBeUndefined();
    expect(savedDecks.rows.size).toBe(1);
  });

  it("is idempotent when no bookmark exists", async () => {
    const { ports: p, savedDecks } = ports({});

    await expect(
      removeSavedDeck({ deckId: DECK, userId: USER }, p)
    ).resolves.toBeUndefined();
    expect(savedDecks.rows.size).toBe(0);
  });
});
