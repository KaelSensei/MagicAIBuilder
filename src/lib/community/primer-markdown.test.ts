/**
 * The primer parser's tree: which text becomes which block, and which destinations become links.
 *
 * Community context. The link rows state the policy a renderer inherits from the tree: an
 * http(s) destination, in any case or protocol-relative, is an external link; a site path is
 * same-site; any other scheme is refused and only its label survives. The block rows pin what the
 * parser does today for a Markdown it does not support (emphasis, nested lists, `[[card]]`
 * mentions): literal text, until a slice adds the feature.
 */
import { describe, expect, it } from "vitest";
import {
  keyPrimerSiblings,
  parseInline,
  parsePrimer,
  primerHeadingId,
  primerHeadings,
  primerInlineText,
  type PrimerBlock,
  type PrimerInline,
} from "./primer-markdown";

const text = (value: string): PrimerInline => ({ kind: "text", text: value });

const external = (label: string, href: string): PrimerInline => ({
  kind: "link",
  label,
  link: { kind: "external", href },
});

const sameSite = (label: string, href: string): PrimerInline => ({
  kind: "link",
  label,
  link: { kind: "same-site", href },
});

const refused = (label: string): PrimerInline => ({
  kind: "link",
  label,
  link: { kind: "refused" },
});

const paragraph = (...content: readonly PrimerInline[]): PrimerBlock => ({
  kind: "paragraph",
  content,
});

describe("parsePrimer blocks", () => {
  it.each<[string, string, readonly PrimerBlock[]]>([
    ["an empty primer", "", []],
    ["only blank lines", "\n\n  \n", []],
    [
      "# and ## as level 2, ### as level 3, #### as text",
      "# Title\n\n## Plan\n\n### Detail\n\n#### Deeper",
      [
        {
          kind: "heading",
          level: 2,
          id: "primer-title",
          text: "Title",
          content: [text("Title")],
        },
        {
          kind: "heading",
          level: 2,
          id: "primer-plan",
          text: "Plan",
          content: [text("Plan")],
        },
        {
          kind: "heading",
          level: 3,
          id: "primer-detail",
          text: "Detail",
          content: [text("Detail")],
        },
        paragraph(text("#### Deeper")),
      ],
    ],
    [
      "a heading right after a paragraph, without a blank line",
      "Build resources.\n## Plan\nWin.",
      [
        paragraph(text("Build resources.")),
        {
          kind: "heading",
          level: 2,
          id: "primer-plan",
          text: "Plan",
          content: [text("Plan")],
        },
        paragraph(text("Win.")),
      ],
    ],
    [
      "the lines of a paragraph joined with one space",
      "Mulligan for\nSol Ring.",
      [paragraph(text("Mulligan for Sol Ring."))],
    ],
    [
      "a bullet list with - and * markers",
      "- Protect the commander\n* Hold interaction",
      [
        {
          kind: "list",
          ordered: false,
          items: [[text("Protect the commander")], [text("Hold interaction")]],
        },
      ],
    ],
    [
      "a numbered list, whatever its numbers",
      "3. Ramp\n4. Draw",
      [
        {
          kind: "list",
          ordered: true,
          items: [[text("Ramp")], [text("Draw")]],
        },
      ],
    ],
    [
      "a new list when numbers switch to bullets",
      "1. Ramp\n- Protect",
      [
        { kind: "list", ordered: true, items: [[text("Ramp")]] },
        { kind: "list", ordered: false, items: [[text("Protect")]] },
      ],
    ],
    [
      "a list ended by a paragraph line and resumed after it",
      "- Ramp\nThen win.\n- Protect",
      [
        { kind: "list", ordered: false, items: [[text("Ramp")]] },
        paragraph(text("Then win.")),
        { kind: "list", ordered: false, items: [[text("Protect")]] },
      ],
    ],
    [
      "a nested list flattened into its parent (pinned: indentation is trimmed)",
      "- Ramp\n  - Sol Ring\n  - Arcane Signet\n- Draw",
      [
        {
          kind: "list",
          ordered: false,
          items: [
            [text("Ramp")],
            [text("Sol Ring")],
            [text("Arcane Signet")],
            [text("Draw")],
          ],
        },
      ],
    ],
    [
      "emphasis kept as literal text (pinned: not supported)",
      "Play **Sol Ring** on _turn one_.",
      [paragraph(text("Play **Sol Ring** on _turn one_."))],
    ],
    [
      "a [[card]] mention kept as literal text (pinned: not supported)",
      "Tutor for [[Demonic Tutor]] early.",
      [paragraph(text("Tutor for [[Demonic Tutor]] early."))],
    ],
    [
      "raw HTML kept as literal text",
      '<script>alert("owned")</script>',
      [paragraph(text('<script>alert("owned")</script>'))],
    ],
    [
      "a heading with a link: raw text for the id, a link node for the content",
      "## See [the guide](https://example.com)",
      [
        {
          kind: "heading",
          level: 2,
          id: "primer-see-the-guide-https-example-com",
          text: "See [the guide](https://example.com)",
          content: [
            text("See "),
            external("the guide", "https://example.com/"),
          ],
        },
      ],
    ],
    [
      "a link inside a list item",
      "- Read [the guide](/decks/42) first",
      [
        {
          kind: "list",
          ordered: false,
          items: [
            [text("Read "), sameSite("the guide", "/decks/42"), text(" first")],
          ],
        },
      ],
    ],
  ])("parses %s", (_case, description, blocks) => {
    expect(parsePrimer(description)).toEqual(blocks);
  });

  it("parses a very long primer in one pass, one block per line", () => {
    const lines = Array.from(
      { length: 20_000 },
      (_, index) => `## Section ${index}`
    );

    const blocks = parsePrimer(lines.join("\n\n"));

    expect(blocks).toHaveLength(20_000);
    expect(blocks[19_999]).toMatchObject({
      kind: "heading",
      id: "primer-section-19999",
    });
  });

  it("keeps a line of 100 000 unclosed brackets as one text run", () => {
    const brackets = "[".repeat(100_000);

    expect(parseInline(brackets)).toEqual([text(brackets)]);
  });
});

