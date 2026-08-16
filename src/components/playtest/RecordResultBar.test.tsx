import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";

import { RecordResultBar } from "./RecordResultBar";
import playtestMessages from "@/messages/en/playtest.json";

function renderBar(onRecorded = vi.fn()) {
  render(
    <NextIntlClientProvider locale="en" messages={{ playtest: playtestMessages }}>
      <RecordResultBar deckId="deck-1" turns={9} mulliganCount={2} onRecorded={onRecorded} />
    </NextIntlClientProvider>
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

  it("closes without recording when the player skips", async () => {
    // An abandoned run is not a loss; recording it as one would poison the
    // win rate it feeds.
    const onRecorded = renderBar();
    await userEvent.click(screen.getByText("Skip"));

    expect(onRecorded).toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
