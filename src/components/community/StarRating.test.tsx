import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
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
