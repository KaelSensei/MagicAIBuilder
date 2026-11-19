"use client";
/**
 * The commander-damage tally beside the life tracker: the player types the combat damage a
 * commander dealt, then records it against one imagined opponent, and sees each opponent's total
 * per commander and the loss at 21 (CR 903.10a, 704.6c).
 *
 * Context: playtest, the UI. The engine owns the rule and the view (`commanderDamageByOpponent`);
 * this component renders that view and dispatches one `commanderDamage` command per tap, so undo
 * and the action log come with it. It renders nothing when the game offers no tally: Brawl
 * (CR 903.12h), Oathbreaker, the constructed formats, or a deck without a commander.
 * Not responsible for: opponents' life totals or damage the player takes.
 */
import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocalizedDeckName } from "@/components/card/LocalizedDeckTextContext";
import {
  commanderDamageByOpponent,
  isCommanderDamageAmount,
  type CommanderDamageFromCommander,
  type OpponentCommanderDamage,
  type PlaytestCommand,
  type PlaytestEngine,
} from "@/lib/playtest/engine";

interface CommanderDamageTallyProps {
  /** The current game; the tally is read from it. */
  readonly engine: PlaytestEngine;
  /** The store's `dispatch`: each tap sends one `commanderDamage` command. */
  readonly onDispatch: (command: PlaytestCommand) => void;
}

/** The amount typed, when it is one the engine accepts (a whole number above zero), else null. */
function parseAmount(text: string): number | null {
  if (text.trim() === "") return null;
  const amount = Number(text);
  return isCommanderDamageAmount(amount) ? amount : null;
}

/**
 * Shows the commander-damage tally of a Commander playtest and records the player's taps.
 *
 * The record buttons stay disabled until the amount is a whole number above zero, the same
 * check the engine makes, so a refused amount never looks recorded.
 *
 * @param props - the game and the store's dispatch
 * @returns the tally panel, or nothing when the game offers no tally
 */
export function CommanderDamageTally({
  engine,
  onDispatch,
}: CommanderDamageTallyProps) {
  const t = useTranslations("playtest.commanderDamage");
  const amountId = useId();
  const [amountText, setAmountText] = useState("");
  const seats = useMemo(() => commanderDamageByOpponent(engine), [engine]);
  if (seats.length === 0) return null;

  const amount = parseAmount(amountText);
  const record = (opponent: number, commanderId: string) => {
    if (amount === null) return;
    onDispatch({ type: "commanderDamage", opponent, commanderId, amount });
  };

  return (
    <section className="bg-[var(--surface)] rounded-xl p-4 space-y-3">
      <h3 className="text-[var(--text-primary)] font-semibold text-sm">
        {t("title")}
      </h3>
      <p className="text-xs text-[var(--text-secondary)]">{t("hint")}</p>
      <div className="flex items-center gap-2">
        <label
          htmlFor={amountId}
          className="text-xs text-[var(--text-secondary)]"
        >
          {t("amount")}
        </label>
        <input
          id={amountId}
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={amountText}
          onChange={(event) => setAmountText(event.target.value)}
          className="w-20 bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-2 py-1 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
        />
      </div>
      {seats.map((seat) => (
        <OpponentTally
          key={seat.opponent}
          seat={seat}
          canRecord={amount !== null}
          onRecord={record}
        />
      ))}
    </section>
  );
}

interface OpponentTallyProps {
  readonly seat: OpponentCommanderDamage;
  readonly canRecord: boolean;
  readonly onRecord: (opponent: number, commanderId: string) => void;
}

/** One imagined opponent: a total and a record button per commander, and the loss mark. */
function OpponentTally({ seat, canRecord, onRecord }: OpponentTallyProps) {
  const t = useTranslations("playtest.commanderDamage");

  return (
    <fieldset className="m-0 min-w-0 space-y-1 rounded-lg border-0 bg-[var(--surface-hover)] p-2">
      <legend className="float-left w-full text-xs font-semibold text-[var(--text-primary)]">
        {t("opponent", { number: seat.opponent })}
      </legend>
      {seat.hasLost && (
        <p className="clear-both text-xs font-bold text-red-400">{t("lost")}</p>
      )}
      <ul className="clear-both space-y-1">
        {seat.fromCommanders.map((tally) => (
          <CommanderRow
            key={tally.commanderId}
            opponent={seat.opponent}
            tally={tally}
            canRecord={canRecord}
            onRecord={onRecord}
          />
        ))}
      </ul>
    </fieldset>
  );
}

interface CommanderRowProps {
  readonly opponent: number;
  readonly tally: CommanderDamageFromCommander;
  readonly canRecord: boolean;
  readonly onRecord: (opponent: number, commanderId: string) => void;
}

/** One commander's total against one opponent, with its record button. */
function CommanderRow({
  opponent,
  tally,
  canRecord,
  onRecord,
}: CommanderRowProps) {
  const t = useTranslations("playtest.commanderDamage");
  const commander = useLocalizedDeckName(tally.commanderName);

  return (
    <li className="flex items-center justify-between gap-2 text-xs">
      <span className="min-w-0 truncate text-[var(--text-primary)] tabular-nums">
        {t("fromCommander", { damage: tally.damage, commander })}
      </span>
      <button
        type="button"
        disabled={!canRecord}
        onClick={() => onRecord(opponent, tally.commanderId)}
        aria-label={t("recordFrom", { commander, number: opponent })}
        className="shrink-0 rounded px-2 py-1 bg-red-600/20 text-red-300 transition-colors hover:bg-red-600/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t("record")}
      </button>
    </li>
  );
}
