"use client";
/**
 * One card's movement between the two compared EDHREC snapshots: an arrow, the
 * change in inclusion points, the card's name and, for a card seen at one end
 * only, the note that says so.
 *
 * Meta-insights context, `ui/`. Presentational: the shifts section decides
 * which movements to list. The arithmetic behind the values is in
 * `domain/history.ts`.
 *
 * @module meta-insights/ui/MetaShiftRow
 */
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowDownRight, ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@/components/ui/utils";
import {
  shiftMagnitude,
  type MetaShift,
} from "@/modules/meta-insights/domain/history";

/** The movement one row shows. */
export interface MetaShiftRowProps {
  readonly shift: MetaShift;
}

/**
 * A movement row. The four variants are rendered differently on purpose. `rose`
 * and `fell` carry a measured delta; `entered` and `left` carry a **bound**,
 * because the card is listed at only one end and EDHREC's list is truncated at
 * 20: the unseen end is somewhere below that snapshot's cut-off and was never
 * recorded. Printing "−78 pts" for a card that merely dropped out would report
 * a collapse that the data cannot support, so those two read "≤" / "≥" and say
 * why on hover. A `steady` shift renders nothing: the section filters them out
 * before the list is built, and the case is handled here so the guard below is
 * a real exhaustiveness check and not a `default` that swallows a variant
 * added later.
 */
export function MetaShiftRow({ shift }: MetaShiftRowProps) {
  const t = useTranslations("deck");
  const points = Math.round(shiftMagnitude(shift) * 100);

  switch (shift.kind) {
    case "rose":
    case "fell": {
      const up = shift.kind === "rose";
      const Icon = up ? ArrowUpRight : ArrowDownRight;
      return (
        <ShiftLine
          name={shift.name}
          tone={up ? "up" : "down"}
          icon={<Icon className="w-3 h-3" aria-hidden="true" />}
          label={t("meta.shifts.points", {
            points: up ? `+${points}` : `-${points}`,
          })}
        />
      );
    }
    case "entered":
      return (
        <ShiftLine
          name={shift.name}
          tone="up"
          icon={<Sparkles className="w-3 h-3" aria-hidden="true" />}
          label={t("meta.shifts.atLeast", { points: `+${points}` })}
          note={t("meta.shifts.entered")}
          title={t("meta.shifts.enteredHint")}
        />
      );
    case "left":
      return (
        <ShiftLine
          name={shift.name}
          tone="down"
          icon={<ArrowDownRight className="w-3 h-3" aria-hidden="true" />}
          label={t("meta.shifts.atMost", { points: `-${points}` })}
          note={t("meta.shifts.left")}
          title={t("meta.shifts.leftHint")}
        />
      );
    case "steady":
      return null;
    default: {
      const exhaustive: never = shift;
      return exhaustive;
    }
  }
}

interface ShiftLineProps {
  readonly name: string;
  /** Green for a rise or an entry, red for a fall or an exit. */
  readonly tone: "up" | "down";
  readonly icon: ReactNode;
  /** The value, already worded: "+15 pts", "≥ +5 pts", … */
  readonly label: string;
  /** "New in the list" / "Out of the list", for the bounded variants only. */
  readonly note?: string;
  /** The hover text that explains a bound. */
  readonly title?: string;
}

/** The line every variant renders: value, name and, when given, the note. */
function ShiftLine({ name, tone, icon, label, note, title }: ShiftLineProps) {
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] transition-colors"
      title={title}
    >
      <span
        className={cn(
          "shrink-0 flex items-center gap-0.5 text-[10px] font-semibold tabular-nums",
          tone === "up" ? "text-green-400" : "text-red-400"
        )}
      >
        {icon}
        {label}
      </span>
      <span className="flex-1 min-w-0 text-xs text-[var(--text-primary)] truncate">
        {name}
      </span>
      {note && (
        <span className="shrink-0 text-[10px] text-[var(--text-secondary)]">
          {note}
        </span>
      )}
    </div>
  );
}
