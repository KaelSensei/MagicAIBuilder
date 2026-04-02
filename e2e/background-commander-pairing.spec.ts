import { test, expect } from "@playwright/test";
import { buildPartnerSearchQuery } from "@/lib/scryfall/search";

test.describe("Background commander pairing (API-level E2E)", () => {
  test("Jaheira has Choose a Background and Background query finds Clan Crafter", async ({ request }) => {
    test.setTimeout(120000);

    // Verify the commander has the correct oracle text signal.
    const jaheiraRes = await request.get("https://api.scryfall.com/cards/named", {
      params: { exact: "Jaheira, Friend of the Forest" },
    });
    expect(jaheiraRes.ok()).toBe(true);
    const jaheiraJson = (await jaheiraRes.json()) as { oracle_text?: string | null };
    expect((jaheiraJson.oracle_text ?? "").toLowerCase()).toContain("choose a background");

    // Our background partner query should target Background cards (not commanders).
    const q = buildPartnerSearchQuery("background", "Clan Crafter");
    const backgroundRes = await request.get("https://api.scryfall.com/cards/search", {
      params: { q },
    });
    expect(backgroundRes.ok()).toBe(true);
    const backgroundJson = (await backgroundRes.json()) as {
      data?: Array<{ name: string; type_line?: string | null }>;
    };
    const names = new Set((backgroundJson.data ?? []).map((c) => c.name));
    expect(names.has("Clan Crafter")).toBe(true);
    const clan = (backgroundJson.data ?? []).find((c) => c.name === "Clan Crafter");
    expect((clan?.type_line ?? "").toLowerCase()).toContain("background");
  });
});

