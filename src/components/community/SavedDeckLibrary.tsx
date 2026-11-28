"use client";
/**
 * The viewer's saved-deck library: their folders, each with its saved decks,
 * the unfiled saved decks, and the folder tools (create, rename, delete, move
 * a deck).
 *
 * Community context (UI). Every write goes through the community client and
 * is followed by a reload of the whole library, so the page shows what the
 * server holds; any rejection shows one failure banner with a retry. Not
 * responsible for: the request wire format
 * (`lib/community/community-client.ts`) and the reading of one library entry
 * (`lib/community/deck-folders.ts`).
 */
import { useCallback, useEffect, useState } from "react";
import { Folder, FolderPlus, Loader2, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  createSavedDeckFolder,
  deleteSavedDeckFolder,
  fetchSavedDeckLibrary,
  renameSavedDeckFolder,
  savePublicDeck,
} from "@/lib/community/community-client";
import type { SavedDeckFoldersResponse } from "@/lib/community/deck-folders";
import { SavedDeckCard } from "./SavedDeckCard";

const EMPTY: SavedDeckFoldersResponse = { folders: [], unfiled: [] };

/** Private library for organizing bookmarks of public decks. */
export function SavedDeckLibrary() {
  const t = useTranslations("deck.savedFolders");
  const [data, setData] = useState<SavedDeckFoldersResponse>(EMPTY);
  const [name, setName] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      setData(await fetchSavedDeckLibrary());
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Runs one library write, then reloads; a rejection shows the failure banner. */
  const writeThenReload = useCallback(
    async (write: () => Promise<unknown>, afterWrite?: () => void) => {
      try {
        await write();
      } catch {
        return setState("error");
      }
      afterWrite?.();
      await load();
    },
    [load]
  );

  const createFolder = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await writeThenReload(
      () => createSavedDeckFolder(trimmed),
      () => setName("")
    );
  };

  const renameFolder = async (id: string, currentName: string) => {
    const nextName = window.prompt(t("renamePrompt"), currentName)?.trim();
    if (!nextName || nextName === currentName) return;
    await writeThenReload(() => renameSavedDeckFolder(id, nextName));
  };

  const deleteFolder = async (id: string) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    await writeThenReload(() => deleteSavedDeckFolder(id));
  };

  const moveDeck = useCallback(
    (deckId: string, folderId: string) =>
      writeThenReload(() => savePublicDeck(deckId, folderId || null)),
    [writeThenReload]
  );

  if (state === "loading")
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("loading")}
      </div>
    );

  const sections = [
    { id: "", name: t("unfiled"), savedDecks: data.unfiled },
    ...data.folders,
  ];
  return (
    <div className="space-y-8">
      {state === "error" && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          <span>{t("failed")}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="font-semibold hover:underline"
          >
            {t("retry")}
          </button>
        </div>
      )}
      <div className="flex max-w-lg gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          // No caption names the field, and a placeholder is no name
          // (WCAG 2.2 SC 1.3.1 and 4.1.2).
          aria-label={t("newFolderLabel")}
          placeholder={t("newFolderPlaceholder")}
          className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void createFolder()}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
        >
          <FolderPlus className="h-4 w-4" />
          {t("createFolder")}
        </button>
      </div>
      {sections.every((section) => section.savedDecks.length === 0) ? (
        <p className="py-12 text-center text-sm text-[var(--text-secondary)]">
          {t("empty")}
        </p>
      ) : (
        sections.map(
          (section) =>
            section.savedDecks.length > 0 && (
              <section key={section.id || "unfiled"} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-[var(--accent-text)]" />
                  <h2 className="font-semibold">{section.name}</h2>
                  <span className="text-xs text-[var(--text-muted)]">
                    {section.savedDecks.length}
                  </span>
                  {section.id && (
                    <div className="ml-auto flex gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          void renameFolder(section.id, section.name)
                        }
                        aria-label={t("renameFolder", { name: section.name })}
                        className="rounded p-1.5 hover:bg-[var(--surface-hover)]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteFolder(section.id)}
                        aria-label={t("deleteFolder", { name: section.name })}
                        className="rounded p-1.5 text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {section.savedDecks.map((saved) => (
                    <SavedDeckCard
                      key={saved.deck.id}
                      saved={saved}
                      folderId={section.id}
                      folders={data.folders}
                      moveDeck={moveDeck}
                    />
                  ))}
                </div>
              </section>
            )
        )
      )}
    </div>
  );
}
