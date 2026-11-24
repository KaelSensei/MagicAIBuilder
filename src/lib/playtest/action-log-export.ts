/**
 * The playtest log summed up turn by turn, and its two exports: the text the player copies or
 * saves, and the version-3 JSON document.
 *
 * Context: playtest. `ActionLogHeader` exports through it and `useActionLogFilter` reads the
 * turn summaries. Both exports write each line in the player's language through the `lineText`
 * the caller passes (`useLogMessageText`, #1853); this module writes no sentence of its own.
 *
 * @module playtest/action-log-export
 */
import type { PlaytestActionLogEntry, PlaytestLogMessage } from "./engine";

/** Turns one recorded log line into its sentence in the player's language. */
export type LogLineText = (message: PlaytestLogMessage) => string;

/** One turn of the log, with the evidence its lines carry. */
export interface PlaytestTurnSummary {
  readonly turn: number;
  readonly entries: readonly PlaytestActionLogEntry[];
  readonly draws: number;
  readonly manaProduced: number;
  readonly cardsSeen: number;
  readonly lifeDelta: number;
  readonly countersChanged: number;
}

/** The words of the text export, in the player's language. */
export interface ActionLogTextFormat {
  readonly title: string;
  readonly turn: (turn: number) => string;
  readonly phase: (phase: PlaytestActionLogEntry["phase"]) => string;
  readonly evidenceTitle: string;
  readonly evidence: (draws: number, mana: number, seen: number) => string;
  readonly line: LogLineText;
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
      let lifeDelta = 0;
      let countersChanged = 0;
      for (const entry of turnEntries) {
        if (entry.kind === "draw") {
          draws += 1;
          cardsSeen += 1;
        } else if (entry.kind === "cardSeen") {
          cardsSeen += 1;
        } else if (entry.kind === "mana") {
          manaProduced += entry.amount ?? 0;
        } else if (entry.kind === "life") {
          lifeDelta += entry.lifeDelta ?? 0;
        } else if (entry.kind === "counter") {
          countersChanged += entry.counterDelta ?? 0;
        }
      }
      return {
        turn,
        entries: turnEntries,
        draws,
        manaProduced,
        cardsSeen,
        lifeDelta,
        countersChanged,
      };
    });
}

/**
 * The log as text: a title line, then each turn with its evidence and its lines.
 *
 * @param format - the words of the export and each line's text, in the player's language
 */
export function exportActionLogText(
  deckName: string,
  entries: readonly PlaytestActionLogEntry[],
  format: ActionLogTextFormat
): string {
  const turns = summarizeActionLog(entries).map(
    ({ turn, entries: turnEntries, draws, manaProduced, cardsSeen }) => {
      const evidence =
        draws + manaProduced + cardsSeen > 0
          ? `\n${format.evidenceTitle}: ${format.evidence(draws, manaProduced, cardsSeen)}`
          : "";
      const actions = turnEntries
        .map(
          (entry) =>
            `- ${format.phase(entry.phase)}: ${format.line(entry.message)}`
        )
        .join("\n");
      return `${format.turn(turn)}${evidence}\n${actions}`;
    }
  );
  return `${deckName} — ${format.title}\n\n${turns.join("\n\n")}`;
}

/**
 * The log as the version-3 JSON document: the turn summaries, each line with its `description`
 * in the player's language rather than the engine's message, so the document keeps the shape
 * it had when the engine wrote sentences.
 *
 * @param lineText - each line's text in the player's language
 */
export function exportActionLogJson(
  deckName: string,
  entries: readonly PlaytestActionLogEntry[],
  lineText: LogLineText
): string {
  const turns = summarizeActionLog(entries).map((summary) => ({
    ...summary,
    entries: summary.entries.map(({ message, ...entry }) => ({
      ...entry,
      description: lineText(message),
    })),
  }));
  return JSON.stringify({ version: 3, deckName, turns }, null, 2);
}
