/**
 * The Lumen button: a pill in three looks (violet, quiet outline, ghost) and
 * four sizes.
 *
 * Shared kernel (app shell). `buttonVariants` is the one source of the pill's
 * classes: `Button` renders it as a `<button>`, and `ButtonLink` (its own
 * module, so that this one stays free of next-intl) renders it as a localized
 * link, so a call to action and a form button cannot drift apart
 * (master plan P1-50).
 *
 * @module components/ui/Button
 */
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/components/ui/utils";

/**
 * The class list of a Lumen pill for a variant and a size; primary and small
 * when none is given.
 *
 * Sizes: `sm` and `md` are the in-app buttons, `lg` the landing's call to
 * action, `icon` a square pill around one icon. Pass the caller's classes
 * after it through `cn`, so a spacing utility they add replaces the base one.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent)] text-white shadow-[var(--lumen-shadow-sm)] hover:bg-[var(--accent-hover)]",
        secondary:
          "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
        ghost:
          "text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]",
      },
      size: {
        sm: "rounded-[var(--lumen-radius-pill)] px-3.5 py-2 text-sm",
        md: "rounded-[var(--lumen-radius-pill)] px-4 py-2.5 text-sm",
        lg: "rounded-[var(--lumen-radius-pill)] px-5 py-2.5 text-sm",
        icon: "rounded-[var(--lumen-radius-pill)] p-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "sm",
    },
  }
);

/** The `variant` and `size` props shared by `Button` and `ButtonLink`. */
export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantProps {}

/**
 * Lumen button. Primary is the violet pill; secondary is a quiet outline.
 * A plain `button` unless the caller asks for `submit`, so a button inside a
 * form never submits it by accident.
 *
 * @param props - native button attributes plus `variant` and `size`
 */
export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: Readonly<ButtonProps>) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
