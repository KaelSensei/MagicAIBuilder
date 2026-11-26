"use client";
/**
 * The note on an editor row or grid tile whose card a rulebreaker commander admits
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
import { cn } from "@/components/ui/utils";
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

/**
 * Where the note sits: at the end of a list row, or under a grid tile's
 * image. The two differ in layout only.
 */
export type RulebreakerAdmissionNoteLayout = "row" | "tile";

/** The classes a placement adds to each part of the note. */
interface LayoutClasses {
  readonly details: string;
  readonly summary: string;
  readonly reason: string;
}

/** The layout classes of each placement; everything else is shared. */
const LAYOUT_CLASSES: Readonly<
  Record<RulebreakerAdmissionNoteLayout, LayoutClasses>
> = {
  // The reason floats over the rows below, aligned to the row's end.
  row: {
    details: "relative shrink-0",
    summary: "max-w-36",
    reason: "absolute right-0 top-full z-30 w-64 shadow-xl",
  },
  // A tile can be one narrow column at the screen's edge, so the reason
  // stays in the tile's flow, as wide as the tile, instead of overflowing.
  tile: {
    details: "mt-1 min-w-0",
    summary: "w-full text-center",
    reason: "",
  },
};

interface RulebreakerAdmissionNoteProps {
  /** The row's admission; nothing renders when it is undefined */
  readonly admission: RulebreakerAdmission | undefined;
  /** The card's name, as the reason names it */
  readonly cardName: string;
  /** Where the note sits; a list row by default */
  readonly layout?: RulebreakerAdmissionNoteLayout;
}

/**
 * Names the commander that admits the row's card, with the rule on demand.
 *
 * @param props - The row's admission, its card's name and the note's layout
 * @returns The note, or null when the card needs no admission
 */
export function RulebreakerAdmissionNote({
  admission,
  cardName,
  layout = "row",
}: RulebreakerAdmissionNoteProps) {
  const t = useTranslations("builder.rulebreakerAdmission");
  const reasonId = useId();
  if (!admission) return null;
  const commander = admission.rulebreaker;
  const classes = LAYOUT_CLASSES[layout];
  return (
    <details className={classes.details}>
      <summary
        aria-describedby={reasonId}
        className={cn(
          "block cursor-pointer list-none truncate rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] [&::-webkit-details-marker]:hidden",
          classes.summary
        )}
      >
        {t("note", { commander })}
      </summary>
      <p
        id={reasonId}
        role="note"
        className={cn(
          "mt-1 rounded-md border border-[var(--border)] bg-[var(--surface)] p-2 text-xs text-[var(--text-primary)]",
          classes.reason
        )}
      >
        {t(`reason.${REASON_KEY[admission.exception]}`, {
          card: cardName,
          commander,
        })}
      </p>
    </details>
  );
}
