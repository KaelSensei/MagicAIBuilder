import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { SavedDeckLibrary } from "./SavedDeckLibrary";

vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

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
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ saved: true, folderId: "folder-1" }), {
          status: 201,
        })
      )
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

// WCAG 2.2 SC 1.3.1 and 4.1.2 (I-04 accessibility bundle 4): the player names
// a new folder in a text box, and a placeholder is no name.
describe("SavedDeckLibrary new folder field", () => {
  const emptyLibrary = () =>
    new Response(JSON.stringify({ folders: [], unfiled: [] }));

  beforeEach(() => vi.restoreAllMocks());

  it("names the new folder field for a screen reader and keeps the prompt as its placeholder", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      emptyLibrary()
    );

    renderWithIntl(<SavedDeckLibrary />);

    expect(
      await screen.findByRole("textbox", { name: "New folder name" })
    ).toHaveAttribute("placeholder", "Folder name");
  });

  it("names the new folder field in French", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      emptyLibrary()
    );

    renderWithIntl(<SavedDeckLibrary />, { locale: "fr" });

    expect(
      await screen.findByRole("textbox", { name: "Nom du nouveau dossier" })
    ).toBeInTheDocument();
  });

  it("creates the folder typed in the named field, trimmed, and empties the field", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(emptyLibrary())
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "folder-1", name: "Ideas" }), {
          status: 201,
        })
      )
      .mockResolvedValueOnce(emptyLibrary());

    renderWithIntl(<SavedDeckLibrary />);
    const field = await screen.findByRole("textbox", {
      name: "New folder name",
    });
    fireEvent.change(field, { target: { value: "  Ideas  " } });
    fireEvent.click(screen.getByRole("button", { name: "Create folder" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "/api/community/deck-folders",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "Ideas" }),
        })
      )
    );
    await waitFor(() => expect(field).toHaveValue(""));
  });
});
