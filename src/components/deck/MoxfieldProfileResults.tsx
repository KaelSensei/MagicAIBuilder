import { useTranslations } from "next-intl";
import type { MoxfieldUserDeckSummary } from "@/lib/import/moxfield-user";

interface SavedMoxfieldProfilesProps {
  readonly profiles: readonly string[];
  readonly onLoad: (profile: string) => void;
  readonly onRemove: (profile: string) => void;
}

/**
 * Renders saved Moxfield profile shortcuts with independent remove controls.
 *
 * @param props Saved profile names and their actions.
 * @returns Saved-profile controls, or nothing when there are no profiles.
 */
export function SavedMoxfieldProfiles({
  profiles,
  onLoad,
  onRemove,
}: SavedMoxfieldProfilesProps) {
  const t = useTranslations("deck.import.moxfieldProfiles");
  if (profiles.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" aria-label={t("savedProfiles")}>
      {profiles.map((profile) => (
        <span
          key={profile}
          className="inline-flex overflow-hidden rounded-full border border-[var(--border)]"
        >
          <button
            type="button"
            onClick={() => onLoad(profile)}
            className="px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            @{profile}
          </button>
          <button
            type="button"
            aria-label={t("removeProfile", { profile })}
            onClick={() => onRemove(profile)}
            className="border-l border-[var(--border)] px-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

interface MoxfieldDeckResultsProps {
  readonly decks: readonly MoxfieldUserDeckSummary[];
  readonly firstResult: number;
  readonly lastResult: number;
  readonly total: number;
  readonly canLoadPrevious: boolean;
  readonly canLoadNext: boolean;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
  readonly onDeckSelected: (url: string) => void;
}

/**
 * Renders one page of Moxfield decks and accessible pagination controls.
 *
 * @param props Current deck page, range metadata, and user actions.
 * @returns The current deck page, or nothing when it has no decks.
 */
export function MoxfieldDeckResults({
  decks,
  firstResult,
  lastResult,
  total,
  canLoadPrevious,
  canLoadNext,
  onPrevious,
  onNext,
  onDeckSelected,
}: MoxfieldDeckResultsProps) {
  const t = useTranslations("deck.import.moxfieldProfiles");
  const tPagination = useTranslations("common.pagination");
  if (decks.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p aria-live="polite" className="text-xs text-[var(--text-secondary)]">
        {t("range", { first: firstResult, last: lastResult, total })}
      </p>
      <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto">
        {decks.map((deck) => (
          <li
            key={deck.id}
            className="flex items-center justify-between gap-2 rounded bg-[var(--background)] px-2 py-1.5"
          >
            <span className="min-w-0 truncate text-sm text-[var(--text-primary)]">
              {deck.name}
            </span>
            <button
              type="button"
              onClick={() =>
                onDeckSelected(
                  `https://moxfield.com/decks/${encodeURIComponent(deck.id)}`
                )
              }
              className="shrink-0 text-xs text-[var(--accent)] hover:underline"
            >
              {t("importDeck", { name: deck.name })}
            </button>
          </li>
        ))}
      </ul>
      <nav aria-label={t("deckPages")} className="flex justify-end gap-2">
        <button
          type="button"
          aria-label={tPagination("previous")}
          disabled={!canLoadPrevious}
          onClick={onPrevious}
          className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-secondary)] disabled:opacity-50"
        >
          {tPagination("previousShort")}
        </button>
        <button
          type="button"
          aria-label={tPagination("next")}
          disabled={!canLoadNext}
          onClick={onNext}
          className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-secondary)] disabled:opacity-50"
        >
          {tPagination("nextShort")}
        </button>
      </nav>
    </div>
  );
}
