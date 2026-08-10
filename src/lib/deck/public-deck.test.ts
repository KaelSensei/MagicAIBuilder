import { describe, expect, it } from "vitest";
import { buildPublicDeckRequestInit } from "@/lib/deck/public-deck";

describe("buildPublicDeckRequestInit", () => {
  it("forwards the cookie header and disables caching for authenticated requests", () => {
    const init = buildPublicDeckRequestInit("authjs.session-token=abc");
    expect(init.headers).toEqual({ cookie: "authjs.session-token=abc" });
    expect(init.cache).toBe("no-store");
    expect(init.next).toBeUndefined();
  });

  it("uses ISR revalidation and no headers for anonymous requests", () => {
    const init = buildPublicDeckRequestInit(null);
    expect(init.headers).toBeUndefined();
    expect(init.cache).toBeUndefined();
    expect(init.next).toEqual({ revalidate: 60 });
  });
});
