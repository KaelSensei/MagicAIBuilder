/**
 * The Lumen text field and the chrome it shares with text areas and selects.
 *
 * Shared kernel (app shell). On focus a field shows the app's one indicator,
 * the `--focus-ring` outline of `focus.ts`, and its border turns
 * `--focus-ring` too. The selector is `:focus-visible`, on purpose: browsers
 * match it on every focus of a field that takes typed text, mouse included
 * (https://www.w3.org/TR/selectors-4/#the-focus-visible-pseudo, read
 * 2026-11-26), while a select clicked with the mouse stays as quiet as a
 * clicked button. The old focus only swapped the border from `--border` to
 * `--accent`, a 1.34:1 change (design audit S1).
 *
 * @module components/ui/Input
 */
import type { InputHTMLAttributes } from "react";
import { focusRingClassName } from "@/components/ui/focus";
import { cn } from "@/components/ui/utils";

/** Chrome shared by text fields: soft inset, generous radius, the shared focus outline. */
export const fieldShellClassName = `rounded-[var(--lumen-radius-pill)] border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--text-primary)] shadow-[var(--lumen-shadow-sm)] transition-[border-color,box-shadow] placeholder:text-[var(--text-secondary)] focus-visible:border-[var(--focus-ring)] ${focusRingClassName}`;

/** Same chrome as a field, with a larger radius so multiline text stays readable. */
export const textAreaShellClassName = `w-full resize-y rounded-[var(--lumen-radius-lg)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-[var(--lumen-shadow-sm)] transition-[border-color,box-shadow] placeholder:text-[var(--text-secondary)] focus-visible:border-[var(--focus-ring)] ${focusRingClassName}`;

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
