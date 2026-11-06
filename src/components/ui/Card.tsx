import type { HTMLAttributes } from "react";
import { cn } from "@/components/ui/utils";

/** Raised Lumen surface: generous corner, hairline border, soft shadow. */
export const cardSurfaceClassName =
  "rounded-[var(--lumen-radius-xl)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--lumen-shadow-sm)]";

/**
 * A Lumen card.
 *
 * @param props - native div attributes; className is merged onto the surface
 * @returns the card element
 */
export function Card({
  className,
  ...props
}: Readonly<HTMLAttributes<HTMLDivElement>>) {
  return <div className={cn(cardSurfaceClassName, className)} {...props} />;
}
