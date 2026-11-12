/**
 * Pins the Lumen button's class set, so that exporting its variants for
 * links (master plan P1-50, audit com S-11) cannot shift what every button in
 * the app already renders.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

/** What every Lumen button carries, whatever its variant and size. */
const PILL_BASE =
  "inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50";

/** One class list, for the exact form of `toHaveClass`, which takes a single string. */
function classList(...parts: readonly string[]): string {
  return parts.join(" ");
}

describe("Button", () => {
  it("grows to the large pill of a call to action on request", () => {
    render(<Button size="lg">Start</Button>);

    expect(screen.getByRole("button", { name: "Start" })).toHaveClass(
      "rounded-[var(--lumen-radius-pill)]",
      "px-5",
      "py-2.5",
      "text-sm",
      "bg-[var(--accent)]"
    );
  });

  it("is the small violet pill by default, and a plain button rather than a submit", () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass(
      classList(
        PILL_BASE,
        "bg-[var(--accent)]",
        "text-white",
        "shadow-[var(--lumen-shadow-sm)]",
        "hover:bg-[var(--accent-hover)]",
        "rounded-[var(--lumen-radius-pill)]",
        "px-3.5",
        "py-2",
        "text-sm"
      ),
      { exact: true }
    );
  });

  it("draws the quiet outline at medium size on request, with the caller's classes last", () => {
    render(
      <Button variant="secondary" size="md" className="mt-2">
        Cancel
      </Button>
    );

    expect(screen.getByRole("button", { name: "Cancel" })).toHaveClass(
      classList(
        PILL_BASE,
        "border",
        "border-[var(--border)]",
        "bg-[var(--surface)]",
        "text-[var(--text-secondary)]",
        "hover:border-[var(--accent)]",
        "hover:bg-[var(--surface-hover)]",
        "hover:text-[var(--text-primary)]",
        "rounded-[var(--lumen-radius-pill)]",
        "px-4",
        "py-2.5",
        "text-sm",
        "mt-2"
      ),
      { exact: true }
    );
  });
});
