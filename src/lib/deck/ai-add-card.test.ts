import { describe, expect, it, vi } from "vitest";
import { addNamedCardToZone } from "./ai-add-card";

describe("addNamedCardToZone", () => {
  it("adds the resolved card to the active zone", async () => {
    const card = { name: "Sol Ring" };
    const lookup = vi.fn().mockResolvedValue(card);
    const addCard = vi.fn().mockResolvedValue(undefined);
    const onLookupError = vi.fn();

    await addNamedCardToZone("Sol Ring", "sideboard", { lookup, addCard, onLookupError });

    expect(lookup).toHaveBeenCalledWith("Sol Ring");
    expect(addCard).toHaveBeenCalledWith(card, { zone: "sideboard" });
    expect(onLookupError).not.toHaveBeenCalled();
  });

  it("reports a lookup failure without adding a card", async () => {
    const lookup = vi.fn().mockRejectedValue(new Error("missing"));
    const addCard = vi.fn();
    const onLookupError = vi.fn();

    await addNamedCardToZone("Not a Card", "maybeboard", { lookup, addCard, onLookupError });

    expect(addCard).not.toHaveBeenCalled();
    expect(onLookupError).toHaveBeenCalledWith("Not a Card");
  });
});
