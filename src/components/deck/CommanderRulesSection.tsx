"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import {
  COMMANDER_RULE_CITATIONS,
  type CommanderRuleIssue,
} from "@/lib/deck/commander-rules-check";

interface CommanderRulesSectionProps {
  readonly issues: readonly CommanderRuleIssue[];
}

/**
 * Lists the cards the deterministic rules check found cannot work with this
 * commander, each with its Comprehensive Rules citation and a one-line reason.
 * Labelled as a rules check so it is not read as a recommendation.
 */
export function CommanderRulesSection({ issues }: CommanderRulesSectionProps) {
  const t = useTranslations("commanderRules");
  const headingId = useId();
  if (issues.length === 0) return null;

  return (
    <section aria-labelledby={headingId}>
      <p className="text-xs font-medium text-amber-400">
        <span id={headingId}>{t("title")}</span>
      </p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{t("label")}</p>
      <ul className="mt-1 space-y-1 text-xs">
        {issues.map((issue) => (
          <li key={issue.cardId}>
            <span className="font-medium text-amber-300">{issue.cardName}</span>
            <span className="text-[var(--text-secondary)]">
              {" · "}
              {t("citation", {
                rules: COMMANDER_RULE_CITATIONS[issue.rule].join(", "),
              })}
            </span>
            <span className="block text-[var(--text-secondary)]">
              {t(`reasons.${issue.rule}`)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-xs font-medium text-amber-300">{t("action")}</p>
    </section>
  );
}
