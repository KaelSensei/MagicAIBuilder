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
          decks: [{ id: "deck-1", name: "Atraxa", format: "commander", lastUpdatedAt: null }],
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
    expect(onDeckSelected).toHaveBeenCalledWith("https://moxfield.com/decks/deck-1");
    expect(window.localStorage.getItem("magic-ai-builder:moxfield-profiles")).toBe(
      JSON.stringify(["totoro"])
    );
  });

  it("removes a saved username from the profile list and local storage", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("magic-ai-builder:moxfield-profiles", JSON.stringify(["totoro", "luna"]));

    render(<MoxfieldProfileImport onDeckSelected={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Remove @totoro" }));

    expect(screen.queryByRole("button", { name: "@totoro" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "@luna" })).toBeInTheDocument();
    expect(window.localStorage.getItem("magic-ai-builder:moxfield-profiles")).toBe(
      JSON.stringify(["luna"])
    );
  });
});
