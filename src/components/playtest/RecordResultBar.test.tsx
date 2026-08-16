import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { RecordResultBar } from "./RecordResultBar";
import playtestMessages from "@/messages/en/playtest.json";

let queryClient: QueryClient;

function renderBar(onRecorded = vi.fn()) {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={{ playtest: playtestMessages }}>
        <RecordResultBar deckId="deck-1" turns={9} mulliganCount={2} onRecorded={onRecorded} />
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
  return onRecorded;
}

beforeEach(() => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({}), { status: 201 })
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RecordResultBar", () => {
  it("offers every result the schema stores", () => {
    renderBar();
    expect(screen.getByText("Win")).toBeDefined();
    expect(screen.getByText("Loss")).toBeDefined();
    expect(screen.getByText("Draw")).toBeDefined();
  });

  it("posts the result with the turn and mulligan counts read off the engine", async () => {
    renderBar();
    await userEvent.click(screen.getByText("Win"));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(url).toBe("/api/decks/deck-1/playtest-sessions");
    expect(JSON.parse(String(init?.body))).toEqual({
      result: "win",
      turns: 9,
      mulliganCount: 2,
    });
  });

  it("closes the playtest once the session is stored", async () => {
    const onRecorded = renderBar();
    await userEvent.click(screen.getByText("Loss"));
    await waitFor(() => expect(onRecorded).toHaveBeenCalled());
  });

  it("keeps the playtest open when the request fails", async () => {
    // Closing would throw away a result the player just gave us, with nothing
    // stored to show for it.
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response("", { status: 500 }));
    const onRecorded = renderBar();
    await userEvent.click(screen.getByText("Win"));

    await waitFor(() => expect(screen.getByText("Could not save")).toBeDefined());
    expect(onRecorded).not.toHaveBeenCalled();
  });

  it("survives a network error rather than throwing", async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error("offline"));
    const onRecorded = renderBar();
    await userEvent.click(screen.getByText("Draw"));

    await waitFor(() => expect(screen.getByText("Could not save")).toBeDefined());
    expect(onRecorded).not.toHaveBeenCalled();
  });

  it("omits difficulty entirely when the player does not pick one", async () => {
    // Sending an empty string would fail validation; the field must be absent.
    renderBar();
    await userEvent.click(screen.getByText("Win"));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(JSON.parse(String(init?.body))).not.toHaveProperty("difficulty");
  });

  it("sends the difficulty the player picked", async () => {
    renderBar();
    await userEvent.selectOptions(screen.getByLabelText("Opponent"), "cedh");
    await userEvent.click(screen.getByText("Win"));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(JSON.parse(String(init?.body)).difficulty).toBe("cedh");
  });

  it("offers every difficulty the schema accepts", () => {
    renderBar();
    const select = screen.getByLabelText("Opponent") as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toEqual(["", "budget", "mid-range", "cedh"]);
  });

  it("drops the cached history so the new run shows up next time", async () => {
    renderBar();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    await userEvent.click(screen.getByText("Win"));

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: ["playtest", "history", "deck-1"],
      })
    );
  });

  it("closes without recording when the player skips", async () => {
    // An abandoned run is not a loss; recording it as one would poison the
    // win rate it feeds.
    const onRecorded = renderBar();
    await userEvent.click(screen.getByText("Skip"));

    expect(onRecorded).toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
