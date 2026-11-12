/**
 * Import from URL when the card lookup cannot answer.
 *
 * The app's URL import route and Scryfall are both served by MSW at the HTTP boundary; the tab,
 * the deck store, the lookup helper and the Scryfall client are the real ones. The list the route
 * returned is looked up on Scryfall before the preview; here Scryfall times out, as it did in the
 * pre-push E2E gate on 2026-11-12.
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UrlImportResult } from "@/lib/import/url-import";
import { __resetRateLimiter } from "@/lib/scryfall/client";
import { SCRYFALL_API } from "@/lib/scryfall/constants";
import { useDeckStore } from "@/lib/deck/store";
import { aDeck } from "@/test/builders/deck";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
import { ImportFromUrlTab } from "./ImportFromUrlTab";

const COLLECTION_URL = `${SCRYFALL_API}/cards/collection`;

/** The route's answer for a one-card Moxfield deck. */
const FETCHED_DECK: UrlImportResult = {
  name: "Sol Ring and friends",
  source: "moxfield",
  cards: [
    {
      name: "Sol Ring",
      quantity: 1,
      isCommander: false,
      isPartner: false,
      zone: "main",
    },
  ],
  ignored: [],
};

const server = setupMsw(
  http.post("/api/import/url", () => HttpResponse.json(FETCHED_DECK))
);

/**
 * Scryfall taking the collection request and never answering it; the client's next
 * `AbortSignal.timeout` is a signal this handler fires with a browser's own reason.
 */
function scryfallTimesOut() {
  const clientTimeout = new AbortController();
  vi.spyOn(AbortSignal, "timeout").mockReturnValueOnce(clientTimeout.signal);
  return http.post(
    COLLECTION_URL,
    async () => {
      clientTimeout.abort(new DOMException("signal timed out", "TimeoutError"));
      await delay("infinite");
    },
    { once: true }
  );
}

describe("ImportFromUrlTab — when the card lookup cannot answer", () => {
  beforeEach(() => {
    useDeckStore.setState({
      decks: { "deck-1": aDeck() },
      activeDeckId: "deck-1",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    __resetRateLimiter();
  });

  it("says the card lookup did not answer, instead of the browser's own words", async () => {
    server.use(scryfallTimesOut());
    const user = userEvent.setup();
    renderWithProviders(<ImportFromUrlTab />);

    await user.type(
      screen.getByRole("textbox", { name: /moxfield publicId/ }),
      "https://moxfield.com/decks/abc123"
    );
    await user.click(screen.getByRole("button", { name: "Import" }));

    expect(
      await screen.findByText(
        "The card lookup did not answer. Nothing was imported; try again."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/signal timed out/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import" })).toBeEnabled();
  });
});
