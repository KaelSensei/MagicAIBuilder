import { afterEach, describe, expect, it, vi } from "vitest";
import * as http from "@/lib/http";
import { importFromUrl } from "./url-import";

describe("Moxfield partner import", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each(["legacy", "boards"] as const)(
    "preserves both commanders from the %s response",
    async (shape) => {
      const commanders = {
        first: { quantity: 1, card: { name: "Thrasios, Triton Hero" } },
        second: { quantity: 1, card: { name: "Tymna the Weaver" } },
      };
      vi.spyOn(http, "httpGet").mockResolvedValueOnce(
        new Response(JSON.stringify({
          name: "Partner deck",
          ...(shape === "legacy"
            ? { commanders }
            : { boards: { commanders: { cards: commanders } } }),
        }), { status: 200 })
      );

      const result = await importFromUrl("https://moxfield.com/decks/partners");

      expect(result.cards).toEqual([
        { name: "Thrasios, Triton Hero", quantity: 1, isCommander: true, isPartner: false, zone: "main" },
        { name: "Tymna the Weaver", quantity: 1, isCommander: false, isPartner: true, zone: "main" },
      ]);
    }
  );
});
