import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/components/ui/utils";

const buttonVariants = cva(
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
        icon: "rounded-[var(--lumen-radius-pill)] p-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "sm",
    },
  }
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {}

/**
 * Lumen button. Primary is the violet pill; secondary is a quiet outline.
 *
 * @param props - native button attributes plus `variant` and `size`
 * @returns the button element
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
