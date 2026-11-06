import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import Loading from "./loading";

it("announces a localized loading state while the collection route is transitioning", () => {
  renderWithIntl(<Loading />, { locale: "en" });

  expect(screen.getByRole("status")).toHaveTextContent("Loading collection…");
  expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
});

it("keeps the collection loading state localized in French", () => {
  renderWithIntl(<Loading />, { locale: "fr" });

  expect(screen.getByRole("status")).toHaveTextContent("Chargement de la collection…");
});
