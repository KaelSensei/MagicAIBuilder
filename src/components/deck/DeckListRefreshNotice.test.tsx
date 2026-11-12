import { fireEvent, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import deckMessages from "@/messages/en/deck.json";
import { renderWithIntl } from "@/test/render-with-intl";
import { DeckListRefreshNotice } from "./DeckListRefreshNotice";

it("warns that cached decks may be stale and lets the player retry", () => {
  const retry = vi.fn();

  renderWithIntl(<DeckListRefreshNotice onRetry={retry} />);

  expect(screen.getByRole("alert")).toHaveTextContent(
    deckMessages.home.loadFailedDescription
  );
  fireEvent.click(screen.getByRole("button", { name: deckMessages.home.retry }));
  expect(retry).toHaveBeenCalledOnce();
});
