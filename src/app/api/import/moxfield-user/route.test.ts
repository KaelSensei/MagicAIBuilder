import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchMoxfieldUserDecks } from "@/lib/import/moxfield-user";
import { POST } from "./route";

vi.mock("@/lib/import/moxfield-user", () => ({
  fetchMoxfieldUserDecks: vi.fn(),
}));

describe("POST /api/import/moxfield-user", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards the requested profile page to Moxfield", async () => {
    vi.mocked(fetchMoxfieldUserDecks).mockResolvedValue({
      decks: [
        {
          id: "deck-21",
          name: "Najeela",
          format: "commander",
          lastUpdatedAt: null,
        },
      ],
      total: 21,
      hasMore: false,
    });
    const request = new Request("http://localhost/api/import/moxfield-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "totoro", pageNumber: 2 }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(fetchMoxfieldUserDecks).toHaveBeenCalledWith("totoro", 2);
  });
});
