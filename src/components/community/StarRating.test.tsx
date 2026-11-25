import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { renderWithProviders } from "@/test/render";
import { StarRating } from "./StarRating";

// The whole `deck.ratings` block was English in the French catalog, and the
// average was interpolated as a raw number ("4.5") rather than formatted.
describe("StarRating", () => {
  it("reads the average in French with a decimal comma", () => {
    renderWithIntl(<StarRating value={4.5} />, { locale: "fr" });

    expect(screen.getByLabelText("4,5 sur 5")).toBeInTheDocument();
  });

  it("names each star choice in French", () => {
    renderWithIntl(<StarRating value={0} onSelect={() => undefined} />, {
      locale: "fr",
    });

    expect(
      screen.getByRole("button", { name: "Noter 1 étoile" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Noter 5 étoiles" })
    ).toBeInTheDocument();
  });
});

// I-04 (#1768): the review form's stars were 18 px buttons with no focus
// ring. WCAG 2.2 SC 2.5.8 asks for a 24×24 CSS px target and SC 2.4.7 for a
// visible focus, so the button grows around an icon that keeps its size.
describe("StarRating as an input", () => {
  it.each(["sm", "md"] as const)(
    "gives every %s star a target at least 24 px wide and high",
    (size) => {
      renderWithProviders(
        <StarRating value={0} onSelect={() => undefined} size={size} />
      );

      const stars = screen.getAllByRole("button");
      expect(stars).toHaveLength(5);
      for (const star of stars) {
        expect(star).toHaveClass("min-w-6", "min-h-6");
      }
    }
  );

  it("shows the app's focus ring on the star a keyboard player reaches", () => {
    renderWithProviders(<StarRating value={0} onSelect={() => undefined} />);

    for (const star of screen.getAllByRole("button")) {
      expect(star).toHaveClass(
        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-[var(--accent)]"
      );
    }
  });

  it("keeps the small star icon at its drawn size inside the larger target", () => {
    renderWithProviders(
      <StarRating value={0} onSelect={() => undefined} size="sm" />
    );

    const star = screen.getByRole("button", { name: "Rate 1 star" });
    expect(star.querySelector("svg")).toHaveClass("w-3.5", "h-3.5");
  });
});

describe("StarRating as a read-only average", () => {
  it("stays a row of small icons with no button to hit", () => {
    renderWithProviders(<StarRating value={4} size="sm" />);

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    const average = screen.getByLabelText("4 out of 5");
    const icons = average.querySelectorAll("svg");
    expect(icons).toHaveLength(5);
    for (const icon of icons) {
      expect(icon).toHaveClass("w-3.5", "h-3.5");
      expect(icon).not.toHaveClass("min-w-6");
    }
  });
});
