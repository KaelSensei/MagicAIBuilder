import type { InputHTMLAttributes } from "react";
import { cn } from "@/components/ui/utils";

/** Chrome shared by text fields: soft inset, generous radius, violet focus. */
export const fieldShellClassName =
  "rounded-[var(--lumen-radius-pill)] border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--text-primary)] shadow-[var(--lumen-shadow-sm)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]";

/** Same chrome as a field, with a larger radius so multiline text stays readable. */
export const textAreaShellClassName =
  "w-full resize-y rounded-[var(--lumen-radius-lg)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-[var(--lumen-shadow-sm)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]";

/**
 * Single-line Lumen field.
 *
 * @param props - native input attributes; className is merged onto the shell
 * @returns the input element
 */
export function Input({
  className,
  type = "text",
  ...props
}: Readonly<InputHTMLAttributes<HTMLInputElement>>) {
  return (
    <input
      type={type}
      className={cn(fieldShellClassName, "px-4 py-2.5", className)}
      {...props}
    />
  );
}
