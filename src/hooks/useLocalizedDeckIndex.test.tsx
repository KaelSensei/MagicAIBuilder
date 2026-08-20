import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import React from "react";
import { useLocalizedDeckIndex } from "./useLocalizedDeckIndex";
import * as scryfallClient from "@/lib/scryfall/client";
import type { ScryfallCard } from "@/lib/scryfall/types";

vi.mock("@/lib/scryfall/client");

function createWrapper(locale: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { readonly children: React.ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={{}}>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </NextIntlClientProvider>
    );
  }
  return Wrapper;
}

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
    const { result } = renderHook(() => useLocalizedDeckIndex(["Sol Ring"]), {
      wrapper: createWrapper("en"),
    });
    expect(result.current.size).toBe(0);
    expect(scryfallClient.fetchLocalizedPrintingsByNames).not.toHaveBeenCalled();
  });

  it("makes no request for an empty list", () => {
    renderHook(() => useLocalizedDeckIndex([]), { wrapper: createWrapper("fr") });
    expect(scryfallClient.fetchLocalizedPrintingsByNames).not.toHaveBeenCalled();
  });

  it("indexes the batch by English name for a non-English locale", async () => {
    vi.mocked(scryfallClient.fetchLocalizedPrintingsByNames).mockResolvedValueOnce([frSolRing]);

    const { result } = renderHook(
      () => useLocalizedDeckIndex(["Counterspell", "Sol Ring", "Sol Ring"]),
      { wrapper: createWrapper("fr") }
    );

    await waitFor(() => expect(result.current.get("Sol Ring")?.name).toBe("Anneau solaire"));
    expect(result.current.has("Counterspell")).toBe(false);
    expect(scryfallClient.fetchLocalizedPrintingsByNames).toHaveBeenCalledWith(
      ["Counterspell", "Sol Ring"],
      "fr"
    );
  });
});
