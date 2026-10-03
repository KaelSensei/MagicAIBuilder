"use client";

import { Dices } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DiceRoll } from "@/lib/playtest/engine";

interface DiceRollerProps {
  readonly rolls: readonly DiceRoll[];
  readonly onRoll: (sides: number) => void;
}

export function DiceRoller({ rolls, onRoll }: DiceRollerProps) {
  const t = useTranslations("playtest.dice");
  const latest = rolls.at(-1);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[var(--surface)] px-4 py-3">
      <Dices className="h-4 w-4 text-purple-300" aria-hidden="true" />
      <span className="mr-1 text-xs font-medium text-white/60">{t("title")}</span>
      {[6, 20].map((sides) => (
        <button
          key={sides}
          type="button"
          onClick={() => onRoll(sides)}
          className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white/80 transition-colors hover:border-purple-400/50 hover:bg-purple-500/15"
        >
          {t("roll", { sides })}
        </button>
      ))}
      {latest && (
        <output
          aria-label={t("latest")}
          className="ml-auto flex items-baseline gap-1 rounded-lg bg-purple-500/15 px-3 py-1 text-purple-100"
        >
          <span className="text-[10px] text-purple-300/70">d{latest.sides}</span>
          <strong className="text-lg leading-none">{latest.result}</strong>
        </output>
      )}
    </div>
  );
}
