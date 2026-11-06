import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PublicDeckActions } from "./PublicDeckActions";

const push = vi.fn();
const forkPublicDeck = vi.fn();
const fetchMock = vi.fn();

vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/db/deck-api", () => ({
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
    render(
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
    render(
      <PublicDeckActions deckId="source" deckName="Original" isSignedIn />
    );
    fireEvent.click(screen.getByRole("button", { name: "Fork deck" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/builder/new-deck"));
  });

  it("saves a public deck to the signed-in player's unfiled library", async () => {
    render(
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
    render(
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
    render(
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
    render(
      <PublicDeckActions deckId="source" deckName="Original" isSignedIn />
    );
    fireEvent.click(screen.getByRole("button", { name: "Print guide" }));
    expect(print).toHaveBeenCalledOnce();
    print.mockRestore();
  });
});
