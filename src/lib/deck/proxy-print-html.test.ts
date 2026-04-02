import { describe, expect, it } from "vitest";
import {
  buildProxyPrintDocumentHtml,
  renderProxyCardSlotHtml,
} from "./proxy-print-html";
import type { ProxySlot } from "./proxy";
import { DEFAULT_PROXY_CONFIG } from "./proxy";

function slot(partial: Partial<ProxySlot> & Pick<ProxySlot, "name" | "imageUri">): ProxySlot {
  return {
    id: partial.id ?? "1",
    name: partial.name,
    imageUri: partial.imageUri,
    manaCost: partial.manaCost ?? "{G}",
    typeLine: partial.typeLine ?? "Creature — Bear",
    oracleText: partial.oracleText ?? "Big paws.",
    powerToughness: partial.powerToughness ?? "2/2",
    isCommander: partial.isCommander ?? false,
  };
}

describe("renderProxyCardSlotHtml", () => {
  it("uses image when includeCardArt and map has data URL", () => {
    const s = slot({ name: "Bear", imageUri: "https://cards.scryfall.io/x" });
    const map = new Map([["https://cards.scryfall.io/x", "data:image/png;base64,xx"]]);
    const html = renderProxyCardSlotHtml(s, map, true);
    expect(html).toContain("card-img");
    expect(html).toContain('src="data:image/png;base64,xx"');
    expect(html).not.toContain("card-fallback");
  });

  it("ignores image map when includeCardArt is false", () => {
    const s = slot({ name: "Bear", imageUri: "https://cards.scryfall.io/x" });
    const map = new Map([["https://cards.scryfall.io/x", "data:image/png;base64,xx"]]);
    const html = renderProxyCardSlotHtml(s, map, false);
    expect(html).toContain("card-fallback");
    expect(html).toContain("Bear");
    expect(html).not.toContain("card-img");
  });

  it("escapes HTML in card name", () => {
    const s = slot({ name: "Evil<script>", imageUri: "" });
    const html = renderProxyCardSlotHtml(s, new Map(), false);
    expect(html).toContain("Evil&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
});

describe("buildProxyPrintDocumentHtml", () => {
  it("omits card images for all slots when includeCardArt is false", () => {
    const slots = [
      slot({ id: "a", name: "A", imageUri: "https://a" }),
      slot({ id: "b", name: "B", imageUri: "https://b" }),
    ];
    const map = new Map([
      ["https://a", "data:image/png;base64,a"],
      ["https://b", "data:image/png;base64,b"],
    ]);
    const html = buildProxyPrintDocumentHtml(slots, map, {
      ...DEFAULT_PROXY_CONFIG,
      includeCardArt: false,
    }, "my_deck");
    expect(html).not.toMatch(/<img\b/);
    expect((html.match(/<div class="card-fallback"/g) ?? []).length).toBe(2);
  });

  it("includes layout and paper in generated CSS", () => {
    const s = slot({ name: "Z", imageUri: "" });
    const html = buildProxyPrintDocumentHtml([s], new Map(), {
      ...DEFAULT_PROXY_CONFIG,
      includeCardArt: false,
      paper: "letter",
      layout: "2x2",
    }, "z");
    expect(html).toContain("8.5in");
    expect(html).toContain("grid-template-columns: repeat(2, 63mm)");
  });
});
