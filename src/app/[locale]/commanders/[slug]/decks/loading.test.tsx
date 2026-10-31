import { renderWithIntl } from "@/test/render-with-intl";
import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import Loading from "./loading";

it("announces that a commander's decks are loading", () => {
  renderWithIntl(<Loading />, { locale: "en" });

  expect(screen.getByRole("status")).toHaveTextContent("Loading commander decks...");
  expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
});

it("announces the commander-decks loading state in French", () => {
  renderWithIntl(<Loading />, { locale: "fr" });

  expect(screen.getByRole("status")).toHaveTextContent("Chargement des decks du commandant...");
});
