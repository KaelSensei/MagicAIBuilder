import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { PublicDeckActions } from "./PublicDeckActions";

const push = vi.fn();
const forkPublicDeck = vi.fn();
const fetchMock = vi.fn();

vi.mock(import("@/i18n/navigation"), async () => {
  const stub = await import("@/test/i18n-navigation-stub");
  return { ...stub, useRouter: () => ({ ...stub.useRouter(), push }) };
});
vi.mock(import("@/lib/db/deck-api"), () => ({
  forkPublicDeck: (id: string) => forkPublicDeck(id),
}));

describe("PublicDeckActions", () => {
  beforeEach(() => {
    push.mockReset();
    forkPublicDeck.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("shows attribution linking to the source deck", () => {
    renderWithIntl(
      <PublicDeckActions
        deckId="fork"
        deckName="Fork"
        isSignedIn
        forkedFrom={{ id: "source", name: "Original", author: "Kael" }}
      />
    );
    expect(
      screen.getByRole("link", { name: "Original by Kael" })
    ).toHaveAttribute("href", "/deck/source");
  });

  it("forks into a private owned deck and opens the builder", async () => {
    forkPublicDeck.mockResolvedValue({ id: "new-deck" });
    renderWithIntl(
      <PublicDeckActions deckId="source" deckName="Original" isSignedIn />
    );
    fireEvent.click(screen.getByRole("button", { name: "Fork deck" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/builder/new-deck"));
  });

  it("saves a public deck to the signed-in player's unfiled library", async () => {
    renderWithIntl(
      <PublicDeckActions deckId="source" deckName="Original" isSignedIn />
    );

    fireEvent.click(screen.getByRole("button", { name: "Save deck" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/community/decks/source/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: null }),
      })
    );
    expect(screen.getByRole("button", { name: "Saved deck" })).toBeDefined();
  });

  it("keeps the deck unsaved when the server rejects the request", async () => {
    fetchMock.mockResolvedValue({ ok: false });
    renderWithIntl(
      <PublicDeckActions deckId="source" deckName="Original" isSignedIn />
    );

    fireEvent.click(screen.getByRole("button", { name: "Save deck" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to save deck");
    expect(screen.getByRole("button", { name: "Save deck" })).toBeEnabled();
  });

  it("uses native sharing when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: share,
    });
    renderWithIntl(
      <PublicDeckActions deckId="source" deckName="Original" isSignedIn />
    );
    fireEvent.click(screen.getByRole("button", { name: "Share deck" }));
    await waitFor(() =>
      expect(share).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Original" })
      )
    );
  });

  it("prints the public deck guide", () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    renderWithIntl(
      <PublicDeckActions deckId="source" deckName="Original" isSignedIn />
    );
    fireEvent.click(screen.getByRole("button", { name: "Print guide" }));
    expect(print).toHaveBeenCalledOnce();
    print.mockRestore();
  });

  // Every label in this bar was an English literal, so a French visitor read
  // "Save", "Fork" and "Forked from" on an otherwise French deck page.
  describe("in French", () => {
    it("names every action for assistive technology", () => {
      renderWithIntl(
        <PublicDeckActions deckId="source" deckName="Original" isSignedIn />,
        { locale: "fr" }
      );

      expect(
        screen.getByRole("button", { name: "Enregistrer le deck" })
      ).toHaveTextContent("Enregistrer");
      expect(
        screen.getByRole("button", { name: "Dupliquer le deck" })
      ).toHaveTextContent("Dupliquer");
      expect(
        screen.getByRole("button", { name: "Partager le deck" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Imprimer le guide" })
      ).toBeInTheDocument();
    });

    it("credits the source deck and its author", () => {
      renderWithIntl(
        <PublicDeckActions
          deckId="fork"
          deckName="Fork"
          isSignedIn
          forkedFrom={{ id: "source", name: "Original", author: "Kael" }}
        />,
        { locale: "fr" }
      );

      const link = screen.getByRole("link", { name: "Original par Kael" });
      expect(link).toHaveAttribute("href", "/deck/source");
      expect(link.parentElement).toHaveTextContent(
        "Copie de Original par Kael"
      );
    });

    it("credits a source deck whose author is unknown by its name alone", () => {
      renderWithIntl(
        <PublicDeckActions
          deckId="fork"
          deckName="Fork"
          isSignedIn
          forkedFrom={{ id: "source", name: "Original", author: null }}
        />,
        { locale: "fr" }
      );

      expect(
        screen.getByRole("link", { name: "Original" }).parentElement
      ).toHaveTextContent("Copie de Original");
    });

    it("announces a fork in progress", async () => {
      forkPublicDeck.mockReturnValue(new Promise(() => undefined));
      renderWithIntl(
        <PublicDeckActions deckId="source" deckName="Original" isSignedIn />,
        { locale: "fr" }
      );

      fireEvent.click(
        screen.getByRole("button", { name: "Dupliquer le deck" })
      );

      expect(
        await screen.findByRole("button", { name: "Duplication du deck" })
      ).toHaveTextContent("Duplication…");
    });

    it("announces the saved state", async () => {
      renderWithIntl(
        <PublicDeckActions deckId="source" deckName="Original" isSignedIn />,
        { locale: "fr" }
      );

      fireEvent.click(
        screen.getByRole("button", { name: "Enregistrer le deck" })
      );

      expect(
        await screen.findByRole("button", { name: "Deck enregistré" })
      ).toHaveTextContent("Enregistré");
    });

    it("reports a rejected save", async () => {
      fetchMock.mockResolvedValue({ ok: false });
      renderWithIntl(
        <PublicDeckActions deckId="source" deckName="Original" isSignedIn />,
        { locale: "fr" }
      );

      fireEvent.click(
        screen.getByRole("button", { name: "Enregistrer le deck" })
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Impossible d’enregistrer le deck"
      );
    });

    it("confirms the deck was shared", async () => {
      renderWithIntl(
        <PublicDeckActions deckId="source" deckName="Original" isSignedIn />,
        { locale: "fr" }
      );

      fireEvent.click(screen.getByRole("button", { name: "Partager le deck" }));

      expect(
        await screen.findByRole("button", { name: "Deck partagé" })
      ).toBeInTheDocument();
    });
  });
});
