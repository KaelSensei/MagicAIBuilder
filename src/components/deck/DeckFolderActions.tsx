"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

export interface DeckFolderOption {
  readonly id: string;
  readonly name: string;
}
interface Props {
  readonly folders: readonly DeckFolderOption[];
  readonly busy: boolean;
  readonly setBusy: (busy: boolean) => void;
  readonly onChanged: () => Promise<void>;
  readonly onDeleted: (folderId: string) => void;
}

/** Provides explicit rename and safe-delete actions for private deck folders. */
export function DeckFolderActions({
  folders,
  busy,
  setBusy,
  onChanged,
  onDeleted,
}: Props) {
  const t = useTranslations("deck.home.folders");
  const [folderId, setFolderId] = useState("");

  const rename = async () => {
    const folder = folders.find((candidate) => candidate.id === folderId);
    if (!folder) return;
    const name = window.prompt(t("renamePrompt"), folder.name)?.trim();
    if (!name || name === folder.name) return;
    setBusy(true);
    const response = await fetch(`/api/deck-folders/${folder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (response.ok) await onChanged();
    setBusy(false);
  };

  const remove = async () => {
    if (!folderId || !window.confirm(t("deleteConfirm"))) return;
    setBusy(true);
    const response = await fetch(`/api/deck-folders/${folderId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      onDeleted(folderId);
      setFolderId("");
      await onChanged();
    }
    setBusy(false);
  };

  if (folders.length === 0) return null;
  return (
    <div className="flex gap-2">
      <select
        aria-label={t("manageLabel")}
        value={folderId}
        onChange={(event) => setFolderId(event.target.value)}
        className="min-w-0 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-2 text-xs"
      >
        <option value="">{t("chooseFolder")}</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>
            {folder.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        aria-label={t("rename")}
        disabled={busy || !folderId}
        onClick={() => void rename()}
        className="rounded border border-[var(--border)] p-2 disabled:opacity-40"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={t("delete")}
        disabled={busy || !folderId}
        onClick={() => void remove()}
        className="rounded border border-red-500/40 p-2 text-red-400 disabled:opacity-40"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
