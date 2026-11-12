import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ComprehensiveRulesView } from "./ComprehensiveRulesView";

/** The locale the mocked server request resolves to; each test sets it. */
const request = vi.hoisted((): { locale: "en" | "fr" } => ({ locale: "fr" }));

/**
 * A server west of UTC. The rules file states a calendar day, so the page must
 * show that day wherever the server runs: formatted in this zone without an
 * explicit UTC, "August 7, 2026" would read as August 6.
 */
const SERVER_TIME_ZONE = "America/Los_Angeles";

vi.mock("next-intl/server", async () => {
  const { createFormatter, createTranslator } = await import("next-intl");
  const { default: en } = await import("@/messages/en/rules.json");
  const { default: fr } = await import("@/messages/fr/rules.json");
  const catalogs = { en, fr };
  return {
    getTranslations: async () =>
      createTranslator({
        locale: request.locale,
        messages: { rules: catalogs[request.locale] },
        namespace: "rules",
      }),
    getFormatter: async () =>
      createFormatter({ locale: request.locale, timeZone: SERVER_TIME_ZONE }),
  };
});

vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

/** A query that matches no rule paragraph and no glossary entry. */
const UNMATCHED_QUERY = "zzqxjv";

describe("ComprehensiveRulesView", () => {
  it("states the effective date of the bundled rules in French", async () => {
    request.locale = "fr";
    render(await ComprehensiveRulesView({}));

    expect(
      screen.getByText(
        "Les règles complètes officielles de Magic: The Gathering. En vigueur depuis le 7 août 2026."
      )
    ).toBeInTheDocument();
  });

  it("states the effective date of the bundled rules in English", async () => {
    request.locale = "en";
    render(await ComprehensiveRulesView({}));

    expect(
      screen.getByText(
        "The official Magic: The Gathering Comprehensive Rules. Effective as of August 7, 2026."
      )
    ).toBeInTheDocument();
  });

  it("tells a French reader that no rule matches the search", async () => {
    request.locale = "fr";
    render(await ComprehensiveRulesView({ requestedQuery: UNMATCHED_QUERY }));

    expect(screen.getByText("Aucune règle trouvée.")).toBeInTheDocument();
  });

  it("tells an English reader that no rule matches the search", async () => {
    request.locale = "en";
    render(await ComprehensiveRulesView({ requestedQuery: UNMATCHED_QUERY }));

    expect(screen.getByText("No matching rules found.")).toBeInTheDocument();
  });
});
