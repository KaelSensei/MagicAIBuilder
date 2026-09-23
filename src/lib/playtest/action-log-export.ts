import type { PlaytestActionLogEntry } from "./engine";

export interface PlaytestTurnSummary {
  readonly turn: number;
  readonly entries: readonly PlaytestActionLogEntry[];
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
    .map(([turn, turnEntries]) => ({ turn, entries: turnEntries }));
}

export function exportActionLogText(
  deckName: string,
  entries: readonly PlaytestActionLogEntry[]
): string {
  const turns = summarizeActionLog(entries).map(
    ({ turn, entries: turnEntries }) =>
      `Turn ${turn}\n${turnEntries.map((entry) => `- ${entry.phase}: ${entry.description}`).join("\n")}`
  );
  return `${deckName} — playtest log\n\n${turns.join("\n\n")}`;
}

export function exportActionLogJson(
  deckName: string,
  entries: readonly PlaytestActionLogEntry[]
): string {
  return JSON.stringify(
    { version: 1, deckName, turns: summarizeActionLog(entries) },
    null,
    2
  );
}
