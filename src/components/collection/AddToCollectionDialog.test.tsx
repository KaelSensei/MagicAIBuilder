import { fireEvent, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { AddToCollectionDialog } from "./AddToCollectionDialog";

it("does not steal focus into search when opening the collection dialog", () => {
  renderWithIntl(<AddToCollectionDialog />);
  const trigger = screen.getByRole("button");
  trigger.focus();
  fireEvent.click(trigger);
  expect(screen.getByRole("textbox")).not.toHaveFocus();
  expect(trigger).toHaveFocus();
});
