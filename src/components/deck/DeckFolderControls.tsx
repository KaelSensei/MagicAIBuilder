"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderPlus, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Deck } from "@/lib/deck/types";

interface DeckFolder {
  readonly id: string;
  readonly name: string;
}
interface Props {
  readonly decks: readonly Pick<Deck, "id" | "name" | "folderId">[];
  readonly filterId: string;
  readonly onFilterChange: (folderId: string) => void;
  readonly onMoved: () => Promise<void>;
}

/** Creates, filters and assigns private folders for decks owned by the viewer. */
export function DeckFolderControls({
  decks,
  filterId,
  onFilterChange,
  onMoved,
}: Props) {
  const t = useTranslations("deck.home.folders");
  const [folders, setFolders] = useState<readonly DeckFolder[]>([]);
  const [name, setName] = useState("");
  const [deckId, setDeckId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [busy, setBusy] = useState(false);

  const loadFolders = useCallback(async () => {
    const response = await fetch("/api/deck-folders");
    if (!response.ok) return;
    const body: unknown = await response.json();
    if (
      typeof body !== "object" ||
      body === null ||
      !("folders" in body) ||
      !Array.isArray(body.folders)
    )
      return;
    setFolders(
      body.folders.filter(
        (folder): folder is DeckFolder =>
          typeof folder === "object" &&
          folder !== null &&
          "id" in folder &&
          typeof folder.id === "string" &&
          "name" in folder &&
          typeof folder.name === "string"
      )
    );
  }, []);

  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);

  const createFolder = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    const response = await fetch("/api/deck-folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    if (response.ok) {
      setName("");
      await loadFolders();
    }
    setBusy(false);
  };

  const moveDeck = async () => {
    if (!deckId) return;
    setBusy(true);
    const response = await fetch(`/api/decks/${deckId}/folder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId: targetId || null }),
    });
    if (response.ok) {
      setDeckId("");
      await onMoved();
    }
    setBusy(false);
  };

  return (
    <section className="mb-6 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onFilterChange("all")}
          className={`rounded-full border px-3 py-1 text-xs ${filterId === "all" ? "border-[var(--accent)] text-[var(--accent-text)]" : "border-[var(--border)]"}`}
        >
          {t("all")}
        </button>
        <button
          type="button"
          onClick={() => onFilterChange("")}
          className={`rounded-full border px-3 py-1 text-xs ${filterId === "" ? "border-[var(--accent)] text-[var(--accent-text)]" : "border-[var(--border)]"}`}
        >
          {t("unfiled")}
        </button>
        {folders.map((folder) => (
          <button
            key={folder.id}
            type="button"
            onClick={() => onFilterChange(folder.id)}
            className={`rounded-full border px-3 py-1 text-xs ${filterId === folder.id ? "border-[var(--accent)] text-[var(--accent-text)]" : "border-[var(--border)]"}`}
          >
            {folder.name}
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_1fr_auto]">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          placeholder={t("namePlaceholder")}
          className="rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs"
        />
        <button
          type="button"
          disabled={busy || !name.trim()}
          onClick={() => void createFolder()}
          className="inline-flex items-center justify-center gap-1 rounded bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          <FolderPlus className="h-3.5 w-3.5" />
          {t("create")}
        </button>
        <select
          aria-label={t("deckLabel")}
          value={deckId}
          onChange={(event) => setDeckId(event.target.value)}
          className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-2 text-xs"
        >
          <option value="">{t("chooseDeck")}</option>
          {decks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.name}
            </option>
          ))}
        </select>
        <select
          aria-label={t("folderLabel")}
          value={targetId}
          onChange={(event) => setTargetId(event.target.value)}
          className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-2 text-xs"
        >
          <option value="">{t("unfiled")}</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy || !deckId}
          onClick={() => void moveDeck()}
          className="rounded border border-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--accent-text)] disabled:opacity-40"
        >
          {busy ? (
            <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" />
          ) : (
            t("move")
          )}
        </button>
      </div>
    </section>
  );
}
