/**
 * The primer's Markdown edges (P1-20): which link destinations become links, how they open,
 * and the ids headings get.
 *
 * Community context. `PublicDeckPrimer` renders a public deck's description, which its owner
 * writes and every visitor reads, so its link policy is a security boundary. `classifyUserLink`
 * decides it: an http(s) URL on another host, in any case or protocol-relative, opens in a new
 * tab; a site path or a fragment opens in the same tab; anything else stays plain text.
 * The link tests state that policy. The block tests characterize what the parser does today,
 * before COM-19 moves it into the community domain, including the duplicate heading ids B2-22
 * will fix.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PublicDeckPrimer } from "./PublicDeckPrimer";

function renderPrimer(description: string): void {
  render(<PublicDeckPrimer description={description} />);
}

/** The ids of the primer's headings, in document order. */
function headingIds(): readonly string[] {
  return screen.getAllByRole("heading").map((heading) => heading.id);
}

describe("PublicDeckPrimer links", () => {
  it.each([
    ["a javascript: URL", "javascript:alert(1)"],
    ["a javascript: URL in capitals", "JavaScript:alert(1)"],
    ["a data: URL", "data:text/html,<b>hi</b>"],
    ["a vbscript: URL", "vbscript:msgbox(1)"],
    ["a file: URL", "file:///etc/passwd"],
    ["a mailto: address", "mailto:owner@example.com"],
  ])("renders the label as plain text for %s", (_case, destination) => {
    renderPrimer(`See [the trick](${destination}) now.`);

    expect(screen.queryByRole("link", { name: "the trick" })).toBeNull();
    expect(screen.getByText("the trick").tagName).toBe("SPAN");
  });

  it("leaves the whole construct as text when the destination starts with a space", () => {
    renderPrimer("See [the trick]( javascript:alert(1)) now.");

    expect(screen.queryByRole("link", { name: "the trick" })).toBeNull();
    expect(
      screen.getByText(/\[the trick\]\( javascript:alert\(1\)\) now\./)
    ).toBeInTheDocument();
  });

  it.each([
    ["http:", "http://example.com/guide"],
    ["https:", "https://example.com/guide"],
  ])(
    "opens an %s link in a new tab without referrer or opener",
    (_scheme, destination) => {
      renderPrimer(`Read [the guide](${destination}).`);

      const link = screen.getByRole("link", { name: "the guide" });
      expect(link).toHaveAttribute("href", destination);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noreferrer noopener");
    }
  );

  it.each([
    ["a site path", "/decks/42"],
    ["a fragment", "#primer-game-plan"],
  ])(
    "links %s in the same tab, with no target or rel",
    (_case, destination) => {
      renderPrimer(`Write [here](${destination}).`);

      const link = screen.getByRole("link", { name: "here" });
      expect(link).toHaveAttribute("href", destination);
      expect(link).not.toHaveAttribute("target");
      expect(link).not.toHaveAttribute("rel");
    }
  );

  it("opens a protocol-relative URL as an external link to the host it names", () => {
    renderPrimer("Read [the guide](//evil.example/phish).");

    const link = screen.getByRole("link", { name: "the guide" });
    expect(link).toHaveAttribute("href", "https://evil.example/phish");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer noopener");
  });

  it("opens a backslash spelling of another host as an external link, which browsers read as //host", () => {
    renderPrimer("Read [the guide](/\\evil.example/phish).");

    const link = screen.getByRole("link", { name: "the guide" });
    expect(link).toHaveAttribute("href", "https://evil.example/phish");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer noopener");
  });

  it("opens an upper-case HTTPS link in a new tab, at its canonical lower-case address", () => {
    renderPrimer("Read [the guide](HTTPS://EXAMPLE.COM/GUIDE).");

    const link = screen.getByRole("link", { name: "the guide" });
    expect(link).toHaveAttribute("href", "https://example.com/GUIDE");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer noopener");
  });

  it("ends a destination at its first closing parenthesis and keeps the rest as text", () => {
    renderPrimer("Read [the wiki](https://example.com/Combo_(cards)) today.");

    expect(screen.getByRole("link", { name: "the wiki" })).toHaveAttribute(
      "href",
      "https://example.com/Combo_(cards"
    );
    expect(screen.getByText(/\) today\./)).toBeInTheDocument();
  });

  it("does not make a link when the destination holds a space", () => {
    renderPrimer("Read [the guide](https://example.com/a b).");

    expect(screen.queryByRole("link", { name: "the guide" })).toBeNull();
  });

  it("renders link labels as text, never as markup", () => {
    renderPrimer("Read [<img src=x onerror=alert(1)>](https://example.com).");

    const link = screen.getByRole("link", {
      name: "<img src=x onerror=alert(1)>",
    });
    expect(link.querySelector("img")).toBeNull();
  });
});

describe("PublicDeckPrimer blocks (characterization)", () => {
  it("renders # and ## as level-2 headings and ### as level 3, and leaves #### as text", () => {
    renderPrimer("# Title\n\n## Plan\n\n### Detail\n\n#### Deeper");

    expect(
      screen.getByRole("heading", { name: "Title", level: 2 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Plan", level: 2 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Detail", level: 3 })
    ).toBeInTheDocument();
    expect(screen.getByText("#### Deeper").tagName).toBe("P");
  });

  it("starts a new list when an ordered list switches to bullets, and numbers from 1 whatever was written", () => {
    renderPrimer("3. Ramp\n4. Draw\n- Protect");

    const lists = screen.getAllByRole("list");
    expect(lists.map((list) => list.tagName)).toEqual(["OL", "UL"]);
    expect(lists[0]).not.toHaveAttribute("start");
    expect(lists.map((list) => list.children.length)).toEqual([2, 1]);
  });

  it("joins the lines of a paragraph with a space", () => {
    renderPrimer("Mulligan for\nSol Ring.");

    expect(screen.getByText("Mulligan for Sol Ring.").tagName).toBe("P");
  });

  it("derives a heading id from its text without accents, and from the raw link markup", () => {
    renderPrimer(
      "## Défense & Contrôle\n\n## See [the guide](https://example.com)\n\n## ドラゴン"
    );

    expect(headingIds()).toEqual([
      "primer-defense-controle",
      "primer-see-the-guide-https-example-com",
      "primer-section",
    ]);
  });

  it("currently gives two headings with the same text the same id, and the contents two links to it (pinned; see B2-22)", () => {
    renderPrimer(
      "## Ramp\n\nEarly.\n\n## Ramp\n\nLate.\n\n## Defense\n\n## Défense"
    );

    expect(headingIds()).toEqual([
      "primer-ramp",
      "primer-ramp",
      "primer-defense",
      "primer-defense",
    ]);
    const contents = screen.getByRole("navigation", {
      name: "Primer contents",
    });
    expect(
      [...contents.querySelectorAll("a")].map((anchor) =>
        anchor.getAttribute("href")
      )
    ).toEqual([
      "#primer-ramp",
      "#primer-ramp",
      "#primer-defense",
      "#primer-defense",
    ]);
  });

  it("shows no contents for a single heading", () => {
    renderPrimer("## Plan\n\nWin.");

    expect(screen.queryByRole("navigation")).toBeNull();
  });
});
