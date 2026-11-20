/**
 * I-17 slice 1: the catalogue is read only. A stored version is shown with
 * its date and source, and an empty catalogue does not invent a list.
 */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PreconCatalogueView } from "@/components/precon/PreconCatalogueView";
import type { PreconVersion } from "@/lib/precon/catalogue";
import { renderWithIntl } from "@/test/render-with-intl";

const ELDRAZI: PreconVersion = {
  id: "cmm-eldrazi",
  version: 1,
  setCode: "cmm",
  name: "Eldrazi Unbound",
  commanderOracleId: "zhulodok-oracle",
  releaseDate: "2023-08-04",
  sourceUrl: "https://mtgjson.com/sets/cmm/",
  sourceReadAt: "2026-11-20",
  cards: [
    { scryfallId: "commander-printing", quantity: 1, zone: "commander" },
    { scryfallId: "sol-ring", quantity: 1, zone: "main" },
  ],
};

describe("PreconCatalogueView", () => {
  it("says the lists have not been loaded when the catalogue is empty", () => {
    renderWithIntl(<PreconCatalogueView catalogue={[]} />);

    expect(
      screen.getByRole("heading", { name: "Commander precons" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("No precon lists have been loaded yet.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows a stored version and offers no way to edit it", () => {
    renderWithIntl(<PreconCatalogueView catalogue={[ELDRAZI]} />);

    expect(
      screen.getByRole("heading", { name: "Eldrazi Unbound" })
    ).toBeInTheDocument();
    expect(screen.getByText("Set cmm")).toBeInTheDocument();
    expect(screen.getByText("Released 2023-08-04")).toBeInTheDocument();
    expect(screen.getByText("Version 1")).toBeInTheDocument();
    expect(screen.getByText("2 cards")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Source" })).toHaveAttribute(
      "href",
      "https://mtgjson.com/sets/cmm/"
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });

  it("uses the French catalogue", () => {
    renderWithIntl(<PreconCatalogueView catalogue={[]} />, { locale: "fr" });

    expect(
      screen.getByRole("heading", { name: "Precons Commander" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Aucune liste de precon n'a encore été chargée.")
    ).toBeInTheDocument();
  });
});
