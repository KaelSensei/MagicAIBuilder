"use client";
/**
 * The note on an editor row whose card a rulebreaker commander admits
 * (CR 903.5e): "Allowed by <commander>", which opens the reason in plain
 * words. Without it an off-colour card with no identity violation reads as a
 * mistake (I-03 scope line of 2026-11-16).
 *
 * Renders the domain's answer only (`rulebreakerAdmissions` in
 * `lib/deck/color-identity.ts`); it decides nothing. A native `<details>`
 * disclosure: the keyboard reaches and opens it with no listener, and the
 * summary is described by the reason, so a screen reader hears both.
 *
 * @module deck/RulebreakerAdmissionNote
 */
import { useId } from "react";
import { useTranslations } from "next-intl";
import type {
  AdmittingExceptionKind,
  RulebreakerAdmission,
} from "@/modules/format-rules";

/** The catalog key of each admitting exception's reason. */
const REASON_KEY: Readonly<
  Record<AdmittingExceptionKind, "identity" | "anyLand" | "anyBasicLand">
> = {
  "ignore-identity-for": "identity",
  "any-land": "anyLand",
  "any-basic-land": "anyBasicLand",
};

interface RulebreakerAdmissionNoteProps {
  /** The row's admission; nothing renders when it is undefined */
  readonly admission: RulebreakerAdmission | undefined;
  /** The card's name, as the reason names it */
  readonly cardName: string;
}

/**
 * Names the commander that admits the row's card, with the rule on demand.
 *
 * @param props - The row's admission and its card's name
 * @returns The note, or null when the card needs no admission
 */
export function RulebreakerAdmissionNote({
  admission,
  cardName,
}: RulebreakerAdmissionNoteProps) {
  const t = useTranslations("builder.rulebreakerAdmission");
  const reasonId = useId();
  if (!admission) return null;
  const commander = admission.rulebreaker;
  return (
    <details className="relative shrink-0">
      <summary
        aria-describedby={reasonId}
        className="block max-w-36 cursor-pointer list-none truncate rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] [&::-webkit-details-marker]:hidden"
      >
        {t("note", { commander })}
      </summary>
      <p
        id={reasonId}
        role="note"
        className="absolute right-0 top-full z-30 mt-1 w-64 rounded-md border border-[var(--border)] bg-[var(--surface)] p-2 text-xs text-[var(--text-primary)] shadow-xl"
      >
        {t(`reason.${REASON_KEY[admission.exception]}`, {
          card: cardName,
          commander,
        })}
      </p>
    </details>
  );
}
