import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  NO_INSPIRED_FORKS,
  type InspiredFork,
} from "@/lib/deck/inspired-forks";
import { renderWithIntl } from "@/test/render-with-intl";
import { PublicDeckActions } from "./PublicDeckActions";

const push = vi.fn();
const forkPublicDeck = vi.fn();
const fetchMock = vi.fn();
/** How late the slow server answers: later than the request, well within `findByRole`'s wait. */
const SLOW_ANSWER_MS = 30;

// The real localized `Link` stays, so a link's href shows the reader's locale
// prefix; only the router is stubbed, since no app router is mounted here.
vi.mock(import("@/i18n/navigation"), async (importOriginal) => {
  const navigation = await importOriginal();
  const stub = await import("@/test/i18n-navigation-stub");
  return { ...navigation, useRouter: () => ({ ...stub.useRouter(), push }) };
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
    // The server answers a little after the request, as it does under a loaded run.
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ ok: true }), SLOW_ANSWER_MS);
        })
    );
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
    expect(
      await screen.findByRole("button", { name: "Saved deck" })
    ).toBeDisabled();
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

  describe("the public forks a deck inspired (I-08, AC-08-193 to AC-08-195)", () => {
    /** A listed fork "Fork n" by "Player n". */
    const forkNumber = (n: number): InspiredFork => ({
      id: `fork-${n}`,
      name: `Fork ${n}`,
      author: `Player ${n}`,
    });

    it("lists each public fork under its count, linked to its page with its author", () => {
      renderWithIntl(
        <PublicDeckActions
          deckId="source"
          deckName="Original"
          isSignedIn={false}
          inspiredForks={{
            forks: [
              forkNumber(1),
              forkNumber(2),
              { id: "fork-3", name: "Ownerless fork", author: null },
            ],
            total: 3,
          }}
        />
      );

      const forks = screen.getByRole("list", {
        name: "Inspiration for 3 decks",
      });
      const links = within(forks).getAllByRole("link");
      expect(links.map((link) => link.textContent)).toEqual([
        "Fork 1 by Player 1",
        "Fork 2 by Player 2",
        "Ownerless fork",
      ]);
      expect(links.map((link) => link.getAttribute("href"))).toEqual([
        "/deck/fork-1",
        "/deck/fork-2",
        "/deck/fork-3",
      ]);
    });

    it("names the ten it lists, then how many more the deck inspired", () => {
      const tenForks = Array.from({ length: 10 }, (_, index) =>
        forkNumber(index + 1)
      );
      renderWithIntl(
        <PublicDeckActions
          deckId="source"
          deckName="Original"
          isSignedIn={false}
          inspiredForks={{ forks: tenForks, total: 14 }}
        />
      );

      const forks = screen.getByRole("list", {
        name: "Inspiration for 14 decks",
      });
      expect(within(forks).getAllByRole("link")).toHaveLength(10);
      expect(within(forks).getByText("and 4 more")).toBeInTheDocument();
    });

    it("sits beside the forked-from credit of a deck that is itself a fork", () => {
      renderWithIntl(
        <PublicDeckActions
          deckId="fork"
          deckName="Fork"
          isSignedIn={false}
          forkedFrom={{ id: "source", name: "Original", author: "Kael" }}
          inspiredForks={{ forks: [forkNumber(1)], total: 1 }}
        />
      );

      expect(
        screen.getByRole("link", { name: "Original by Kael" })
      ).toHaveAttribute("href", "/deck/source");
      expect(
        screen.getByRole("list", { name: "Inspiration for 1 deck" })
      ).toBeInTheDocument();
    });

    it("shows no line for a deck nobody forked publicly", () => {
      renderWithIntl(
        <PublicDeckActions
          deckId="source"
          deckName="Original"
          isSignedIn={false}
          inspiredForks={NO_INSPIRED_FORKS}
        />
      );

      expect(screen.queryByRole("list")).not.toBeInTheDocument();
      expect(screen.queryByText(/Inspiration for/)).not.toBeInTheDocument();
    });

    it("reads in French, singular and plural", () => {
      renderWithIntl(
        <PublicDeckActions
          deckId="source"
          deckName="Original"
          isSignedIn={false}
          inspiredForks={{ forks: [forkNumber(1)], total: 3 }}
        />,
        { locale: "fr" }
      );

      const forks = screen.getByRole("list", { name: "A inspiré 3 decks" });
      expect(within(forks).getByRole("link")).toHaveTextContent(
        "Fork 1 par Player 1"
      );
      expect(within(forks).getByText("et 2 autres")).toBeInTheDocument();
    });
  });
});
