/**
 * I-86: the data-as-of line on a deck. Catalogue strings, no invented date,
 * no zero standing in for a missing price.
 */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataAsOfLine } from "@/components/deck/DataAsOfLine";
import { renderWithIntl } from "@/test/render-with-intl";

const TODAY = {
  rulesEffectiveOn: "2026-08-07",
  priceStoredOn: null,
  cardDataLoadedOn: null,
};

describe("DataAsOfLine", () => {
  it("shows the rules date and the two placeholders in English", () => {
    renderWithIntl(<DataAsOfLine facts={TODAY} />);

    const line = screen.getByRole("note", { name: "Data as of" });
    expect(line).toHaveTextContent("Rules: 2026-08-07");
    expect(line).toHaveTextContent("Prices: USD stored with each card");
    expect(line).toHaveTextContent("Card data: not loaded from the daily file");
    expect(line.textContent).not.toContain("0.00");
  });

  it("uses the French catalogue", () => {
    renderWithIntl(<DataAsOfLine facts={TODAY} />, { locale: "fr" });

    expect(screen.getByRole("note", { name: "Données en date du" })).toHaveTextContent(
      "Règles : 2026-08-07"
    );
  });

  it("does not invent a rules date or a price", () => {
    renderWithIntl(
      <DataAsOfLine facts={{ rulesEffectiveOn: null, priceStoredOn: null, cardDataLoadedOn: null }} />
    );

    const line = screen.getByRole("note", { name: "Data as of" });
    expect(line).toHaveTextContent("Rules date: not recorded");
    expect(line).toHaveTextContent("Prices: USD stored with each card");
    expect(line.textContent).not.toMatch(/\$0/);
  });

  it("shows a stored price date and a card-data load date when they were recorded", () => {
    renderWithIntl(
      <DataAsOfLine
        facts={{
          rulesEffectiveOn: "2026-08-07",
          priceStoredOn: "2026-11-01",
          cardDataLoadedOn: "2026-11-02",
        }}
      />
    );

    const line = screen.getByRole("note", { name: "Data as of" });
    expect(line).toHaveTextContent("Prices: USD stored on 2026-11-01");
    expect(line).toHaveTextContent("Card data: loaded on 2026-11-02");
  });
});
