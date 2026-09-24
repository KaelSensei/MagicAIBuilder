import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { DeckFolderControls } from "./DeckFolderControls";

describe("DeckFolderControls", () => {
  it("moves the selected deck into the selected private folder", async () => {
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

    fireEvent.change(await screen.findByLabelText(/deck to move/i), {
      target: { value: "deck-1" },
    });
    fireEvent.change(screen.getByLabelText(/destination folder/i), {
      target: { value: "f1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^move$/i }));

    await waitFor(() => expect(onMoved).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/decks/deck-1/folder",
      expect.objectContaining({ body: JSON.stringify({ folderId: "f1" }) })
    );
  });
});
