"use client";
/**
 * The new-card trial picker on the playtest start screen: the player chooses main-deck copies
 * to start in the opening hand, to see a card they just added in play without dealing again and
 * again until it shows up.
 *
 * Context: playtest, the UI. Controlled: the start screen holds the chosen copy ids and passes
 * them to the deal as `PlaytestOptions.trialCardIds`. The choices and the limit come from the
 * deal (`trialCardChoices`, `MAX_TRIAL_CARDS`), so the picker offers exactly what the deal
 * accepts. Not responsible for dealing the cards (`deal.ts`) or for keeping the game out of the
 * recorded sessions (`useRecordBlockedReason`).
 *
 * @module components/playtest/TrialCardsPicker
 */
import { useId, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { DeckCard } from "@/lib/deck/types";
import { cardListText } from "@/lib/playtest/card-list-text";
import {
  MAX_TRIAL_CARDS,
  trialCardChoices,
  type TrialCardChoice,
} from "@/lib/playtest/deal";
import { useLocalizeDeckCard } from "@/components/card/LocalizedDeckTextContext";

interface TrialCardsPickerProps {
  /** The deck's rows; only the main deck is offered. */
  readonly cards: readonly DeckCard[];
  /** The chosen copy ids, in the order chosen. */
  readonly selected: readonly string[];
  /** Receives the new list of chosen copy ids. */
  readonly onChange: (selected: readonly string[]) => void;
}

/** A choice with the name the player reads, translated when a printing is known. */
interface NamedChoice extends TrialCardChoice {
  readonly name: string;
}

/**
 * A labelled group of checkboxes, one per main-deck copy, with a search by name.
 *
 * At most `MAX_TRIAL_CARDS` copies can be chosen: once that many are, the other boxes are
 * disabled and the picker says why. An empty main deck says there is nothing to choose.
 */
export function TrialCardsPicker({
  cards,
  selected,
  onChange,
}: TrialCardsPickerProps) {
  const t = useTranslations("playtest.trialCards");
  const choices = useMemo(() => trialCardChoices(cards), [cards]);

  return (
    <fieldset className="w-full max-w-md space-y-2 rounded-lg border border-[var(--border)] p-3 text-sm text-[var(--text-secondary)]">
      <legend className="px-1 font-medium text-[var(--text-primary)]">
        {t("legend")}
      </legend>
      {choices.length === 0 ? (
        <p>{t("emptyDeck")}</p>
      ) : (
        <TrialCardsChooser
          choices={choices}
          selected={selected}
          onChange={onChange}
        />
      )}
    </fieldset>
  );
}

/** The search, the tally of chosen copies and the list, for a main deck with cards in it. */
function TrialCardsChooser({
  choices,
  selected,
  onChange,
}: Omit<TrialCardsPickerProps, "cards"> & {
  readonly choices: readonly TrialCardChoice[];
}) {
  const t = useTranslations("playtest.trialCards");
  const locale = useLocale();
  const localize = useLocalizeDeckCard();
  const searchId = useId();
  const [query, setQuery] = useState("");
  const named = useMemo(
    () =>
      choices.map((choice) => ({
        ...choice,
        name: localize(choice.card).name,
      })),
    [choices, localize]
  );
  const visible = useMemo(() => matchingName(named, query), [named, query]);
  const chosenNames = useMemo(
    () => namesInOrder(named, selected),
    [named, selected]
  );
  const atLimit = selected.length >= MAX_TRIAL_CARDS;

  const toggle = (id: string) =>
    onChange(
      selected.includes(id)
        ? selected.filter((chosenId) => chosenId !== id)
        : [...selected, id]
    );

  return (
    <>
      <p className="text-xs">{t("hint", { max: MAX_TRIAL_CARDS })}</p>
      <label htmlFor={searchId} className="block text-xs">
        {t("search")}
      </label>
      <input
        id={searchId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-[var(--text-primary)]"
      />
      <output className="block space-y-1 text-xs">
        <span className="block">
          {t("count", { count: selected.length, max: MAX_TRIAL_CARDS })}
        </span>
        {atLimit && (
          <span className="block">{t("limit", { max: MAX_TRIAL_CARDS })}</span>
        )}
        {chosenNames.length > 0 && (
          <span className="block">
            {t("chosen", { names: cardListText(chosenNames, locale) })}
          </span>
        )}
      </output>
      {visible.length === 0 ? (
        <p>{t("noMatch", { query })}</p>
      ) : (
        <TrialCardList
          choices={visible}
          selected={selected}
          atLimit={atLimit}
          onToggle={toggle}
        />
      )}
    </>
  );
}

/** The checkboxes; a box not yet chosen is disabled once the limit is reached. */
function TrialCardList({
  choices,
  selected,
  atLimit,
  onToggle,
}: {
  readonly choices: readonly NamedChoice[];
  readonly selected: readonly string[];
  readonly atLimit: boolean;
  readonly onToggle: (id: string) => void;
}) {
  const t = useTranslations("playtest.trialCards");
  const chosen = new Set(selected);

  return (
    <ul className="max-h-48 space-y-1 overflow-y-auto">
      {choices.map(({ card, name, copy, copies }) => {
        const checked = chosen.has(card.id);
        return (
          <li key={card.id}>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={checked}
                disabled={atLimit && !checked}
                onChange={() => onToggle(card.id)}
                className="h-4 w-4 accent-purple-600"
              />
              <span>
                {copies > 1 ? t("copy", { name, copy, copies }) : name}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

/** The choices whose shown or English name holds `query`, ignoring case; all when it is blank. */
function matchingName(
  choices: readonly NamedChoice[],
  query: string
): readonly NamedChoice[] {
  const needle = query.trim().toLocaleLowerCase();
  if (needle === "") return choices;
  return choices.filter(
    ({ name, card }) =>
      name.toLocaleLowerCase().includes(needle) ||
      card.name.toLocaleLowerCase().includes(needle)
  );
}

/** The shown names of the chosen copies, in the order they were chosen. */
function namesInOrder(
  choices: readonly NamedChoice[],
  selected: readonly string[]
): readonly string[] {
  const nameById = new Map(choices.map(({ card, name }) => [card.id, name]));
  return selected.flatMap((id) => nameById.get(id) ?? []);
}
