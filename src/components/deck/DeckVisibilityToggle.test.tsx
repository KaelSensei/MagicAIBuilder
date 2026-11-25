/**
 * Pins the deck visibility toggle's "View" link: once a deck is public, the owner opens its public
 * page in a new tab, in the owner's own language.
 *
 * The real localized `Link` renders here, so the href shows the locale prefix the app routes with
 * (`localePrefix: "as-needed"`, English at the root).
 */
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/render";
import { DeckVisibilityToggle } from "./DeckVisibilityToggle";

describe("DeckVisibilityToggle", () => {
  describe("the View link of a public deck", () => {
    // I-08: a hand-built `/deck/{id}` anchor dropped the owner's locale, so a
    // French owner landed on the English page (same defect as #1842).
    it("opens the French page for a French owner", () => {
      renderWithProviders(
        <DeckVisibilityToggle
          deckId="deck-1"
          initialIsPublic
          username="kael"
        />,
        { locale: "fr" }
      );

      expect(screen.getByRole("link", { name: "Voir" })).toHaveAttribute(
        "href",
        "/fr/deck/deck-1"
      );
    });

    it("opens the unprefixed page for an English owner", () => {
      renderWithProviders(
        <DeckVisibilityToggle deckId="deck-1" initialIsPublic username="kael" />
      );

      expect(screen.getByRole("link", { name: "View" })).toHaveAttribute(
        "href",
        "/deck/deck-1"
      );
    });

    it("opens in a new tab without handing the opener to the page", () => {
      renderWithProviders(
        <DeckVisibilityToggle deckId="deck-1" initialIsPublic username="kael" />
      );

      const link = screen.getByRole("link", { name: "View" });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("offers no View link while the deck is private", () => {
    renderWithProviders(
      <DeckVisibilityToggle
        deckId="deck-1"
        initialIsPublic={false}
        username="kael"
      />
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
