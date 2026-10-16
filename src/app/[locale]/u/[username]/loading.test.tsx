import { renderWithIntl } from "@/test/render-with-intl";
import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import Loading from "./loading";

it("announces that the public profile is loading", () => {
  renderWithIntl(<Loading />, { locale: "en" });

  expect(screen.getByRole("status")).toHaveTextContent("Loading profile...");
  expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
});

it("announces the loading state in French", () => {
  renderWithIntl(<Loading />, { locale: "fr" });

  expect(screen.getByRole("status")).toHaveTextContent("Chargement du profil...");
});
