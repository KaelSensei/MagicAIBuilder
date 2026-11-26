/**
 * The card note editor leaves the app's keyboard-focus outline visible.
 *
 * Design audit S1 (2026-11-25): the note field hid its outline and drew no
 * other focus style, so a keyboard player could not see that it had focus.
 * The outline itself comes from the base layer of `globals.css`.
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HIDES_FOCUS_OUTLINE } from "@/test/focus-outline";
import { renderWithIntl } from "@/test/render-with-intl";
import { CardNoteInline } from "./CardNoteInline";

describe("CardNoteInline", () => {
  it("leaves the app's focus outline visible on the note field", () => {
    renderWithIntl(<CardNoteInline cardId="card-1" cardName="Sol Ring" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Add a note to Sol Ring" })
    );

    expect(
      screen.getByRole("textbox", { name: "Note on Sol Ring" }).className
    ).not.toMatch(HIDES_FOCUS_OUTLINE);
  });
});
