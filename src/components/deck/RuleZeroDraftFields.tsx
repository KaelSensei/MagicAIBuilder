"use client";

/**
 * The declared inputs of a Rule 0 sheet: speed, wins, presences, proxies
 * and house rules. The editor owns the state; this only renders it.
 *
 * @module deck/RuleZeroDraftFields
 */
import { useTranslations } from "next-intl";
import { RuleZeroPresenceField } from "@/components/deck/RuleZeroPresenceField";
import { isSheetSpeed, SHEET_SPEEDS } from "@/lib/rule-zero/sheet";
import type { RuleZeroFormState } from "@/components/deck/use-rule-zero-form";

interface RuleZeroDraftFieldsProps {
  /** Id prefix for the win-conditions hint. */
  readonly titleId: string;
  readonly form: RuleZeroFormState;
}

/** The inputs a player fills in. */
export function RuleZeroDraftFields({
  titleId,
  form,
}: RuleZeroDraftFieldsProps) {
  const t = useTranslations("ruleZero");

  return (
    <>
      <label className="block text-sm text-[var(--text-secondary)]">
        {t("speed")}
        <select
          className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1"
          value={form.speed}
          onChange={(event) => {
            if (isSheetSpeed(event.target.value))
              form.setSpeed(event.target.value);
          }}
        >
          {SHEET_SPEEDS.map((option) => (
            <option key={option} value={option}>
              {t(`speeds.${option}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm text-[var(--text-secondary)]">
        {t("winConditions")}
        <textarea
          className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1"
          value={form.winConditions}
          aria-describedby={`${titleId}-wins`}
          onChange={(event) => form.setWinConditions(event.target.value)}
        />
      </label>
      <span
        id={`${titleId}-wins`}
        className="text-xs text-[var(--text-secondary)]"
      >
        {t("winConditionsHint")}
      </span>
      <RuleZeroPresenceField
        labelKey="combos"
        value={form.combos}
        onChange={form.setCombos}
      />
      <RuleZeroPresenceField
        labelKey="extraTurns"
        value={form.extraTurns}
        onChange={form.setExtraTurns}
      />
      <RuleZeroPresenceField
        labelKey="resourceDenial"
        value={form.resourceDenial}
        onChange={form.setResourceDenial}
      />
      <label className="block text-sm text-[var(--text-secondary)]">
        {t("proxyCount")}
        <input
          className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1"
          inputMode="numeric"
          value={form.proxyCount}
          onChange={(event) => form.setProxyCount(event.target.value)}
        />
      </label>
      <label className="block text-sm text-[var(--text-secondary)]">
        {t("houseRules")}
        <textarea
          className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1"
          value={form.houseRules}
          onChange={(event) => form.setHouseRules(event.target.value)}
        />
      </label>
    </>
  );
}
