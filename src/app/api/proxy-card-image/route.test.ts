import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";

const VALID_URL =
  "https://cards.scryfall.io/normal/front/a/b/abc123.jpg";

function makeReq(search: string): Request {
  return new Request(`http://localhost:3000/api/proxy-card-image?${search}`);
}

describe("GET /api/proxy-card-image", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "image/jpeg" }),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 400 when url is missing", async () => {
    const res = await GET(makeReq(""));
    expect(res.status).toBe(400);
  });

  it("returns 403 for non-Scryfall host", async () => {
    const res = await GET(
      makeReq(`url=${encodeURIComponent("https://evil.com/x.jpg")}`)
    );
    expect(res.status).toBe(403);
  });

  it("returns 403 for http scheme", async () => {
    const res = await GET(
      makeReq(
        `url=${encodeURIComponent("http://cards.scryfall.io/normal/front/a/b/x.jpg")}`
      )
    );
    expect(res.status).toBe(403);
  });

  it("proxies allowed URL and returns image bytes", async () => {
    const res = await GET(makeReq(`url=${encodeURIComponent(VALID_URL)}`));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(vi.mocked(global.fetch).mock.calls[0]?.[0]).toBe(VALID_URL);
  });

  it("returns 502 when upstream is not ok", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as unknown as Response);

    const res = await GET(makeReq(`url=${encodeURIComponent(VALID_URL)}`));
    expect(res.status).toBe(502);
  });

  it("returns 502 when content-type is not image/*", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "text/html" }),
    } as unknown as Response);

    const res = await GET(makeReq(`url=${encodeURIComponent(VALID_URL)}`));
    expect(res.status).toBe(502);
  });
});
