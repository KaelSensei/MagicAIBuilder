/**
 * I-95: the public changelog page lists the read routes and embeds no deck.
 *
 * English and French chrome come from the catalogues. The change summaries
 * stay the English contract text stored on the entry.
 */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApiChangelogView } from "@/components/api/ApiChangelogView";
import { API_CHANGELOG } from "@/lib/api/api-changelog";
import { renderWithIntl } from "@/test/render-with-intl";

describe("ApiChangelogView", () => {
  it("lists the four public read routes in English and does not embed a deck", () => {
    renderWithIntl(<ApiChangelogView entries={API_CHANGELOG} />);

    expect(
      screen.getByRole("heading", { name: "Public read API changelog" })
    ).toBeInTheDocument();
    expect(screen.getByText("/api/v1/decks")).toBeInTheDocument();
    expect(screen.getByText("/api/v1/decks/{id}")).toBeInTheDocument();
    expect(screen.getByText("/api/v1/collection")).toBeInTheDocument();
    expect(screen.getByText("/api/v1/openapi")).toBeInTheDocument();
    expect(screen.getByText("compatible")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("uses the French catalogue for the heading", () => {
    renderWithIntl(<ApiChangelogView entries={API_CHANGELOG} />, { locale: "fr" });

    expect(
      screen.getByRole("heading", { name: "Journal de l’API de lecture publique" })
    ).toBeInTheDocument();
  });

  it("says when no dated change is recorded", () => {
    renderWithIntl(<ApiChangelogView entries={[]} />);

    expect(screen.getByText("No dated change is recorded yet.")).toBeInTheDocument();
  });
});
