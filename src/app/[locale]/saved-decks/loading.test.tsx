import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import Loading from "./loading";

it("announces that the saved public-deck library is loading", () => {
  renderWithIntl(<Loading />, { locale: "en" });

  expect(screen.getByRole("status")).toHaveTextContent("Loading saved decks…");
  expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
});
