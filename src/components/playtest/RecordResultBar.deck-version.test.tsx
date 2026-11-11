import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import playtestMessages from "@/messages/en/playtest.json";
import { deckCard, FAKE_DECK, playtestDb } from "@/test/playtest-db-fake";
import { GET, POST } from "@/app/api/decks/[id]/playtest-sessions/route";
import { RecordResultBar } from "./RecordResultBar";
import { PlaytestHistoryPanel } from "./PlaytestHistoryPanel";

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  const { playtestDb: db } = await import("@/test/playtest-db-fake");
  return stubPrisma(await importOriginal(), db.prisma);
});

vi.mock("@/lib/auth/config", () => ({
  auth: async () => ({ user: { id: FAKE_DECK.userId } }),
}));

const SAVED_DECK = [
  deckCard("Atraxa, Praetors' Voice", { isCommander: true }),
  deckCard("Sol Ring"),
  deckCard("Forest", { quantity: 10 }),
];

/** The same deck after the player swaps one card in the builder. */
const EDITED_DECK = [
  deckCard("Atraxa, Praetors' Voice", { isCommander: true }),
  deckCard("Arcane Signet"),
  deckCard("Forest", { quantity: 10 }),
];

/**
 * Sends the component's requests to the real route handlers, so the test
 * follows a click all the way to the stored session.
 */
function routeFetchToHandlers(): void {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const request = new Request(
      new URL(String(input), "http://localhost"),
      init
    );
    const params = { params: Promise.resolve({ id: FAKE_DECK.id }) };
    return request.method === "POST"
      ? POST(request, params)
      : GET(request, params);
  });
}

/**
 * Renders the result bar, and optionally the history panel that reads the
 * recorded runs back, against one query cache as the playtest modal does.
 *
 * @param options.withHistory - Also render the history panel.
 * @returns The bar's `onRecorded` spy.
 */
function renderBar({ withHistory = false } = {}) {
  const onRecorded = vi.fn();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider
        locale="en"
        messages={{ playtest: playtestMessages }}
      >
        <RecordResultBar
          deckId={FAKE_DECK.id}
          turns={7}
          mulliganCount={1}
          cardsSeen={14}
          additionalCardsSeen={0}
          onRecorded={onRecorded}
        />
        {withHistory && <PlaytestHistoryPanel deckId={FAKE_DECK.id} />}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
  return onRecorded;
}

/**
 * Clicks a result and waits until the run is stored.
 *
 * @param onRecorded - The bar's `onRecorded` spy.
 * @param label - The result button to click.
 */
async function recordRun(
  onRecorded: ReturnType<typeof vi.fn>,
  label: "Win" | "Loss"
): Promise<void> {
  const before = onRecorded.mock.calls.length;
  await userEvent.click(screen.getByRole("button", { name: label }));
  await waitFor(() => expect(onRecorded).toHaveBeenCalledTimes(before + 1));
}

beforeEach(() => {
  playtestDb.reset(SAVED_DECK);
  routeFetchToHandlers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RecordResultBar — deck versions", () => {
  it("files the recorded run under a snapshot of the deck that was played", async () => {
    const onRecorded = renderBar();
    await recordRun(onRecorded, "Win");

    const [session] = playtestDb.sessions();
    expect(session.snapshotId).toEqual(expect.any(String));
    const snapshot = playtestDb
      .snapshots()
      .find(({ id }) => id === session.snapshotId);
    expect(snapshot?.cardList).toEqual(SAVED_DECK);
  });

  it("offers runs recorded on two deck versions to the history panel's comparison", async () => {
    const onRecorded = renderBar({ withHistory: true });
    await recordRun(onRecorded, "Win");
    await recordRun(onRecorded, "Loss");
    playtestDb.saveCards(EDITED_DECK);
    await recordRun(onRecorded, "Win");

    const before = await screen.findByRole("combobox", {
      name: "Before version",
    });
    const versions = Array.from(
      before.querySelectorAll("option"),
      (option) => option.textContent
    );
    expect(versions).toEqual([
      "Choose a version",
      "Nov 9, 2026 · 2 runs",
      "Nov 9, 2026 · 1 run",
    ]);
  });
});
