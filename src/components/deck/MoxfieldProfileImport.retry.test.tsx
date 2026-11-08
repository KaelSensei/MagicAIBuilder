import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { act, render, screen } from "@testing-library/react";
import {
  MOXFIELD_PROFILE_TIMEOUT_MS,
  MoxfieldProfileImport,
} from "./MoxfieldProfileImport";

describe("MoxfieldProfileImport retry", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("retries the exact profile page that failed", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            decks: [
              {
                id: "deck-1",
                name: "Atraxa",
                format: "commander",
                lastUpdatedAt: null,
              },
            ],
            total: 21,
            hasMore: true,
          }),
          { status: 200 }
        )
      )
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            decks: [
              {
                id: "deck-2",
                name: "Najeela",
                format: "commander",
                lastUpdatedAt: null,
              },
            ],
            total: 21,
            hasMore: false,
          }),
          { status: 200 }
        )
      );

    render(<MoxfieldProfileImport onDeckSelected={vi.fn()} />);
    await user.type(screen.getByLabelText("Moxfield username"), "totoro");
    await user.click(screen.getByRole("button", { name: "Load decks" }));
    expect(await screen.findByText("1–1 of 21 decks")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("offline");
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Najeela")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/import/moxfield-user",
      expect.objectContaining({
        body: JSON.stringify({ username: "totoro", pageNumber: 2 }),
      })
    );
  });

  it("shows retry feedback when a profile request reaches its deadline", async () => {
    const user = userEvent.setup();
    const controller = new AbortController();
    const timeout = vi
      .spyOn(AbortSignal, "timeout")
      .mockReturnValue(controller.signal);
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(
              new DOMException("The operation was aborted.", "AbortError")
            );
          });
        })
    );

    render(<MoxfieldProfileImport onDeckSelected={vi.fn()} />);
    await user.type(screen.getByLabelText("Moxfield username"), "totoro");
    await user.click(screen.getByRole("button", { name: "Load decks" }));

    expect(timeout).toHaveBeenCalledWith(MOXFIELD_PROFILE_TIMEOUT_MS);
    await act(async () => {
      controller.abort();
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load Moxfield decks."
    );
  });
});
