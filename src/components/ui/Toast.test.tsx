/**
 * The toast container shows a store's message in the player's language: a
 * toast raised with a message key, from code that has no locale of its own
 * (the deck store), is rendered through the catalog of the current locale.
 *
 * It also keeps each toast on screen long enough to read (WCAG 2.2.1) and
 * announces it (WCAG 4.1.3): an error stays until the player dismisses it and
 * is an alert; any other toast stays at least eight seconds, never closes
 * while the pointer or focus is on it, and is a polite status.
 *
 * Sociable: the real store, the real container and the real catalogs. The
 * timing tests run on fake timers and raise toasts through the store's own
 * `add`, so its timers are the ones under test.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import { ToastContainer } from "@/components/ui/Toast";
import { useToastStore, type ToastType } from "@/hooks/useToast";
import { renderWithIntl } from "@/test/render-with-intl";

/** Dismisses every toast through the store, so no auto-dismiss timer outlives its test. */
function dismissAll(): void {
  const { toasts, remove } = useToastStore.getState();
  for (const toast of toasts) remove(toast.id);
}

afterEach(() => {
  dismissAll();
  useToastStore.setState({ toasts: [] });
  vi.useRealTimers();
});

/** Raises a toast through the real store, as the app does. */
function raise(type: ToastType, message: string): void {
  act(() => {
    useToastStore.getState().add(type, message);
  });
}

/** Lets `ms` of fake time pass, with React's updates flushed. */
function wait(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/** The messages the store still holds. */
function storedMessages(): readonly unknown[] {
  return useToastStore.getState().toasts.map((toast) => toast.message);
}

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

describe("ToastContainer — reading time", () => {
  it("an error toast is still shown after 10 seconds", () => {
    vi.useFakeTimers();
    renderWithIntl(<ToastContainer />);
    raise("error", "Save failed");

    wait(10_000);

    expect(storedMessages()).toEqual(["Save failed"]);
    expect(screen.getByText("Save failed")).toBeInTheDocument();
  });

  it("a success toast does not close while hovered", () => {
    vi.useFakeTimers();
    renderWithIntl(<ToastContainer />);
    raise("success", "Deck saved");

    fireEvent.mouseEnter(screen.getByText("Deck saved"));
    wait(10_000);

    expect(storedMessages()).toEqual(["Deck saved"]);
  });

  it("closes a success toast eight seconds after the pointer leaves it", () => {
    vi.useFakeTimers();
    renderWithIntl(<ToastContainer />);
    raise("success", "Deck saved");
    fireEvent.mouseEnter(screen.getByText("Deck saved"));
    wait(10_000);

    fireEvent.mouseLeave(screen.getByText("Deck saved"));
    wait(7_999);
    expect(storedMessages()).toEqual(["Deck saved"]);
    wait(1);

    expect(storedMessages()).toEqual([]);
  });

  it("does not close a warning while focus is on its dismiss button", () => {
    vi.useFakeTimers();
    renderWithIntl(<ToastContainer />);
    raise("warning", "Bracket 3 minimum applies");

    act(() => {
      screen.getByRole("button", { name: "Dismiss" }).focus();
    });
    wait(10_000);

    expect(storedMessages()).toEqual(["Bracket 3 minimum applies"]);
  });

  it("closes an error toast when the player dismisses it with its named button", () => {
    vi.useFakeTimers();
    renderWithIntl(<ToastContainer />);
    raise("error", "Save failed");

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(storedMessages()).toEqual([]);
  });

  it("keeps both of two toasts raised together readable", () => {
    vi.useFakeTimers();
    renderWithIntl(<ToastContainer />);
    raise("error", "Save failed");
    raise("success", "Deck saved");

    wait(5_000);

    // Present, not `toBeVisible`: framer-motion's entry fade runs on the
    // animation-frame clock, which the fake timers hold at opacity 0.
    expect(screen.getByText("Save failed")).toBeInTheDocument();
    expect(screen.getByText("Deck saved")).toBeInTheDocument();
    expect(storedMessages()).toEqual(["Save failed", "Deck saved"]);
  });
});

describe("ToastContainer — announcements", () => {
  /** The `aria-live` value of the live region that holds `text`. */
  function liveRegionOf(text: string): string | null {
    const region = screen.getByText(text).closest("[aria-live]");
    return region === null ? null : region.getAttribute("aria-live");
  }

  it("announces an error at once and a success once the reader is idle", () => {
    renderWithIntl(<ToastContainer />);
    raise("error", "Save failed");
    raise("success", "Deck saved");

    expect(liveRegionOf("Save failed")).toBe("assertive");
    expect(liveRegionOf("Deck saved")).toBe("polite");
  });

  it("keeps both live regions mounted before any toast, so the first one is heard", () => {
    const { container } = renderWithIntl(<ToastContainer />);

    const regions = [...container.querySelectorAll("[aria-live]")].map(
      (region) => region.getAttribute("aria-live")
    );

    expect(regions).toEqual(["polite", "assertive"]);
  });
});
