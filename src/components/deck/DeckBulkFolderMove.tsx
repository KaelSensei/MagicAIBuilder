"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Deck } from "@/lib/deck/types";
import type { DeckFolderOption } from "./DeckFolderActions";

interface Props {
  readonly decks: readonly Pick<Deck, "id" | "name">[];
  readonly folders: readonly DeckFolderOption[];
  readonly busy: boolean;
  readonly setBusy: (busy: boolean) => void;
  readonly onMoved: () => Promise<void>;
}

/** Selects and moves several owned decks to one private folder. */
export function DeckBulkFolderMove({
  decks,
  folders,
  busy,
  setBusy,
  onMoved,
}: Props) {
  const t = useTranslations("deck.home.folders");
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [targetId, setTargetId] = useState("");

  const move = async () => {
    if (selectedIds.length === 0) return;
    setBusy(true);
    const response = await fetch("/api/decks/folders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deckIds: selectedIds,
        folderId: targetId || null,
      }),
    });
    if (response.ok) {
      setSelectedIds([]);
      await onMoved();
    }
    setBusy(false);
  };

  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
      <select
        multiple
        aria-label={t("deckLabel")}
        value={[...selectedIds]}
        onChange={(event) =>
          setSelectedIds(
            Array.from(event.target.selectedOptions, (option) => option.value)
          )
        }
        className="min-h-20 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-2 text-xs"
      >
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
        disabled={busy || selectedIds.length === 0}
        onClick={() => void move()}
        className="rounded border border-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--accent-text)] disabled:opacity-40"
      >
        {busy ? (
          <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" />
        ) : (
          t("moveSelected", { count: selectedIds.length })
        )}
      </button>
    </div>
  );
}
