/**
 * The set autocomplete when its sets cannot be loaded from api.scryfall.com.
 *
 * The list of sets waits its turn in the runtime's Scryfall queue, so during a
 * 429 block it is refused without a request, and the field shows the failure a
 * network error shows. Sociable: the real client and the real runtime queue,
 * with only the global `fetch` stubbed.
 *
 * Every case here starts with no sets loaded. The component keeps the sets it
 * loaded in a module-level cache, so a successful load would make the next
 * cases of this file skip the request.
 *
 * @module components/search/SetAutocomplete.scryfall-block.test
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { logger } from "@/lib/logger";
import { SCRYFALL_API } from "@/lib/scryfall/constants";
import { scheduleScryfallRequest } from "@/lib/scryfall/request-queue";
import { renderWithProviders } from "@/test/render";
import { SetAutocomplete } from "./SetAutocomplete";

/** Has Scryfall answer another request of this tab with 429, which starts the queue's block. */
async function startScryfallBlock(): Promise<void> {
  await scheduleScryfallRequest(
    `${SCRYFALL_API}/cards/search?q=sol`,
    async () => new Response(null, { status: 429 })
  );
}

/** Renders the empty set field and focuses it, which loads the sets. */
async function openTheSetField(): Promise<void> {
  const user = userEvent.setup();
  renderWithProviders(
    <SetAutocomplete value="" onChange={vi.fn()} onClear={vi.fn()} />
  );
  await user.click(screen.getByRole("textbox"));
}

describe("SetAutocomplete when the sets cannot be loaded", () => {
  beforeEach(() => {
    vi.spyOn(logger, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("says the sets failed to load when the network fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch"))
    );

    await openTheSetField();

    expect(await screen.findByText("Failed to load sets")).toBeInTheDocument();
  });

  it("says the same during a Scryfall 429 block, without calling fetch", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        data: [
          {
            code: "aer",
            name: "Aether Revolt",
            set_type: "expansion",
            card_count: 194,
          },
        ],
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    await startScryfallBlock();

    await openTheSetField();

    expect(await screen.findByText("Failed to load sets")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