describe("parsePrimer links", () => {
  it.each<[string, string, readonly PrimerInline[]]>([
    [
      "an https URL as an external link",
      "Read [the guide](https://example.com/guide).",
      [
        text("Read "),
        external("the guide", "https://example.com/guide"),
        text("."),
      ],
    ],
    [
      "an upper-case HTTP URL as an external link at its canonical address",
      "Read [the guide](HTTP://EXAMPLE.COM/GUIDE).",
      [
        text("Read "),
        external("the guide", "http://example.com/GUIDE"),
        text("."),
      ],
    ],
    [
      "a protocol-relative URL as an external link to the host it names",
      "Read [the guide](//evil.example/phish).",
      [
        text("Read "),
        external("the guide", "https://evil.example/phish"),
        text("."),
      ],
    ],
    [
      "a site path as a same-site link",
      "Write [here](/decks/42).",
      [text("Write "), sameSite("here", "/decks/42"), text(".")],
    ],
    [
      "a fragment as a same-site link",
      "See [the plan](#primer-game-plan).",
      [text("See "), sameSite("the plan", "#primer-game-plan"), text(".")],
    ],
    [
      "a javascript: URL as a refused link, its first ) ending the destination",
      "See [the trick](javascript:alert(1)) now.",
      [text("See "), refused("the trick"), text(") now.")],
    ],
    [
      "a javascript: URL in capitals as a refused link",
      "See [the trick](JavaScript:alert(1)) now.",
      [text("See "), refused("the trick"), text(") now.")],
    ],
    [
      "a mailto: address as a refused link",
      "Mail [the owner](mailto:owner@example.com).",
      [text("Mail "), refused("the owner"), text(".")],
    ],
    [
      "a data: URL as a refused link",
      "[hi](data:text/html,<b>hi</b>)",
      [refused("hi")],
    ],
    [
      "two links in a row, and a bracket inside a label",
      "Before [[nested](https://example.com/a)[next](/decks) after",
      [
        text("Before "),
        external("[nested", "https://example.com/a"),
        sameSite("next", "/decks"),
        text(" after"),
      ],
    ],
    [
      "a destination with a space as text",
      "Read [the guide](https://example.com/a b).",
      [text("Read [the guide](https://example.com/a b).")],
    ],
    [
      "a destination starting with a space as text",
      "See [the trick]( javascript:alert(1)) now.",
      [text("See [the trick]( javascript:alert(1)) now.")],
    ],
    [
      "a destination ended by its first closing parenthesis",
      "Read [the wiki](https://example.com/Combo_(cards)) today.",
      [
        text("Read "),
        external("the wiki", "https://example.com/Combo_(cards"),
        text(") today."),
      ],
    ],
    [
      "an empty label as text",
      "See [](https://example.com).",
      [text("See [](https://example.com).")],
    ],
    ["an empty destination as text", "See [here]().", [text("See [here]().")]],
    [
      "an unclosed label as text",
      "See [here](https://example.com",
      [text("See [here](https://example.com")],
    ],
    ["an empty line as no nodes", "", []],
  ])("parses %s", (_case, line, nodes) => {
    expect(parseInline(line)).toEqual(nodes);
  });
});

