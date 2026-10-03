import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { DeckFolderControls } from "./DeckFolderControls";

describe("DeckFolderControls", () => {
  it("moves selected decks into the selected private folder", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ folders: [{ id: "f1", name: "Competitive" }] })
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "deck-1", folderId: "f1" }))
      );
    const onMoved = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <DeckFolderControls
        decks={[{ id: "deck-1", name: "Atraxa", folderId: null }]}
        filterId="all"
        onFilterChange={vi.fn()}
        onMoved={onMoved}
      />
    );

    const deckSelect = await screen.findByLabelText(/deck to move/i);
    await userEvent.selectOptions(deckSelect, "deck-1");
    fireEvent.change(screen.getByLabelText(/destination folder/i), {
      target: { value: "f1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /move 1 selected/i }));

    await waitFor(() => expect(onMoved).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/decks/folders",
      expect.objectContaining({
        body: JSON.stringify({ deckIds: ["deck-1"], folderId: "f1" }),
      })
    );
  });
});
