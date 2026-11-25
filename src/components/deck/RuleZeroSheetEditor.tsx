"use client";

/**
 * The form for one deck's Rule 0 sheet (I-15 slice 1).
 *
 * Deck building, ui. It shows the fields the player declared and saves only
 * those. It has no share control and no computed bracket: the sheet is
 * private, and a calculated column is a later slice.
 *
 * @module deck/RuleZeroSheetEditor
 */
import { useId } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { RuleZeroDraftFields } from "@/components/deck/RuleZeroDraftFields";
import { useRuleZeroForm } from "@/components/deck/use-rule-zero-form";
import type { RuleZeroSheetDraft } from "@/lib/rule-zero/sheet";

interface RuleZeroSheetEditorProps {
  /** The sheet as last loaded or saved. */
  readonly initial: RuleZeroSheetDraft;
  /** True when the owner has not stored a sheet yet. */
  readonly empty: boolean;
  readonly saving: boolean;
  readonly problem: "invalid" | "unavailable" | null;
  readonly saved: boolean;
  readonly onSave: (draft: RuleZeroSheetDraft) => void;
}

/** The `ruleZero` message the status line reads, or null when it stays empty. */
type SheetStatusKey = "invalid" | "unavailable" | "saved";

/**
 * Picks the status line: an invalid sheet first, then an unavailable save,
 * then a confirmed save.
 *
 * @param localInvalid - True when the form refused the draft before saving
 * @param outcome - The last save's problem and whether it succeeded
 * @returns The message key, or null for an empty status line
 */
function sheetStatusKey(
  localInvalid: boolean,
  outcome: Pick<RuleZeroSheetEditorProps, "problem" | "saved">
): SheetStatusKey | null {
  if (localInvalid || outcome.problem === "invalid") return "invalid";
  if (outcome.problem === "unavailable") return "unavailable";
  return outcome.saved ? "saved" : null;
}

/** Declared fields, a disclaimer, and a save action. */
export function RuleZeroSheetEditor(props: RuleZeroSheetEditorProps) {
  const t = useTranslations("ruleZero");
  const titleId = useId();
  const form = useRuleZeroForm(props.initial, props.onSave);
  const statusKey = sheetStatusKey(form.localInvalid, props);
  const status = statusKey === null ? "" : t(statusKey);

  return (
    <form
      aria-labelledby={titleId}
      className="space-y-3 p-3"
      onSubmit={form.save}
    >
      <h3
        id={titleId}
        className="text-sm font-semibold text-[var(--text-primary)]"
      >
        {t("title")}
      </h3>
      <p className="text-sm text-[var(--text-secondary)]">{t("disclaimer")}</p>
      <p className="text-sm text-[var(--text-secondary)]">{t("privateNote")}</p>
      {props.empty ? (
        <p className="text-sm text-[var(--text-secondary)]">{t("empty")}</p>
      ) : null}
      <RuleZeroDraftFields titleId={titleId} form={form} />
      <Button type="submit" disabled={props.saving}>
        {props.saving ? t("saving") : t("save")}
      </Button>
      <p className="text-sm text-[var(--text-secondary)]">
        <output>{status}</output>
      </p>
    </form>
  );
}
