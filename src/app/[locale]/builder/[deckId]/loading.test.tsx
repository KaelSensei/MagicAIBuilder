import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import Loading from "./loading";

it("announces a localized editor loading state while the builder route is transitioning", () => {
  renderWithIntl(<Loading />, { locale: "en" });

  expect(screen.getByRole("status")).toHaveTextContent("Loading deck…");
  expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
});
