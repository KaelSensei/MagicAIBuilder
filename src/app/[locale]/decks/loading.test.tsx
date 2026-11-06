import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/profile/PublicPageLoading", () => ({
  PublicPageLoading: ({ label, variant }: { label: string; variant: string }) => (
    <output data-testid="page-loading" data-variant={variant}>
      {label}
    </output>
  ),
}));

import Loading from "./loading";

it("keeps a deck-list transition accessible and specific to the deck workspace", () => {
  render(<Loading />);

  expect(screen.getByTestId("page-loading")).toHaveTextContent("home.loading");
  expect(screen.getByTestId("page-loading")).toHaveAttribute("data-variant", "decks");
});
