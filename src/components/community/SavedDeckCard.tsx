"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type {
  SavedDeckFoldersResponse,
  SavedDeckSummary,
} from "@/lib/community/deck-folders";

interface SavedDeckCardProps {
  readonly saved: SavedDeckSummary;
  readonly folderId: string;
  readonly folders: SavedDeckFoldersResponse["folders"];
  readonly moveDeck: (deckId: string, folderId: string) => Promise<void>;
}

/** Displays one bookmarked deck and its private folder selector. */
export function SavedDeckCard({
  saved,
  folderId,
  folders,
  moveDeck,
}: SavedDeckCardProps) {
  const t = useTranslations("deck.savedFolders");
  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <Link
        href={`/deck/${saved.deck.id}`}
        className="font-semibold hover:text-[var(--accent-text)]"
      >
        {saved.deck.name}
      </Link>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">
        {saved.deck.commanderName ?? t("noCommander")} ·{" "}
        {saved.deck.user.name ?? saved.deck.user.username ?? t("unknown")}
      </p>
      <label className="mt-3 block text-xs text-[var(--text-muted)]">
        {t("moveTo")}
        <select
          value={folderId}
          onChange={(event) => void moveDeck(saved.deck.id, event.target.value)}
          className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-[var(--text-primary)]"
        >
          <option value="">{t("unfiled")}</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}
