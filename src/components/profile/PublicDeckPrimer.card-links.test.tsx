/**
 * A public deck primer's `[[Card Name]]` mentions, as a visitor meets them: a link to the deck
 * card with a preview that opens on hover and on keyboard focus, and plain text for a name the
 * deck does not hold.
 *
 * Community context. WCAG 1.4.13 (content on hover or focus): the preview opens on focus as well
 * as hover, Escape dismisses it, and the pointer may move onto it without closing it.
 */
import { fireEvent, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { aDeckCard } from "@/test/builders/card";
import { renderWithProviders } from "@/test/render";
import { PublicDeckPrimer } from "./PublicDeckPrimer";

const SOL_RING_ID = "fc817e07-c1f3-469f-9cf7-0945dea7400f";
const SOL_RING_PAGE = `https://scryfall.com/card/${SOL_RING_ID}`;

const deckCards = [
  aDeckCard({
    id: "row-sol-ring",
    name: "Sol Ring",
    scryfallId: SOL_RING_ID,
    imageUri: "https://cards.scryfall.io/normal/front/f/c/sol-ring.jpg",
  }),
];

/** Tabs past the copy and download actions, which come first, to the primer's first link. */
async function tabToFirstPrimerLink(user: UserEvent): Promise<void> {
  await user.tab();
  await user.tab();
  await user.tab();
}

function renderPrimer(description: string) {
  return renderWithProviders(
    <PublicDeckPrimer description={description} cards={deckCards} />
  );
}

describe("PublicDeckPrimer card mentions", () => {
  it("renders a mention of a deck card as a link whose preview opens on focus, and an unknown name as text", async () => {
    const user = userEvent.setup();
    renderPrimer("Keep [[Sol Ring]] for turn one, not [[Not In This Deck]].");

    const link = screen.getByRole("link", { name: "Sol Ring" });
    expect(link).toHaveAttribute("href", SOL_RING_PAGE);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    await tabToFirstPrimerLink(user);
    expect(link).toHaveFocus();
    const preview = screen.getByRole("tooltip");
    expect(
      within(preview).getByRole("img", { name: "Sol Ring" })
    ).toBeVisible();
    expect(within(preview).getByText("Sol Ring")).toBeVisible();

    expect(
      screen.queryByRole("link", { name: "Not In This Deck" })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/not Not In This Deck\./)).toBeVisible();
    expect(screen.queryByText(/\[\[/)).not.toBeInTheDocument();
  });

  it("opens the card's Scryfall page like the primer's other external links", () => {
    renderPrimer("Keep [[sol ring|C21]].");

    const link = screen.getByRole("link", { name: "Sol Ring" });
    expect(link).toHaveAttribute("href", SOL_RING_PAGE);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer nofollow ugc");
  });

  it("closes the focus preview on Escape and on leaving the link", async () => {
    const user = userEvent.setup();
    renderPrimer("Keep [[Sol Ring]].");
    const link = screen.getByRole("link", { name: "Sol Ring" });

    await tabToFirstPrimerLink(user);
    expect(link).toHaveFocus();
    expect(screen.getByRole("tooltip")).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(link).toHaveFocus();

    await user.tab({ shift: true });
    await user.tab();
    expect(screen.getByRole("tooltip")).toBeVisible();
    await user.tab();
    expect(link).not.toHaveFocus();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("opens the preview on hover, keeps it while the pointer is on it, and closes it on leaving", async () => {
    const user = userEvent.setup();
    renderPrimer("Keep [[Sol Ring]].");
    const link = screen.getByRole("link", { name: "Sol Ring" });

    await user.hover(link);
    const preview = screen.getByRole("tooltip");
    expect(preview).toBeVisible();

    // user-event sends `mouseout` without a `relatedTarget`, which React reads as the pointer
    // leaving the window; a browser names the element the pointer moves onto, as here.
    fireEvent.mouseOut(link, { relatedTarget: preview });
    fireEvent.mouseOver(preview, { relatedTarget: link });
    expect(screen.getByRole("tooltip")).toBeVisible();

    fireEvent.mouseOut(preview, { relatedTarget: document.body });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("closes the hover preview on Escape without moving the pointer", async () => {
    const user = userEvent.setup();
    renderPrimer("Keep [[Sol Ring]].");

    await user.hover(screen.getByRole("link", { name: "Sol Ring" }));
    expect(screen.getByRole("tooltip")).toBeVisible();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("renders a mention holding markup or a javascript: string as inert text", () => {
    renderPrimer(
      '[[<img src=x onerror="alert(1)">]] and [[javascript:alert(1)]]'
    );

    expect(document.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toEqual([
      screen.getByRole("link", { name: "Download primer" }),
    ]);
    expect(
      screen.getByText('<img src=x onerror="alert(1)"> and javascript:alert(1)')
    ).toBeVisible();
  });

  it("keeps the brackets out of the text but the Markdown as written in the download", () => {
    renderPrimer("Keep [[Sol Ring]].");

    expect(
      screen.getByRole("link", { name: "Download primer" })
    ).toHaveAttribute(
      "href",
      `data:text/markdown;charset=utf-8,${encodeURIComponent("Keep [[Sol Ring]].")}`
    );
  });
});
