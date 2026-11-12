import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import type { CommanderRuleIssue } from "@/lib/deck/commander-rules-check";
import { renderWithIntl } from "@/test/render-with-intl";
import { BanlistAlert } from "./BanlistAlert";

const SIGNET_ISSUE: CommanderRuleIssue = {
  cardId: "signet",
  cardName: "Arcane Signet",
  rule: "colorless-identity-mana",
};

describe("BanlistAlert", () => {
  it("renders collapsed by default and expands on click", () => {
    renderWithIntl(
      <BanlistAlert
        bannedCards={["Black Lotus"]}
        colorViolations={["Lightning Bolt"]}
      />
    );

    // collapsed: details not shown
    expect(screen.queryByText(/banned in commander/i)).toBeNull();
    expect(screen.queryByText(/color identity violations/i)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /toggle deck warnings/i }));
    expect(screen.getByText(/banned in commander/i)).toBeDefined();
    expect(screen.getByText(/color identity violations/i)).toBeDefined();
    expect(screen.getByText(/commander ban list/i)).toBeDefined();
    expect(screen.getByText(/remove or replace the banned card/i)).toBeDefined();
    expect(screen.getByText(/mana symbols outside your commander's color identity/i)).toBeDefined();
    expect(screen.getByText(/replace each card with one inside the commander's colors/i)).toBeDefined();
  });

  it("renders the dismiss button when onDismiss is provided", () => {
    renderWithIntl(
      <BanlistAlert
        bannedCards={[]}
        colorViolations={["Lightning Bolt"]}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /dismiss deck warnings/i })).toBeDefined();
  });

  it("calls onDismiss when the dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    renderWithIntl(
      <BanlistAlert
        bannedCards={["Sol Ring"]}
        colorViolations={[]}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /dismiss deck warnings/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("shows the rules check as its own labelled section naming the card, rule and reason", () => {
    renderWithIntl(
      <BanlistAlert
        bannedCards={[]}
        colorViolations={[]}
        rulesIssues={[SIGNET_ISSUE]}
      />
    );

    expect(screen.getByText("1 card can't work")).toBeDefined();

    fireEvent.click(
      screen.getByRole("button", { name: /toggle deck warnings/i })
    );
    const section = screen.getByRole("region", {
      name: "Cards that can't work with this commander",
    });
    expect(section.textContent).toContain("Rules check: deterministic");
    expect(section.textContent).toContain("Not a recommendation.");
    expect(section.textContent).toContain("Arcane Signet");
    expect(section.textContent).toContain("CR 903.4, 106.5");
    expect(section.textContent).toContain(
      "Your commander's color identity has no colors, so this card adds no mana, not even colorless."
    );
    expect(section.textContent).toContain(
      "Replace each card with one that works with this commander."
    );
  });

  it("writes the rules check in French", () => {
    renderWithIntl(
      <BanlistAlert
        bannedCards={[]}
        colorViolations={[]}
        rulesIssues={[SIGNET_ISSUE]}
      />,
      { locale: "fr" }
    );

    expect(screen.getByText("1 carte inopérante")).toBeDefined();

    fireEvent.click(
      screen.getByRole("button", {
        name: /afficher\/masquer les avertissements/i,
      })
    );
    const section = screen.getByRole("region", {
      name: "Cartes inopérantes avec ce commandant",
    });
    expect(section.textContent).toContain("Règles complètes 903.4, 106.5");
    expect(section.textContent).toContain(
      "L’identité couleur de votre commandant ne contient aucune couleur : cette carte ne produit aucun mana, pas même incolore."
    );
  });
});
