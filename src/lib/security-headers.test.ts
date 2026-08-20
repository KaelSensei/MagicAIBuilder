import { describe, it, expect } from "vitest";
import { buildContentSecurityPolicy, buildSecurityHeaders } from "./security-headers";

function directive(csp: string, name: string): string | undefined {
  return csp
    .split(";")
    .map((d) => d.trim())
    .find((d) => d.startsWith(`${name} `) || d === name);
}

describe("buildContentSecurityPolicy", () => {
  const prod = buildContentSecurityPolicy({ isDev: false });

  it("locks the defaults down to the origin", () => {
    expect(directive(prod, "default-src")).toBe("default-src 'self'");
    expect(directive(prod, "object-src")).toBe("object-src 'none'");
    expect(directive(prod, "base-uri")).toBe("base-uri 'self'");
    expect(directive(prod, "frame-ancestors")).toBe("frame-ancestors 'none'");
  });

  it("allows the hosts the browser actually talks to, and nothing wider", () => {
    expect(directive(prod, "connect-src")).toContain("https://api.scryfall.com");
    expect(directive(prod, "connect-src")).toContain("https://*.ingest.sentry.io");
    expect(directive(prod, "connect-src")).toContain("https://vitals.vercel-insights.com");
    expect(directive(prod, "img-src")).toContain("https://cards.scryfall.io");
    expect(directive(prod, "img-src")).toContain("https://svgs.scryfall.io");
    expect(directive(prod, "img-src")).toContain("https://*.googleusercontent.com");
    expect(directive(prod, "form-action")).toContain("https://accounts.google.com");
  });

  it("never allows eval in production", () => {
    expect(directive(prod, "script-src")).not.toContain("'unsafe-eval'");
  });

  it("allows eval only for the dev server, which needs it for fast refresh", () => {
    const dev = buildContentSecurityPolicy({ isDev: true });
    expect(directive(dev, "script-src")).toContain("'unsafe-eval'");
  });

  it("fonts are self-hosted by next/font, so no font host is opened", () => {
    expect(directive(prod, "font-src")).toBe("font-src 'self' data:");
  });
});

describe("buildSecurityHeaders", () => {
  const headers = buildSecurityHeaders({ isDev: false });
  const get = (key: string) => headers.find((h) => h.key === key)?.value;

  it("asserts HSTS for two years with subdomains and preload", () => {
    expect(get("Strict-Transport-Security")).toBe(
      "max-age=63072000; includeSubDomains; preload"
    );
  });

  it("ships the CSP as an enforced header", () => {
    expect(get("Content-Security-Policy")).toBe(buildContentSecurityPolicy({ isDev: false }));
    expect(get("Content-Security-Policy-Report-Only")).toBeUndefined();
  });

  it("keeps the pre-existing hardening headers", () => {
    expect(get("X-Content-Type-Options")).toBe("nosniff");
    expect(get("X-Frame-Options")).toBe("DENY");
    expect(get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()");
  });

  it("isolates the origin with COOP and CORP", () => {
    expect(get("Cross-Origin-Opener-Policy")).toBe("same-origin");
    expect(get("Cross-Origin-Resource-Policy")).toBe("same-origin");
  });

  it("does not send HSTS from the dev server, where there is no TLS to pin", () => {
    const dev = buildSecurityHeaders({ isDev: true });
    expect(dev.find((h) => h.key === "Strict-Transport-Security")).toBeUndefined();
  });
});
