"use client";
/**
 * The player's counters and designations beside the life tracker: poison, energy and experience
 * counters, the monarch, the initiative, the Ring's temptations, day and night, and the city's
 * blessing, each written as a word or a number with the buttons that change it.
 *
 * Context: playtest, the UI. The engine owns the rules (`designations.ts`); this component reads
 * `engine.designations` and dispatches one command per tap, so undo and the action log come with
 * it. Its buttons are disabled where the engine would refuse the change, with the engine's own
 * policies. Offered in every format.
 * Rules: ten poison counters lose the game (CR 104.3d, 704.5c); one monarch and one initiative at
 * a time (CR 725.3, 726.3); the game starts with neither day nor night (CR 731.1); the city's
 * blessing stays for the game (CR 702.131a).
 * Not responsible for: inferring any value from Oracle text, opponents' counters, or the life
 * total (`LifeTracker.tsx`).
 */
import { useId, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  hasCitysBlessing,
  hasLostOnPoison,
  isAlreadyDayNight,
  refusesCounterChange,
  type DayOrNight,
  type PlayerCounterKind,
  type PlaytestCommand,
  type PlaytestEngine,
  type ToggledDesignation,
} from "@/lib/playtest/engine";

interface DesignationsPanelProps {
  /** The current game; every value is read from it. */
  readonly engine: PlaytestEngine;
  /** The store's `dispatch`: each tap sends one command. */
  readonly onDispatch: (command: PlaytestCommand) => void;
}

const COUNTERS: readonly PlayerCounterKind[] = [
  "poison",
  "energy",
  "experience",
];
const TOGGLES: readonly ToggledDesignation[] = ["monarch", "initiative"];
const DAY_OR_NIGHT: readonly DayOrNight[] = ["day", "night"];

/** The message keys of each toggled designation: its state, and the button in each state. */
const TOGGLE_KEYS = {
  monarch: { state: "monarch", take: "becomeMonarch", lose: "loseMonarch" },
  initiative: {
    state: "initiative",
    take: "takeInitiative",
    lose: "loseInitiative",
  },
} as const;

const DAY_NIGHT_KEYS = { day: "becomeDay", night: "becomeNight" } as const;

const BUTTON_CLASS =
  "shrink-0 rounded px-2 py-1 bg-[var(--surface-hover)] text-[var(--text-primary)] transition-colors hover:bg-purple-600/30 disabled:cursor-not-allowed disabled:opacity-50";

/** "yes" or "no", the value the messages' `select` reads for a designation the player has. */
const yesNo = (has: boolean): "yes" | "no" => (has ? "yes" : "no");

/**
 * Shows the player's counters and designations and records the player's taps.
 *
 * @param props - the game and the store's dispatch
 * @returns the panel, in every format
 */
export function DesignationsPanel({
  engine,
  onDispatch,
}: DesignationsPanelProps) {
  const t = useTranslations("playtest.designations");
  const titleId = useId();
  const { designations } = engine;

  return (
    <section
      aria-labelledby={titleId}
      className="bg-[var(--surface)] rounded-xl p-4 space-y-3"
    >
      <h3
        id={titleId}
        className="text-[var(--text-primary)] font-semibold text-sm"
      >
        {t("title")}
      </h3>
      <p className="text-xs text-[var(--text-secondary)]">{t("hint")}</p>
      <ul className="space-y-2">
        {COUNTERS.map((counter) => (
          <CounterRow
            key={counter}
            engine={engine}
            counter={counter}
            onDispatch={onDispatch}
          />
        ))}
        {TOGGLES.map((designation) => {
          const keys = TOGGLE_KEYS[designation];
          const has = designations[designation];
          return (
            <Row key={designation} status={t(keys.state, { has: yesNo(has) })}>
              <ActionButton
                label={t(has ? keys.lose : keys.take)}
                onClick={() =>
                  onDispatch({ type: "toggleDesignation", designation })
                }
              />
            </Row>
          );
        })}
        <Row status={t("ring", { count: designations.ringTemptations })}>
          <ActionButton
            label={t("ringTempts")}
            onClick={() => onDispatch({ type: "ringTempts" })}
          />
        </Row>
        <Row status={t("dayNight", { state: designations.dayNight })}>
          {DAY_OR_NIGHT.map((dayNight) => (
            <ActionButton
              key={dayNight}
              label={t(DAY_NIGHT_KEYS[dayNight])}
              disabled={isAlreadyDayNight(engine, { dayNight })}
              onClick={() => onDispatch({ type: "setDayNight", dayNight })}
            />
          ))}
        </Row>
        <Row status={t("blessing", { has: yesNo(hasCitysBlessing(engine)) })}>
          <ActionButton
            label={t("getBlessing")}
            disabled={hasCitysBlessing(engine)}
            onClick={() => onDispatch({ type: "gainCitysBlessing" })}
          />
        </Row>
      </ul>
    </section>
  );
}

interface CounterRowProps {
  readonly engine: PlaytestEngine;
  readonly counter: PlayerCounterKind;
  readonly onDispatch: (command: PlaytestCommand) => void;
}

/** One counter's count, its add and remove buttons, and the poison loss mark at ten. */
function CounterRow({ engine, counter, onDispatch }: CounterRowProps) {
  const t = useTranslations("playtest.designations");
  const count = engine.designations[counter];
  const change = (amount: number) =>
    onDispatch({ type: "playerCounter", counter, amount });
  const lost = counter === "poison" && hasLostOnPoison(engine);

  return (
    <Row status={t("counter", { counter, count })}>
      <button
        type="button"
        aria-label={t("remove", { counter })}
        disabled={refusesCounterChange(engine, { counter, amount: -1 })}
        onClick={() => change(-1)}
        className={BUTTON_CLASS}
      >
        −1
      </button>
      <button
        type="button"
        aria-label={t("add", { counter })}
        onClick={() => change(1)}
        className={BUTTON_CLASS}
      >
        +1
      </button>
      {lost && (
        <p className="w-full font-bold text-red-400">{t("poisonLost")}</p>
      )}
    </Row>
  );
}

/** One line of the panel: the state as text, then its controls. */
function Row({
  status,
  children,
}: {
  readonly status: string;
  readonly children: ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center gap-2 text-xs">
      <span className="mr-auto text-[var(--text-primary)] tabular-nums">
        {status}
      </span>
      {children}
    </li>
  );
}

interface ActionButtonProps {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
}

/** A native button whose visible text is its accessible name. */
function ActionButton({ label, onClick, disabled = false }: ActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={BUTTON_CLASS}
    >
      {label}
    </button>
  );
}
