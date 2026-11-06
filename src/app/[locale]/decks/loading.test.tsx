import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import Loading from "./loading";

it("keeps a deck-list transition accessible and specific to the deck workspace", () => {
  render(<Loading />);

  expect(screen.getByRole("status")).toHaveTextContent("home.loading");
  expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  expect(screen.getAllByTestId("library-card-skeleton")).toHaveLength(3);
});
