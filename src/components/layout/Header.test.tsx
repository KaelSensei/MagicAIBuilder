import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

let createDeckImpl: (name: string) => Promise<string> = async (_name: string) => "deck-0";
let setActiveDeckImpl: (id: string) => void = (_id: string) => {};

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({ theme: "dark", toggleTheme: vi.fn() }),
}));

vi.mock("@/components/auth/UserMenu", () => ({
  UserMenu: () => null,
}));

vi.mock("@/components/deck/ImportDialog", () => ({
  ImportDialog: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock("@/lib/deck/store", () => ({
  useDeckStore: (selector: (s: { createDeck: (name: string) => Promise<string>; setActiveDeck: (id: string) => void }) => unknown) =>
    selector({
      createDeck: (name: string) => createDeckImpl(name),
      setActiveDeck: (id: string) => setActiveDeckImpl(id),
    }),
}));

describe("Header", () => {
  it("creates a deck and activates it when clicking Import on home", async () => {
    const createDeck = vi.fn(async (_name: string) => "deck-123");
    const setActiveDeck = vi.fn((_id: string) => {});
    createDeckImpl = (name: string) => createDeck(name);
    setActiveDeckImpl = (id: string) => setActiveDeck(id);

    const { Header } = await import("./Header");

    render(React.createElement(Header));
    await userEvent.click(screen.getByRole("button", { name: /import/i }));

    await waitFor(() => expect(createDeck).toHaveBeenCalledTimes(1));
    expect(setActiveDeck).toHaveBeenCalledWith("deck-123");
  });
});

