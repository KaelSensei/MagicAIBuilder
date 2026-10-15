import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import React from "react";
import builderMessages from "@/messages/en/builder.json";
import deckMessages from "@/messages/en/deck.json";
import commonMessages from "@/messages/en/common.json";
import { DeckUnavailableState } from "./DeckUnavailableState";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { readonly href: string; readonly children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

function show(loadError: string | null, onRetry = vi.fn()) {
  render(
    <NextIntlClientProvider locale="en" messages={{ builder: builderMessages, deck: deckMessages, common: commonMessages }}>
      <DeckUnavailableState isLoading={false} loadError={loadError} onRetry={onRetry} />
    </NextIntlClientProvider>
  );
  return onRetry;
}

describe("DeckUnavailableState", () => {
  it("distinguishes a failed load from a missing deck and offers retry", () => {
    const retry = show("Network timeout");

    expect(screen.getByText("Could not load your decks")).toBeInTheDocument();
    expect(screen.queryByText("Deck not found")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("shows the missing-deck state without a retry action after a successful load", () => {
    show(null);

    expect(screen.getByText("Deck not found")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });

  it("offers retry for an individual deck failure without calling it a list failure", () => {
    const retry = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={{ builder: builderMessages, deck: deckMessages, common: commonMessages }}>
        <DeckUnavailableState isLoading={false} loadError="offline" errorSource="deck" onRetry={retry} />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.queryByText("Could not load your decks")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
