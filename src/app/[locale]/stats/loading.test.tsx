import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import Loading from "./loading";

it("announces that the player's statistics are loading", () => {
  renderWithIntl(<Loading />, { locale: "en" });

  expect(screen.getByRole("status")).toHaveTextContent(
    "Loading your statistics…"
  );
  expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
});
