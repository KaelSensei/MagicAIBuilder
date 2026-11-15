import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JsonLd, safeJsonLd, softwareApplicationJsonLd } from "./JsonLd";

/** U+2028, a line terminator JSON allows raw but JavaScript before ES2019 did not. */
const LINE_SEPARATOR = String.fromCodePoint(0x20_28);
/** U+2029, the paragraph terminator with the same history. */
const PARAGRAPH_SEPARATOR = String.fromCodePoint(0x20_29);

/**
 * Every sequence an attacker could use to break out of an inline JSON-LD
 * block: the closing tag, the comment opener that puts the HTML parser in its
 * "escaped" script state, an ampersand, and the two line terminators.
 */
const hostileData = {
  name: "</script><script>alert(1)</script>",
  description: "<!-- comment --> Tom & Jerry",
  lineSeparator: `line${LINE_SEPARATOR}break`,
  paragraphSeparator: `paragraph${PARAGRAPH_SEPARATOR}break`,
  nested: { tags: ["</SCRIPT >", "&amp;"] },
};

describe("safeJsonLd", () => {
  it("leaves no `<`, `>` or `&` in the output, so nothing can close the script tag or open a comment", () => {
    const serialized = safeJsonLd(hostileData);

    expect(serialized).not.toMatch(/[<>&]/);
    expect(serialized.toLowerCase()).not.toContain("</script");
    expect(serialized).not.toContain("<!--");
  });

  it("parses back to the same data, line terminators included", () => {
    expect(JSON.parse(safeJsonLd(hostileData))).toEqual(hostileData);
  });
});

describe("JsonLd", () => {
  it("renders one JSON-LD script holding the escaped serialization", () => {
    const { container } = render(<JsonLd data={hostileData} />);

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );

    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.innerHTML).toBe(safeJsonLd(hostileData));
  });
});

describe("softwareApplicationJsonLd", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("points `url` at the fallback site when no base URL is configured", () => {
    expect(softwareApplicationJsonLd.url).toBe("https://magicaibuilder.com");
  });

  it("points `url` at the configured site, like the canonical and the sitemap", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://preview.example.test/");
    vi.resetModules();

    const fresh = await import("./JsonLd");

    expect(fresh.softwareApplicationJsonLd.url).toBe(
      "https://preview.example.test"
    );
  });
});
