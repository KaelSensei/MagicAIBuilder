import type { PlaytestActionLogEntry } from "./engine";

export interface PlaytestTurnSummary {
  readonly turn: number;
  readonly entries: readonly PlaytestActionLogEntry[];
  readonly draws: number;
  readonly manaProduced: number;
  readonly cardsSeen: number;
}

export function summarizeActionLog(
  entries: readonly PlaytestActionLogEntry[]
): readonly PlaytestTurnSummary[] {
  const turns = new Map<number, PlaytestActionLogEntry[]>();
  for (const entry of entries) {
    const current = turns.get(entry.turn) ?? [];
    current.push(entry);
    turns.set(entry.turn, current);
  }
  return [...turns.entries()]
    .sort(([left], [right]) => left - right)
    .map(([turn, turnEntries]) => {
      let draws = 0;
      let manaProduced = 0;
      let cardsSeen = 0;
      for (const entry of turnEntries) {
        if (entry.kind === "draw") {
          draws += 1;
          cardsSeen += 1;
        } else if (entry.kind === "cardSeen") {
          cardsSeen += 1;
        } else if (entry.kind === "mana") {
          manaProduced += entry.amount ?? 0;
        }
      }
      return { turn, entries: turnEntries, draws, manaProduced, cardsSeen };
    });
}

export function exportActionLogText(
  deckName: string,
  entries: readonly PlaytestActionLogEntry[]
): string {
  const turns = summarizeActionLog(entries).map(
    ({ turn, entries: turnEntries, draws, manaProduced, cardsSeen }) =>
      `Turn ${turn}${draws + manaProduced + cardsSeen > 0 ? `\nEvidence: ${draws} draws, ${manaProduced} mana, ${cardsSeen} additional cards seen` : ""}\n${turnEntries.map((entry) => `- ${entry.phase}: ${entry.description}`).join("\n")}`
  );
  return `${deckName} — playtest log\n\n${turns.join("\n\n")}`;
}

export function exportActionLogJson(
  deckName: string,
  entries: readonly PlaytestActionLogEntry[]
): string {
  return JSON.stringify(
    { version: 2, deckName, turns: summarizeActionLog(entries) },
    null,
    2
  );
}
