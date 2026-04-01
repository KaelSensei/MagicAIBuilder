import { test, expect } from "@playwright/test";

test.describe("Scryfall printings sanity", () => {
  test("Black Lotus has multiple paper printings (unique=prints)", async ({ request }) => {
    // Mirror the Scryfall search used for "all arts" expectations.
    // Reference: https://scryfall.com/search?as=grid&order=released&q=%21%22Black+Lotus%22+oracleid%3A5089ec1a-f881-4d55-af14-5d996171203b+include%3Aextras&unique=prints
    const query =
      '!"Black Lotus" oracleid:5089ec1a-f881-4d55-af14-5d996171203b include:extras game:paper';

    const res = await request.get("https://api.scryfall.com/cards/search", {
      params: {
        q: query,
        unique: "prints",
        order: "released",
        dir: "desc",
      },
    });
    expect(res.ok()).toBe(true);

    const json = (await res.json()) as { total_cards?: number; data?: unknown[] };
    const total = json.total_cards ?? 0;
    const count = json.data?.length ?? 0;

    // Hard requirement: more than 1 printing exists.
    expect(total).toBeGreaterThan(1);
    expect(count).toBeGreaterThan(1);

    // Expect many printings; exact count can vary with Scryfall tagging and paper/digital sets.
    expect(total).toBeGreaterThanOrEqual(10);
  });
});

