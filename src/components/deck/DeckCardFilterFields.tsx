"use client";
/**
 * The card filter of the deck library page: a "Has the card" field and a
 * "Leaves out" field, each a list of card names the player adds and removes,
 * and the state of the search they start (I-01, the library filter line of
 * `docs/product/specs/i01-deck-editor-workflow.md`).
 *
 * Deck-building context, UI. Controlled: the page owns the filter and the
 * search (`useLibraryCardSearch`). A name is added whole, never split on
 * commas: card names hold commas ("Kenrith, the Returned King").
 *
 * @module components/deck/DeckCardFilterFields
 */
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import type { DeckCardFilter } from "@/lib/deck/deck-card-filter";
import {
  isCardListFull,
  withCardName,
  type LibraryCardSearch,
} from "@/lib/deck/library-card-filter";

/** What the page hands the fields. */
export interface DeckCardFilterFieldsProps {
  /** The names included (`all`) and excluded (`none`). */
  readonly filter: DeckCardFilter;
  /** Called with the whole new filter when a name is added or removed. */
  readonly onChange: (filter: DeckCardFilter) => void;
  /** The state of the search the filter started. */
  readonly search: LibraryCardSearch;
}

const SMALL_BUTTON =
  "shrink-0 rounded-[var(--lumen-radius-pill)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60";

/**
 * The two card name lists and the search's status line.
 *
 * @param props - the filter, its change handler and the search's state
 * @returns the fields
 */
export function DeckCardFilterFields({
  filter,
  onChange,
  search,
}: Readonly<DeckCardFilterFieldsProps>) {
  const t = useTranslations("deck");
  return (
    <div className="flex w-full flex-col gap-3">
      <CardNameList
        label={t("home.cardFilter.includeLabel")}
        names={filter.all}
        onChange={(all) => onChange({ ...filter, all })}
      />
      <CardNameList
        label={t("home.cardFilter.excludeLabel")}
        names={filter.none}
        onChange={(none) => onChange({ ...filter, none })}
      />
      <CardSearchStatus search={search} />
    </div>
  );
}

interface CardNameListProps {
  readonly label: string;
  readonly names: readonly string[];
  readonly onChange: (names: readonly string[]) => void;
}

/** One list: a text field with an Add button, then one removable chip per name. */
function CardNameList({ label, names, onChange }: Readonly<CardNameListProps>) {
  const t = useTranslations("deck");
  const [typed, setTyped] = useState("");
  const full = isCardListFull(names);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onChange(withCardName(names, typed));
    setTyped("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-medium text-[var(--text-secondary)]">
          {label}
        </legend>
        <div className="flex gap-2">
          <Input
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder={t("home.cardFilter.placeholder")}
            aria-label={label}
            disabled={full}
            className="min-w-0 flex-1"
          />
          <button
            type="submit"
            disabled={full || typed.trim().length === 0}
            className={SMALL_BUTTON}
          >
            {t("home.cardFilter.add")}
          </button>
        </div>
        {full && (
          <p className="text-xs text-[var(--text-secondary)]">
            {t("home.cardFilter.listFull", { count: names.length })}
          </p>
        )}
        {names.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {names.map((name) => (
              <li
                key={name}
                className="flex items-center gap-1 rounded-[var(--lumen-radius-pill)] border border-[var(--border)] bg-[var(--surface)] py-1 pr-1 pl-3 text-xs text-[var(--text-primary)]"
              >
                <span>{name}</span>
                <button
                  type="button"
                  onClick={() =>
                    onChange(names.filter((listed) => listed !== name))
                  }
                  aria-label={t("home.cardFilter.remove", { name })}
                  className="rounded-full p-1 hover:bg-[var(--background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>
    </form>
  );
}

/** Pending, failed with a retry, or found with more than the page holds. */
function CardSearchStatus({ search }: Readonly<{ search: LibraryCardSearch }>) {
  const t = useTranslations("deck");
  switch (search.kind) {
    case "off":
      return null;
    case "searching":
      return (
        <output className="block text-xs text-[var(--text-secondary)]">
          {t("home.cardFilter.searching")}
        </output>
      );
    case "failed":
      return (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-[var(--lumen-radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-primary)]"
        >
          <p>{t("home.cardFilter.failed")}</p>
          <button type="button" onClick={search.retry} className={SMALL_BUTTON}>
            {t("home.cardFilter.retry")}
          </button>
        </div>
      );
    case "found":
      return search.hasMore ? (
        <output className="block text-xs text-[var(--text-secondary)]">
          {t("home.cardFilter.truncated", { count: search.decks.length })}
        </output>
      ) : null;
    default: {
      const unreachable: never = search;
      return unreachable;
    }
  }
}
