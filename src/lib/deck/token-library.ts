import type { DeckCard } from "./types";

export type TokenLibraryKind = "token" | "emblem";

export interface TokenLibraryEntry {
  readonly name: string;
  readonly power: string | null;
  readonly colors: readonly string[];
  readonly count: number;
  readonly kind: TokenLibraryKind;
}

const TOKEN_PATTERN =
  /creates?\s+(?:(\w+)\s+)?(\d+\/\d+)\s+/gi;
const TOKEN_DESCRIPTION_PATTERN =
  /^((?:(?:white|blue|black|red|green|colorless)\s+)*)([a-z][a-z'’-]*)\s+(?:creature\s+)?tokens?/i;
const EMBLEM_PATTERN = /\b(?:get|create)\s+(?:an?\s+)?emblem\b/gi;
const NUMBER_WORDS: Readonly<Record<string, number>> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  a: 1,
  an: 1,
};

function amount(value: string | undefined): number {
  if (!value) return 1;
  return NUMBER_WORDS[value.toLowerCase()] ?? (Number.parseInt(value, 10) || 1);
}

/** Extract the token and emblem objects described by a deck's Oracle text. */
export function buildTokenLibrary(
  cards: readonly DeckCard[]
): readonly TokenLibraryEntry[] {
  const entries = new Map<string, TokenLibraryEntry>();
  const add = (entry: TokenLibraryEntry): void => {
    const key = `${entry.kind}:${entry.name}:${entry.power ?? ""}:${entry.colors.join(",")}`;
    const current = entries.get(key);
    entries.set(
      key,
      current ? { ...current, count: current.count + entry.count } : entry
    );
  };

  for (const card of cards) {
    for (const match of card.oracleText.matchAll(TOKEN_PATTERN)) {
      const count = match[1];
      if (count && !Object.hasOwn(NUMBER_WORDS, count.toLowerCase()) && !/^\d+$/.test(count)) continue;
      const description = TOKEN_DESCRIPTION_PATTERN.exec(
        card.oracleText.slice(match.index + match[0].length)
      );
      if (!description) continue;
      const colors = description[1].trim() === "" ? [] : description[1].trim().split(/\s+/);
      add({
        name: description[2],
        power: match[2],
        colors,
        count: amount(match[1]) * card.quantity,
        kind: "token",
      });
    }
    const emblems = [...card.oracleText.matchAll(EMBLEM_PATTERN)].length;
    if (emblems > 0) {
      add({
        name: "Emblem",
        power: null,
        colors: [],
        count: emblems * card.quantity,
        kind: "emblem",
      });
    }
  }

  return [...entries.values()];
}

/** Format a deterministic checklist that can be copied or saved with a deck. */
export function formatTokenLibrary(
  entries: readonly TokenLibraryEntry[]
): string {
  return [...entries]
    .sort((left, right) => {
      if (left.kind !== right.kind) return left.kind === "token" ? -1 : 1;
      return left.name.localeCompare(right.name);
    })
    .map((entry) => {
      const details = [
        entry.power,
        ...entry.colors,
        entry.name,
        entry.kind === "token" ? entry.kind : null,
      ].filter(Boolean);
      return `${entry.count}x ${details.join(" ")}`;
    })
    .join("\n");
}
