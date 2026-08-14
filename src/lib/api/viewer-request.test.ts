import { describe, expect, it } from "vitest";
import { buildViewerScopedRequestInit } from "@/lib/api/viewer-request";

describe("buildViewerScopedRequestInit", () => {
  it("forwards the cookie header and disables caching for authenticated requests", () => {
    const init = buildViewerScopedRequestInit("authjs.session-token=abc");
    expect(init.headers).toEqual({ cookie: "authjs.session-token=abc" });
    expect(init.cache).toBe("no-store");
    expect(init.next).toBeUndefined();
  });

  it("uses ISR revalidation and no headers for anonymous requests", () => {
    const init = buildViewerScopedRequestInit(null);
    expect(init.headers).toBeUndefined();
    expect(init.cache).toBeUndefined();
    expect(init.next).toEqual({ revalidate: 60 });
  });
});
