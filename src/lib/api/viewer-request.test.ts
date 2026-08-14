import { describe, expect, it, vi, afterEach } from "vitest";
import {
  buildViewerScopedRequestInit,
  resolveAppBaseUrl,
} from "@/lib/api/viewer-request";

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

describe("resolveAppBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers an explicit NEXT_PUBLIC_APP_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://magicaibuilder.com");
    expect(resolveAppBaseUrl()).toBe("https://magicaibuilder.com");
  });

  it("derives an https origin from VERCEL_URL on previews", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("VERCEL_URL", "preview-abc.vercel.app");
    expect(resolveAppBaseUrl()).toBe("https://preview-abc.vercel.app");
  });

  it("falls back to localhost when nothing is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(resolveAppBaseUrl()).toBe("http://localhost:3000");
  });

  // `NEXT_PUBLIC_APP_URL=` in a .env yields "" — with `??` that empty string
  // won a nullish check and produced a relative URL, which Node's fetch rejects.
  it("treats a present-but-blank env var as unset, not as an origin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "   ");
    vi.stubEnv("VERCEL_URL", "");
    expect(resolveAppBaseUrl()).toBe("http://localhost:3000");
  });

  it("never returns an empty origin, which would build a relative URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(resolveAppBaseUrl()).not.toBe("");
    expect(resolveAppBaseUrl()).toMatch(/^https?:\/\//);
  });
});
