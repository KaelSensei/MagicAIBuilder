import { describe, it, expect, vi, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { useLocalizedDeckIndex } from "./useLocalizedDeckIndex";
import * as scryfallClient from "@/lib/scryfall/client";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { renderHookWithProviders } from "@/test/render";

vi.mock(import("@/lib/scryfall/client"));

const frSolRing: ScryfallCard = {
  id: "fr-1",
  name: "Sol Ring",
  lang: "fr",
  printed_name: "Anneau solaire",
  cmc: 1,
  type_line: "Artifact",
  color_identity: [],
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("useLocalizedDeckIndex", () => {
  it("returns an empty map and makes no request for English", () => {
    const { result } = renderHookWithProviders(() => useLocalizedDeckIndex(["Sol Ring"]), {
      locale: "en",
    });
    expect(result.current.size).toBe(0);
    expect(scryfallClient.fetchLocalizedPrintingsByNames).not.toHaveBeenCalled();
  });

  it("makes no request for an empty list", () => {
    renderHookWithProviders(() => useLocalizedDeckIndex([]), { locale: "fr" });
    expect(scryfallClient.fetchLocalizedPrintingsByNames).not.toHaveBeenCalled();
  });

  it("indexes the batch by English name for a non-English locale", async () => {
    vi.mocked(scryfallClient.fetchLocalizedPrintingsByNames).mockResolvedValueOnce([frSolRing]);

    const { result } = renderHookWithProviders(
      () => useLocalizedDeckIndex(["Counterspell", "Sol Ring", "Sol Ring"]),
      { locale: "fr" }
    );

    await waitFor(() => expect(result.current.get("Sol Ring")?.name).toBe("Anneau solaire"));
    expect(result.current.has("Counterspell")).toBe(false);
    expect(scryfallClient.fetchLocalizedPrintingsByNames).toHaveBeenCalledWith(
      ["Counterspell", "Sol Ring"],
      "fr"
    );
  });
});
