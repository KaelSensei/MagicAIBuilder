/**
 * The toast container shows a store's message in the player's language: a
 * toast raised with a message key, from code that has no locale of its own
 * (the deck store), is rendered through the catalog of the current locale.
 */
import { afterEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { ToastContainer } from "@/components/ui/Toast";
import { useToastStore } from "@/hooks/useToast";
import { renderWithIntl } from "@/test/render-with-intl";

afterEach(() => {
  useToastStore.setState({ toasts: [] });
});

describe("ToastContainer", () => {
  it("shows a plain message as it is", () => {
    useToastStore.setState({
      toasts: [
        {
          id: "t1",
          type: "error",
          message: "Could not add card. Please retry.",
        },
      ],
    });

    renderWithIntl(<ToastContainer />);

    expect(
      screen.getByText("Could not add card. Please retry.")
    ).toBeInTheDocument();
  });

  it.each([
    {
      locale: "en",
      text: "This deck was changed elsewhere (another tab or device). It has been reloaded; redo your last change if you still want it.",
    },
    {
      locale: "fr",
      text: "Ce deck a été modifié ailleurs (un autre onglet ou appareil). Il a été rechargé ; refaites votre dernière modification si vous la voulez toujours.",
    },
  ] as const)(
    "shows a message raised by its key in the $locale catalog",
    ({ locale, text }) => {
      useToastStore.setState({
        toasts: [
          {
            id: "t1",
            type: "warning",
            message: { key: "deck.sync.conflictReloaded" },
          },
        ],
      });

      renderWithIntl(<ToastContainer />, { locale });

      expect(screen.getByText(text)).toBeInTheDocument();
    }
  );
});
