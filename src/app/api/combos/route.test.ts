import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

function request(query = "cards=Sol%20Ring&format=json") {
  return new Request(`http://localhost/api/combos?${query}`);
}

describe("GET /api/combos", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns an empty list when no card was asked for", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(request(""));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ count: 0, results: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards a successful Spellbook payload", async () => {
    const payload = { count: 1, results: [{ id: "combo-1" }] };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(payload),
      })
    );

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(payload);
  });

  it("returns an error when Spellbook answers with a failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const response = await GET(request());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Spellbook request failed" });
  });

  it("returns an error when the Spellbook request throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));

    const response = await GET(request());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Spellbook request failed" });
  });
});
