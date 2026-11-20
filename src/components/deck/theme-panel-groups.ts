/**
 * The lists the Theme panel shows: the on-theme cards grouped by the handle
 * that matched, and the off-theme cards grouped by the category the deck
 * stores for them.
 *
 * Deck analysis (ui), I-102 requirement 3.2. Every group keeps the coverage's
 * card order, the command zone first and then by name, so the same deck in
 * any input order shows the same lists (requirement 3.3). An off-theme card is
 * grouped by its stored category until I-76's slot roles exist (3.1).
 * Not responsible for: the verdicts or the count (`lib/deck/theme-coverage.ts`).
 *
 * @module components/deck/theme-panel-groups
 */
import type { CardThemeMatch, ThemeCoverage } from "@/lib/deck/theme-coverage";
import type {
  DeckTheme,
  ThemeEvidence,
  ThemeHandle,
} from "@/lib/deck/theme-match";
import type { CardCategory } from "@/lib/deck/types";

/** One card row of a group, with a key unique within the coverage. */
export interface ThemeListEntry {
  /** The card name, suffixed by its rank among rows of the same name */
  readonly key: string;
  readonly cardName: string;
  readonly quantity: number;
  readonly commandZone: boolean;
}

/** An on-theme card under one handle, with what that handle matched. */
export interface OnThemeEntry extends ThemeListEntry {
  readonly evidence: ThemeEvidence;
}

/** The on-theme cards one handle matched. */
export interface OnThemeGroup {
  readonly handleIndex: number;
  readonly handle: ThemeHandle;
  readonly cards: readonly OnThemeEntry[];
}

/** An off-theme card, and how many handles it meets under "all". */
export interface OffThemeEntry extends ThemeListEntry {
  readonly matchedHandles: number;
}

/** The off-theme cards of one stored category. */
export interface OffThemeGroup {
  readonly category: CardCategory;
  readonly cards: readonly OffThemeEntry[];
}

/**
 * Gives each verdict a key: its name, and its rank among the rows that share
 * the name (two printings of one card are two rows).
 *
 * @param cards - the coverage's verdicts, in its order
 */
function keyed(
  cards: readonly CardThemeMatch[]
): readonly (CardThemeMatch & { readonly key: string })[] {
  const seen = new Map<string, number>();
  return cards.map((card) => {
    const rank = seen.get(card.cardName) ?? 0;
    seen.set(card.cardName, rank + 1);
    return { ...card, key: `${card.cardName}#${rank}` };
  });
}

/**
 * The on-theme cards under each handle of the theme. A card that meets two
 * handles is listed under both; the count still holds it once.
 *
 * @param coverage - the deck's coverage of the theme
 * @param theme - the theme the coverage read
 */
export function onThemeGroups(
  coverage: ThemeCoverage,
  theme: DeckTheme
): readonly OnThemeGroup[] {
  const onTheme = keyed(coverage.cards).filter((card) => card.onTheme);
  return theme.handles.map((handle, handleIndex) => ({
    handleIndex,
    handle,
    cards: onTheme.flatMap((card) =>
      card.evidence
        .filter((found) => found.handleIndex === handleIndex)
        .map((found) => ({
          key: card.key,
          cardName: card.cardName,
          quantity: card.quantity,
          commandZone: card.commandZone,
          evidence: found,
        }))
    ),
  }));
}

/**
 * The off-theme cards by stored category, the categories in the order their
 * first card appears. `ThemeCoverage.offTheme` holds the category and
 * `ThemeCoverage.cards` the rest, in the same order for rows of one name.
 *
 * @param coverage - the deck's coverage of the theme
 */
export function offThemeGroups(
  coverage: ThemeCoverage
): readonly OffThemeGroup[] {
  const verdictsByName = new Map<string, OffThemeEntry[]>();
  for (const card of keyed(coverage.cards)) {
    if (!card.onTheme) {
      const rows = verdictsByName.get(card.cardName) ?? [];
      rows.push({
        key: card.key,
        cardName: card.cardName,
        quantity: card.quantity,
        commandZone: card.commandZone,
        matchedHandles: card.evidence.length,
      });
      verdictsByName.set(card.cardName, rows);
    }
  }
  const groups = new Map<CardCategory, OffThemeEntry[]>();
  for (const { cardName, category } of coverage.offTheme) {
    const entry = verdictsByName.get(cardName)?.shift();
    if (entry) {
      groups.set(category, [...(groups.get(category) ?? []), entry]);
    }
  }
  return [...groups].map(([category, cards]) => ({ category, cards }));
}
