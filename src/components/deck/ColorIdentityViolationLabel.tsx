"use client";
/**
 * The words on an editor row or grid tile whose card's colour identity leaves
 * the commander's (CR 903.5c). The red ring alone told only the players who
 * see red, which WCAG 1.4.1 (use of colour) forbids as the sole signal.
 *
 * Renders the editor's answer only (`getColorIdentityViolations` in
 * `lib/deck/color-identity.ts`); it decides nothing. A card a rulebreaker
 * commander admits is no violation and carries `RulebreakerAdmissionNote`.
 *
 * @module deck/ColorIdentityViolationLabel
 */
import { useTranslations } from "next-intl";
import { cn } from "@/components/ui/utils";

interface ColorIdentityViolationLabelProps {
  /** Whether the card is outside the commander's colour identity */
  readonly isViolation: boolean;
  /** The placement classes of the row or tile that holds the label */
  readonly className?: string;
}

/**
 * Says that the card is outside the commander's colour identity.
 *
 * @param props - Whether the card violates the identity, and its placement
 * @returns The label, or null for a card the identity allows
 */
export function ColorIdentityViolationLabel({
  isViolation,
  className,
}: ColorIdentityViolationLabelProps) {
  const t = useTranslations("builder");
  if (!isViolation) return null;
  return (
    <span
      className={cn(
        "truncate rounded border border-red-500/60 px-1.5 py-0.5 text-[10px] text-red-400",
        className
      )}
    >
      {t("colorIdentityViolation")}
    </span>
  );
}
