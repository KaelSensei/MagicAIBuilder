import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import Loading from "./loading";

it("announces that API keys are loading", () => {
  renderWithIntl(<Loading />, { locale: "en" });
  expect(screen.getByRole("status")).toHaveTextContent("Loading your keys…");
});
