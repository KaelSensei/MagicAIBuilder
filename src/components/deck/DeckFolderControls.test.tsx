import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { renderWithIntl } from "@/test/render-with-intl";
import { DeckFolderControls } from "./DeckFolderControls";

function renderWithFolder(folderName: string) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ folders: [{ id: "f1", name: folderName }] }))
  );
  return renderWithProviders(
    <DeckFolderControls
      decks={[{ id: "deck-1", name: "Atraxa", folderId: null }]}
      filterId="all"
      onFilterChange={vi.fn()}
      onMoved={vi.fn().mockResolvedValue(undefined)}
    />
  );
}

describe("DeckFolderControls folder names", () => {
  it("a folder named '{W}{U} Control' shows the white and blue mana symbols with their letters", async () => {
    renderWithFolder("{W}{U} Control");

    const chip = await screen.findByRole("button", { name: "W U Control" });
    expect(within(chip).getByText("W")).toBeInTheDocument();
    expect(within(chip).getByText("U")).toBeInTheDocument();
    expect(chip).not.toHaveTextContent("{");
  });

  it("keeps a folder name with an unknown token as typed", async () => {
    renderWithFolder("{X} Storm {w}");

    expect(
      await screen.findByRole("button", { name: "{X} Storm {w}" })
    ).toBeInTheDocument();
  });

  it("keeps the name as typed inside a native option, which cannot hold a symbol", async () => {
    renderWithFolder("{W}{U} Control");

    const manage = await screen.findByRole("combobox", {
      name: /folder to manage/i,
    });
    expect(
      within(manage).getByRole("option", { name: "{W}{U} Control" })
    ).toBeInTheDocument();
  });
});

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
