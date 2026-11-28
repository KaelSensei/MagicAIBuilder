/**
 * The field shells draw the app's one focus indicator.
 *
 * Before (design audit S1, 2026-11-25), a field hid its outline and swapped
 * its border from `--border` to `--accent` with an `--accent-soft` ring: a
 * 1.34:1 change from rest, under the 3:1 of WCAG 2.2 SC 1.4.11. The shell now
 * shows the shared `--focus-ring` outline. A text field matches
 * `:focus-visible` on mouse focus too, so the outline shows however the field
 * was reached; the end-to-end spec `e2e/focus-visible.spec.ts` measures it in
 * a browser.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input, textAreaShellClassName } from "./Input";

/** The shared focus outline, as `focus.ts` spells it. */
const FOCUS_OUTLINE = [
  "outline-[var(--focus-ring)]",
  "[outline-width:2px]",
  "outline-offset-2",
  "focus-visible:outline-solid",
] as const;

describe("Input", () => {
  it("draws the shared focus outline and a --focus-ring border, and nothing hides it", () => {
    render(<Input aria-label="Deck name" />);

    const field = screen.getByRole("textbox", { name: "Deck name" });
    expect(field).toHaveClass(
      ...FOCUS_OUTLINE,
      "focus-visible:border-[var(--focus-ring)]"
    );
    expect(field).not.toHaveClass("outline-none");
  });
});

describe("textAreaShellClassName", () => {
  it("gives a text area the same focus outline and border", () => {
    render(
      <textarea aria-label="Comment" className={textAreaShellClassName} />
    );

    const field = screen.getByRole("textbox", { name: "Comment" });
    expect(field).toHaveClass(
      ...FOCUS_OUTLINE,
      "focus-visible:border-[var(--focus-ring)]"
    );
    expect(field).not.toHaveClass("outline-none");
  });
});
