import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { z } from "zod";
import { DORMANT_LOCALES } from "@/i18n/routing";
import enDeck from "@/messages/en/deck.json";
import type { BracketScore } from "@/lib/deck/analysis-types";
import { renderWithIntl as renderInLocale } from "@/test/render-with-intl";
import { BracketIndicator } from "./BracketIndicator";

const score: BracketScore = {
  overall: 2,
  dimensions: { ramp: 2, draw: 3, removal: 1, winSpeed: 1, avgCmc: 2 },
  gameChangers: 0,
  twoCardInfiniteCombos: 0,
  warnings: ["Color identity violations: Lightning Bolt"],
};

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ deck: enDeck }}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("BracketIndicator warnings", () => {
  it("dismisses the warning list and restores it on request", () => {
    renderWithIntl(<BracketIndicator score={score} />);

    expect(screen.getByText(/color identity violations/i)).toBeDefined();
    expect(screen.getByRole("heading", { name: /legality errors/i })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /dismiss deck warnings/i }));
    expect(screen.queryByText(/color identity violations/i)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /toggle deck warnings/i }));
    expect(screen.getByText(/color identity violations/i)).toBeDefined();
  });

  it("shows changed warnings after the current list was dismissed", () => {
    const { rerender } = renderWithIntl(<BracketIndicator score={score} />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss deck warnings/i }));

    rerender(
      <NextIntlClientProvider locale="en" messages={{ deck: enDeck }}>
        <BracketIndicator
          score={{ ...score, warnings: ["Deck has only 90/100 cards"] }}
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByText(/deck has only 90\/100 cards/i)).toBeDefined();
  });

  it("announces legality failures separately from optional strategy advice", () => {
    renderWithIntl(
      <BracketIndicator
        score={{
          ...score,
          warnings: [
            "Color identity violations: Lightning Bolt",
            "Low ramp count (4) - recommend 8-12",
          ],
        }}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/color identity violations/i);
    expect(screen.getByRole("region", { name: /optional deck advice/i })).toHaveTextContent(
      /low ramp count/i
    );
    expect(
      screen.getByRole("region", { name: /optional deck advice/i })
    ).toHaveTextContent(/low ramp count/i);
  });
});

/** The header that shows the displayed bracket's number and name. */
function bracketHeader(): HTMLElement {
  const header = screen.getByText("Bracket Score").parentElement;
  if (!header) throw new Error("bracket header not rendered");
  return header;
}

describe("BracketIndicator official brackets", () => {
  it.each([
    { overall: 1, name: "Exhibition" },
    { overall: 2, name: "Core" },
    { overall: 3, name: "Upgraded" },
    { overall: 4, name: "Optimized" },
  ] as const)(
    "names Bracket $overall with its official name, $name",
    ({ overall, name }) => {
      renderInLocale(<BracketIndicator score={{ ...score, overall }} />);
      expect(within(bracketHeader()).getByText(name)).toBeInTheDocument();
    }
  );

  it("names the brackets with the official French names", () => {
    renderInLocale(<BracketIndicator score={score} targetBracket={3} />, {
      locale: "fr",
    });
    expect(screen.getByText("Basique")).toBeInTheDocument();
    expect(screen.getByText("Amélioré")).toBeInTheDocument();
  });

  it("offers all five brackets, cEDH included, as a manual override", () => {
    const onManualBracketChange = vi.fn();
    renderInLocale(
      <BracketIndicator
        score={score}
        onManualBracketChange={onManualBracketChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Override" }));
    for (const level of ["1", "2", "3", "4", "5"]) {
      expect(screen.getByRole("button", { name: level })).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    expect(onManualBracketChange).toHaveBeenCalledWith(5);
  });

  it("shows a cEDH manual override as Bracket 5", () => {
    renderInLocale(<BracketIndicator score={score} manualBracket={5} />);
    expect(within(bracketHeader()).getByText("5")).toBeInTheDocument();
    expect(within(bracketHeader()).getByText("cEDH")).toBeInTheDocument();
  });

  it("explains a two-card combo with the official rule, not a Rules Committee rule", () => {
    renderInLocale(
      <BracketIndicator
        score={{ ...score, overall: 3, twoCardInfiniteCombos: 1 }}
      />
    );
    expect(
      screen.getByText(
        "1 infinite 2-card combo → Bracket 3 minimum (none in Brackets 1–2, none before turn 6 in Bracket 3)"
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/RC rule/)).not.toBeInTheDocument();
  });

  it("explains a two-card combo in French", () => {
    renderInLocale(
      <BracketIndicator
        score={{ ...score, overall: 3, twoCardInfiniteCombos: 2 }}
      />,
      { locale: "fr" }
    );
    expect(
      screen.getByText(
        "2 combos infinis à 2 cartes → Bracket 3 minimum (aucun en brackets 1–2, aucun avant le tour 6 en bracket 3)"
      )
    ).toBeInTheDocument();
  });
});

const BRACKET_CATALOG = z.object({
  bracket: z.object({
    name: z.record(z.string(), z.string()),
    infiniteCombos: z.string(),
  }),
});

/** @returns the bracket names and the two-card combo rule of a locale's deck catalog */
function bracketRuleCopy(locale: string) {
  const file = join(__dirname, "..", "..", "messages", locale, "deck.json");
  const { bracket } = BRACKET_CATALOG.parse(
    JSON.parse(readFileSync(file, "utf8"))
  );
  return { name: bracket.name, infiniteCombos: bracket.infiniteCombos };
}

// The guide gives official bracket names only in English and French. Dormant
// catalogs keep the English copy until a native speaker reviews them.
describe("bracket names in dormant catalogs", () => {
  it.each(DORMANT_LOCALES)(
    "match the official English copy in %s",
    (locale) => {
      expect(bracketRuleCopy(locale)).toEqual(bracketRuleCopy("en"));
    }
  );
});
