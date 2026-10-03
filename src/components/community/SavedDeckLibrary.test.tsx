import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { SavedDeckLibrary } from "./SavedDeckLibrary";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
  }: {
    readonly children: React.ReactNode;
    readonly href: string;
  }) => <a href={href}>{children}</a>,
}));

const SAVED_DECK = {
  createdAt: "2026-09-24T10:00:00.000Z",
  deck: {
    id: "deck-1",
    name: "Bant Value",
    commanderName: "Atraxa",
    user: { username: "kael", name: null },
  },
};

describe("SavedDeckLibrary", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("moves a saved deck into a personal folder", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            folders: [{ id: "folder-1", name: "Ideas", savedDecks: [] }],
            unfiled: [SAVED_DECK],
          })
        )
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ saved: true })))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            folders: [
              { id: "folder-1", name: "Ideas", savedDecks: [SAVED_DECK] },
            ],
            unfiled: [],
          })
        )
      );

    renderWithIntl(<SavedDeckLibrary />);
    fireEvent.change(await screen.findByLabelText(/move to folder/i), {
      target: { value: "folder-1" },
    });

    await waitFor(() =>
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "/api/community/decks/deck-1/save",
        expect.objectContaining({
          body: JSON.stringify({ folderId: "folder-1" }),
        })
      )
    );
    expect(
      await screen.findByRole("heading", { name: "Ideas" })
    ).toBeInTheDocument();
  });
});
