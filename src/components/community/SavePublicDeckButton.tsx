"use client";

import { useState } from "react";
import { Bookmark, Check, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  readSavedDeckFolders,
  type SavedDeckFolder,
} from "@/lib/community/deck-folders";

interface Props {
  readonly deckId: string;
  readonly isSignedIn: boolean;
  readonly isOwner: boolean;
}

/** Saves a public deck as a private bookmark in an optional personal folder. */
export function SavePublicDeckButton({ deckId, isSignedIn, isOwner }: Props) {
  const t = useTranslations("deck.savedFolders");
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState<readonly SavedDeckFolder[]>([]);
  const [folderId, setFolderId] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "saving" | "saved" | "error"
  >("idle");

  if (!isSignedIn || isOwner) return null;

  const show = async () => {
    setOpen(true);
    setStatus("loading");
    try {
      const response = await fetch("/api/community/deck-folders");
      if (!response.ok) return setStatus("error");
      setFolders(readSavedDeckFolders(await response.json()).folders);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  const save = async () => {
    setStatus("saving");
    try {
      const response = await fetch(`/api/community/decks/${deckId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: folderId || null }),
      });
      setStatus(response.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "saved" && !open)
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-400">
        <Check className="h-3.5 w-3.5" />
        {t("saved")}
      </span>
    );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void show()}
        className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--accent-text)]"
      >
        <Bookmark className="h-3.5 w-3.5" />
        {t("saveDeck")}
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-40 w-72 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{t("chooseFolder")}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {status === "loading" ? (
            <Loader2 className="mx-auto my-6 h-5 w-5 animate-spin text-[var(--accent)]" />
          ) : (
            <>
              <label className="mt-3 block text-xs text-[var(--text-secondary)]">
                {t("folder")}
                <select
                  value={folderId}
                  onChange={(event) => setFolderId(event.target.value)}
                  className="mt-1.5 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)]"
                >
                  <option value="">{t("unfiled")}</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </label>
              {status === "error" && (
                <p role="alert" className="mt-2 text-xs text-red-300">
                  {t("failed")}
                </p>
              )}
              {status === "saved" ? (
                <p className="mt-3 flex items-center gap-1 text-xs text-green-400">
                  <Check className="h-3.5 w-3.5" />
                  {t("saved")}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={status === "saving"}
                  className="mt-3 w-full rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {status === "saving" ? t("saving") : t("save")}
                </button>
              )}
              <Link
                href="/saved-decks"
                className="mt-3 block text-center text-xs text-[var(--accent-text)] hover:underline"
              >
                {t("manage")}
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