describe("primerHeadingId", () => {
  it.each([
    ["Game plan", "primer-game-plan"],
    ["Défense & Contrôle", "primer-defense-controle"],
    [
      "See [the guide](https://example.com)",
      "primer-see-the-guide-https-example-com",
    ],
    ["ドラゴン", "primer-section"],
    ["", "primer-section"],
    ["Phase Ⅱ", "primer-phase-ii"],
    ["Ramp²", "primer-ramp2"],
  ])("gives %j the id %s", (heading, id) => {
    expect(primerHeadingId(heading)).toBe(id);
  });
});

describe("keyPrimerSiblings", () => {
  const listItems = (description: string) => {
    const [block] = parsePrimer(description);
    return block?.kind === "list" ? block.items : [];
  };
  const itemKeys = (description: string) =>
    keyPrimerSiblings(listItems(description), primerInlineText).map(
      ({ key }) => key
    );

  it("gives two list items with the same text distinct keys", () => {
    expect(itemKeys("- Ramp\n- Ramp\n- Draw")).toEqual([
      "Ramp#1",
      "Ramp#2",
      "Draw#1",
    ]);
  });

  it("keeps an item's key when another item is inserted before it", () => {
    const [draw] = itemKeys("- Draw");
    const [, drawAfterRamp] = itemKeys("- Ramp\n- Draw");

    expect(drawAfterRamp).toBe(draw);
  });

  it("keys two links with the same label in one line apart, and keeps each node", () => {
    const nodes = parseInline("[guide](/a) or [guide](/b)");

    const keyed = keyPrimerSiblings(nodes, (node) => primerInlineText([node]));

    expect(keyed.map(({ key }) => key)).toEqual([
      "guide#1",
      " or #1",
      "guide#2",
    ]);
    expect(keyed.map(({ node }) => node)).toEqual(nodes);
  });

  it("reads a run of inline nodes as its text runs and link labels", () => {
    expect(
      primerInlineText(parseInline("See [the guide](https://example.com) now"))
    ).toBe("See the guide now");
  });
});

describe("primerHeadings", () => {
  it("lists the headings in document order and nothing else", () => {
    const blocks = parsePrimer(
      "## Ramp\n\nEarly.\n\n- Sol Ring\n\n### Late\n\nWin."
    );

    expect(primerHeadings(blocks).map((heading) => heading.id)).toEqual([
      "primer-ramp",
      "primer-late",
    ]);
  });
});
