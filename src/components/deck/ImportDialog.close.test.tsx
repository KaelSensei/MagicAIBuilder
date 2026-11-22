/**
 * What closing the import dialog does to its form, over time.
 *
 * Closing empties the form 200 ms later, once the closing animation is over.
 * These tests pin that the pending reset never outlives the dialog and never
 * wipes a dialog the player has already reopened.
 *
 * Sociable: the real `ImportDialog`, the real deck store and the real
 * catalogs, through the shared test kit; nothing is mocked. Fake timers stand
 * in for the 200 ms.
 */
import { act, cleanup, fireEvent, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDeckStore } from "@/lib/deck/store";
import { renderWithProviders } from "@/test/render";
import { ImportDialog } from "./ImportDialog";

/** The closing animation the reset waits for. */
const RESET_DELAY_MS = 200;

/** Hosts the dialog the way the header and the builder do: controlled, with a button that reopens it. */
function DialogHost() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open import
      </button>
      <ImportDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function decklistBox() {
  return screen.getByPlaceholderText(/Atraxa, Praetors' Voice/);
}

function typeDecklist(value: string) {
  fireEvent.change(decklistBox(), { target: { value } });
}

function closeDialog() {
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
}

function reopenDialog() {
  fireEvent.click(screen.getByRole("button", { name: "Open import" }));
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  useDeckStore.setState(useDeckStore.getInitialState(), true);
});

describe("Closing the import dialog", () => {
  it("leaves no reset running once the dialog is unmounted, so nothing updates after it is gone", () => {
    const consoleError = vi.spyOn(console, "error");
    const { unmount } = renderWithProviders(<DialogHost />);
    typeDecklist("1 Sol Ring");

    closeDialog();
    unmount();
    // React and Radix queue zero-delay timers of their own; let them run, so
    // the count below sees only what outlives the dialog.
    advance(0);

    expect(vi.getTimerCount()).toBe(0);
    advance(RESET_DELAY_MS);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("still empties the form for the next opening", () => {
    renderWithProviders(<DialogHost />);
    typeDecklist("1 Arcane Signet");

    closeDialog();
    advance(RESET_DELAY_MS);
    reopenDialog();

    expect(decklistBox()).toHaveValue("");
  });

  it("shows an empty form when the player reopens it before the reset", () => {
    renderWithProviders(<DialogHost />);
    typeDecklist("1 Arcane Signet");

    closeDialog();
    advance(RESET_DELAY_MS / 2);
    reopenDialog();

    expect(decklistBox()).toHaveValue("");
  });

  it("keeps what the player types into a dialog reopened before the reset", () => {
    renderWithProviders(<DialogHost />);
    typeDecklist("1 Arcane Signet");

    closeDialog();
    advance(RESET_DELAY_MS / 2);
    reopenDialog();
    typeDecklist("1 Sol Ring");
    advance(RESET_DELAY_MS);

    expect(decklistBox()).toHaveValue("1 Sol Ring");
  });
});
