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

  it("prints &, <, >, double and single quotes as entities in every text field (pinned current output)", () => {
    const s = slot({
      name: `Minsc & Boo's "<Hamster>"`,
      imageUri: "",
      manaCost: "{R}&{G}",
      typeLine: `Creature — "Human" <Ranger>`,
      powerToughness: "3'/3\"",
    });
    const html = renderProxyCardSlotHtml(s, new Map(), false);
    expect(html).toContain(
      '<div class="fallback-name">Minsc &amp; Boo&#39;s &quot;&lt;Hamster&gt;&quot;</div>'
    );
    expect(html).toContain('<div class="fallback-cost">{R}&amp;{G}</div>');
    expect(html).toContain(
      '<div class="fallback-type">Creature — &quot;Human&quot; &lt;Ranger&gt;</div>'
    );
    expect(html).toContain('<div class="fallback-pt">3&#39;/3&quot;</div>');
  });

  it("escapes rules text before turning its line breaks into <br/> (pinned current output)", () => {
    const s = slot({
      name: "Bear",
      imageUri: "",
      oracleText: `Draw a card & <scry 1>.\nIt's "free".`,
    });
    const html = renderProxyCardSlotHtml(s, new Map(), false);
    expect(html).toContain(
      '<div class="fallback-text">Draw a card &amp; &lt;scry 1&gt;.<br/>It&#39;s &quot;free&quot;.</div>'
    );
  });

  it("keeps a quoted card name inside the image alt attribute (pinned current output)", () => {
    const s = slot({ name: `"Ach! Hans, Run!"`, imageUri: "https://x" });
    const map = new Map([["https://x", "data:image/png;base64,xx"]]);
    const html = renderProxyCardSlotHtml(s, map, true);
    expect(html).toContain('alt="&quot;Ach! Hans, Run!&quot;"');
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
    expect(html.match(/<div class="card-fallback"/g) ?? []).toHaveLength(2);
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
