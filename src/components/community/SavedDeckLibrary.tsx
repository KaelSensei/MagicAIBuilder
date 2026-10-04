"use client";

import { useCallback, useEffect, useState } from "react";
import { Folder, FolderPlus, Loader2, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  readSavedDeckFolders,
  type SavedDeckFoldersResponse,
} from "@/lib/community/deck-folders";
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
      const response = await fetch("/api/community/deck-folders");
      if (!response.ok) return setState("error");
      setData(readSavedDeckFolders(await response.json()));
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createFolder = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const response = await fetch("/api/community/deck-folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    if (!response.ok) return setState("error");
    setName("");
    await load();
  };

  const renameFolder = async (id: string, currentName: string) => {
    const nextName = window.prompt(t("renamePrompt"), currentName)?.trim();
    if (!nextName || nextName === currentName) return;
    const response = await fetch(`/api/community/deck-folders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName }),
    });
    if (response.ok) await load();
    else setState("error");
  };

  const deleteFolder = async (id: string) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    const response = await fetch(`/api/community/deck-folders/${id}`, {
      method: "DELETE",
    });
    if (response.ok) await load();
    else setState("error");
  };

  const moveDeck = useCallback(
    async (deckId: string, folderId: string) => {
      const response = await fetch(`/api/community/decks/${deckId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: folderId || null }),
      });
      if (response.ok) await load();
      else setState("error");
    },
    [load]
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
