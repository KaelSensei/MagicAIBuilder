import { describe, it, expect } from "vitest";
import robots from "./robots";

/**
 * Crawler directives.
 *
 * `/share/<token>` used to be an explicit `allow`, paired with a sitemap that
 * listed every token. Both were removed together: the token is a capability
 * URL, and the route serving it checks `shareEnabled` and never `isPublic`, so
 * a deck the owner kept private is readable at its token — for whoever they
 * sent it to, which is the point, and not for a crawler.
 *
 * A `Disallow` is a request rather than a control, so this is a signal and not
 * a protection. It is still the signal this site means to send.
 */

const rule = () => {
  const [first] = [robots().rules].flat();
  expect(first, "robots() emits no rules").toBeDefined();
  return first;
};

describe("robots", () => {
  it("keeps crawlers away from share tokens", () => {
    expect([rule()?.disallow].flat()).toContain("/share/");
  });

  it("does not advertise share tokens as allowed", () => {
    expect([rule()?.allow].flat()).not.toContain("/share/");
  });

  it("still blocks the private routes", () => {
    const disallow = [rule()?.disallow].flat();

    expect(disallow).toContain("/api/");
    expect(disallow).toContain("/builder/");
    expect(disallow).toContain("/collection/");
  });

  it("points at an absolute sitemap URL", () => {
    expect(() => new URL(String(robots().sitemap))).not.toThrow();
    expect(String(robots().sitemap)).toMatch(/\/sitemap\.xml$/);
  });
});
