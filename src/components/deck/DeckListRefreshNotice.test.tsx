import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { expect, it, vi } from "vitest";
import deckMessages from "@/messages/en/deck.json";
import { DeckListRefreshNotice } from "./DeckListRefreshNotice";

it("warns that cached decks may be stale and lets the player retry", () => {
  const retry = vi.fn();

  render(
    <NextIntlClientProvider locale="en" messages={{ deck: deckMessages }}>
      <DeckListRefreshNotice onRetry={retry} />
    </NextIntlClientProvider>
  );

  expect(screen.getByRole("alert")).toHaveTextContent(
    deckMessages.home.loadFailedDescription
  );
  fireEvent.click(screen.getByRole("button", { name: deckMessages.home.retry }));
  expect(retry).toHaveBeenCalledOnce();
});
