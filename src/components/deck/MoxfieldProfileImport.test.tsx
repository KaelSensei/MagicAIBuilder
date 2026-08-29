import { describe, expect, it, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import { MoxfieldProfileImport } from "./MoxfieldProfileImport";

describe("MoxfieldProfileImport", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("saves a username, loads its decks, and selects a deck for import", async () => {
    const user = userEvent.setup();
    const onDeckSelected = vi.fn();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          decks: [
            {
              id: "deck-1",
              name: "Atraxa",
              format: "commander",
              lastUpdatedAt: null,
            },
          ],
          total: 1,
          hasMore: false,
        }),
        { status: 200 }
      )
    );

    render(<MoxfieldProfileImport onDeckSelected={onDeckSelected} />);
    await user.type(screen.getByLabelText("Moxfield username"), "totoro");
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    await user.click(screen.getByRole("button", { name: "Load decks" }));

    expect(await screen.findByText("Atraxa")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Import Atraxa" }));
    expect(onDeckSelected).toHaveBeenCalledWith(
      "https://moxfield.com/decks/deck-1"
    );
    expect(
      window.localStorage.getItem("magic-ai-builder:moxfield-profiles")
    ).toBe(JSON.stringify(["totoro"]));
  });

  it("pages through every public deck returned for a profile", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            decks: [
              {
                id: "deck-1",
                name: "Atraxa",
                format: "commander",
                lastUpdatedAt: null,
              },
            ],
            total: 21,
            hasMore: true,
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            decks: [
              {
                id: "deck-2",
                name: "Najeela",
                format: "commander",
                lastUpdatedAt: null,
              },
            ],
            total: 21,
            hasMore: false,
          }),
          { status: 200 }
        )
      );

    render(<MoxfieldProfileImport onDeckSelected={vi.fn()} />);
    await user.type(screen.getByLabelText("Moxfield username"), "totoro");
    await user.click(screen.getByRole("button", { name: "Load decks" }));

    expect(await screen.findByText("1–1 of 21 decks")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(await screen.findByText("Najeela")).toBeInTheDocument();
    expect(screen.queryByText("Atraxa")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/import/moxfield-user",
      expect.objectContaining({
        body: JSON.stringify({ username: "totoro", pageNumber: 2 }),
      })
    );
    expect(screen.getByRole("button", { name: "Previous page" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("removes a saved profile without loading it", async () => {
    window.localStorage.setItem(
      "magic-ai-builder:moxfield-profiles",
      JSON.stringify(["totoro"])
    );
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(<MoxfieldProfileImport onDeckSelected={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Remove @totoro" }));

    expect(
      screen.queryByRole("button", { name: "@totoro" })
    ).not.toBeInTheDocument();
    expect(
      window.localStorage.getItem("magic-ai-builder:moxfield-profiles")
    ).toBe("[]");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
