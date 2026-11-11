import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { DeckUnavailableState } from "./DeckUnavailableState";

vi.mock(import("@/i18n/navigation"), () => import("@/test/i18n-navigation-stub"));

function show(loadError: string | null, onRetry = vi.fn()) {
  renderWithIntl(
    <DeckUnavailableState isLoading={false} loadError={loadError} onRetry={onRetry} />
  );
  return onRetry;
}

describe("DeckUnavailableState", () => {
  it("shows an accessible editor-shaped skeleton while a deck loads", () => {
    const { container } = renderWithIntl(
      <DeckUnavailableState isLoading loadError={null} onRetry={vi.fn()} />
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Loading deck");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(container.querySelectorAll("aside")).toHaveLength(2);
    expect(container.querySelector("main")).toBeInTheDocument();
  });

  it("announces the loading skeleton in French", () => {
    renderWithIntl(
      <DeckUnavailableState isLoading loadError={null} onRetry={vi.fn()} />,
      { locale: "fr" }
    );

    expect(screen.getByRole("status")).toHaveTextContent("Chargement du deck");
  });

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
    renderWithIntl(
      <DeckUnavailableState isLoading={false} loadError="offline" errorSource="deck" onRetry={retry} />
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.queryByText("Could not load your decks")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
