"use client";
import { useCallback } from "react";
import { useFormatter, useTranslations } from "next-intl";
import type { AiCallDenial } from "@/lib/ai/usage/denial";

/**
 * Turns a refused AI call into the sentence shown to the player.
 *
 * The reset date is the first day of the next month in UTC, formatted in UTC
 * so a player west of Greenwich is not told the last day of this month.
 *
 * @returns a function from a denial to its localized message
 */
export function useAiDenialMessage(): (denial: AiCallDenial) => string {
  const t = useTranslations("deck.ai.limits");
  const format = useFormatter();

  return useCallback(
    (denial: AiCallDenial): string => {
      const date = format.dateTime(denial.resetsAt, {
        dateStyle: "long",
        timeZone: "UTC",
      });
      switch (denial.code) {
        case "allowance_exhausted":
          return denial.route === "build"
            ? t("buildAllowanceExhausted", { limit: denial.limit, date })
            : t("suggestAllowanceExhausted", { limit: denial.limit, date });
        case "ai_spend_ceiling_reached":
          return t("spendCeilingReached", { date });
        default: {
          const unreachable: never = denial;
          return unreachable;
        }
      }
    },
    [format, t]
  );
}
