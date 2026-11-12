import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { MoxfieldProfileImport } from "./MoxfieldProfileImport";

/** First of two Moxfield result pages for one profile. */
const FIRST_PAGE = {
  decks: [
    { id: "deck-1", name: "Atraxa", format: "commander", lastUpdatedAt: null },
  ],
  total: 21,
  hasMore: true,
};

describe("MoxfieldProfileImport in French", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("labels the profile form", () => {
    renderWithIntl(<MoxfieldProfileImport onDeckSelected={vi.fn()} />, {
      locale: "fr",
    });

    expect(
      screen.getByRole("heading", { name: "Profils Moxfield" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Enregistrez un nom d’utilisateur pour importer rapidement l’un de ses decks publics."
      )
    ).toBeInTheDocument();
    const username = screen.getByLabelText("Nom d’utilisateur Moxfield");
    expect(username).toHaveAttribute(
      "placeholder",
      "Nom d’utilisateur Moxfield"
    );
    expect(
      screen.getByRole("button", { name: "Enregistrer le profil" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Charger les decks" })
    ).toBeInTheDocument();
  });

  it("labels a page of decks, its pagination and the saved profile", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(FIRST_PAGE), { status: 200 })
    );

    renderWithIntl(<MoxfieldProfileImport onDeckSelected={vi.fn()} />, {
      locale: "fr",
    });
    await user.type(
      screen.getByLabelText("Nom d’utilisateur Moxfield"),
      "totoro"
    );
    await user.click(
      screen.getByRole("button", { name: "Enregistrer le profil" })
    );
    await user.click(screen.getByRole("button", { name: "Charger les decks" }));

    expect(await screen.findByText("1–1 sur 21 decks")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Importer Atraxa" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Pages de decks Moxfield" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Page précédente" })
    ).toHaveTextContent("Précédent");
    expect(
      screen.getByRole("button", { name: "Page suivante" })
    ).toHaveTextContent("Suivant");
    expect(
      screen.getByLabelText("Profils Moxfield enregistrés")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Retirer @totoro" })
    ).toBeInTheDocument();
  });

  it("explains a failed load and offers a retry", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 502 })
    );

    renderWithIntl(<MoxfieldProfileImport onDeckSelected={vi.fn()} />, {
      locale: "fr",
    });
    await user.type(
      screen.getByLabelText("Nom d’utilisateur Moxfield"),
      "totoro"
    );
    await user.click(screen.getByRole("button", { name: "Charger les decks" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Impossible de charger les decks Moxfield."
    );
    expect(
      screen.getByRole("button", { name: "Réessayer" })
    ).toBeInTheDocument();
  });
});
