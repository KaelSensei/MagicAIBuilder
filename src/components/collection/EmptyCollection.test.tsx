/**
 * The empty collection's copy and its one action, in both routed locales
 * (I-13 AC-13-05 and AC-13-07, design audit S11).
 *
 * Solitary: the page that opens the add-to-collection dialog from `onAddCards`
 * is covered in `CollectionPageClient.test.tsx`.
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { EmptyCollection } from "./EmptyCollection";

describe("EmptyCollection", () => {
  it("says what the collection is for and asks the page to add cards", async () => {
    const onAddCards = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<EmptyCollection onAddCards={onAddCards} />);

    expect(screen.getByText("Your collection is empty.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Add the cards you own, and your decks will show which ones you have and which you still need to buy."
      )
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add cards" }));

    expect(onAddCards).toHaveBeenCalledOnce();
  });

  it("reads in French, addressing the player as « vous »", () => {
    renderWithIntl(<EmptyCollection onAddCards={vi.fn()} />, { locale: "fr" });

    expect(screen.getByText("Votre collection est vide.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Ajoutez les cartes que vous possédez : vos decks indiqueront celles que vous avez et celles qu’il vous reste à acheter."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ajouter des cartes" })
    ).toBeInTheDocument();
  });

  it("hides its icon from assistive technology", () => {
    const { container } = renderWithIntl(
      <EmptyCollection onAddCards={vi.fn()} />
    );

    const icons = Array.from(container.querySelectorAll("svg"));
    expect(icons.length).toBeGreaterThan(0);
    expect(
      icons.every((icon) => icon.getAttribute("aria-hidden") === "true")
    ).toBe(true);
  });
});
