"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Deck } from "@/lib/deck/types";
import { Button } from "@/components/ui/Button";
import { cardSurfaceClassName } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/components/ui/utils";
import { DeckBulkFolderMove } from "./DeckBulkFolderMove";
import { DeckFolderActions, type DeckFolderOption } from "./DeckFolderActions";

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
  const [folders, setFolders] = useState<readonly DeckFolderOption[]>([]);
  const [name, setName] = useState("");
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
        (folder): folder is DeckFolderOption =>
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

  return (
    <section className={cn(cardSurfaceClassName, "mb-6 space-y-3 p-4")}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onFilterChange("all")}
          className={`rounded-[var(--lumen-radius-pill)] border px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${filterId === "all" ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]" : "border-[var(--border)] text-[var(--text-secondary)]"}`}
        >
          {t("all")}
        </button>
        <button
          type="button"
          onClick={() => onFilterChange("")}
          className={`rounded-[var(--lumen-radius-pill)] border px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${filterId === "" ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]" : "border-[var(--border)] text-[var(--text-secondary)]"}`}
        >
          {t("unfiled")}
        </button>
        {folders.map((folder) => (
          <button
            key={folder.id}
            type="button"
            onClick={() => onFilterChange(folder.id)}
            className={`rounded-[var(--lumen-radius-pill)] border px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${filterId === folder.id ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]" : "border-[var(--border)] text-[var(--text-secondary)]"}`}
          >
            {folder.name}
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr]">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          placeholder={t("namePlaceholder")}
          aria-label={t("namePlaceholder")}
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={busy || !name.trim()}
          onClick={() => void createFolder()}
        >
          <FolderPlus className="h-3.5 w-3.5" />
          {t("create")}
        </Button>
        <DeckFolderActions
          folders={folders}
          busy={busy}
          setBusy={setBusy}
          onChanged={loadFolders}
          onDeleted={(folderId) => {
            if (filterId === folderId) onFilterChange("all");
          }}
        />
      </div>
      <DeckBulkFolderMove
        decks={decks}
        folders={folders}
        busy={busy}
        setBusy={setBusy}
        onMoved={onMoved}
      />
    </section>
  );
}
