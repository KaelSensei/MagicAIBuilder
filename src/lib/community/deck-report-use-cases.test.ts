import { describe, expect, it } from "vitest";

import { reportDeck, type ReportUseCasePorts } from "./deck-report-use-cases";
import type { DeckVisibilityFacts } from "./deck-visibility-policy";
import {
  inMemoryDeckFactsReader,
  inMemoryDeckReportStore,
  reporterKey,
  type FakeReportRow,
} from "./testing/deck-action-fakes";

const OWNER = "owner-1";
const REPORTER = "reporter-1";
const DECK = "deck-1";
const PUBLIC_DECK: DeckVisibilityFacts = {
  ownerId: OWNER,
  isPublic: true,
  shareEnabled: false,
};
const PRIVATE_DECK: DeckVisibilityFacts = {
  ownerId: OWNER,
  isPublic: false,
  shareEnabled: false,
};

function ports(
  decks: Readonly<Record<string, DeckVisibilityFacts>>,
  seed: readonly FakeReportRow[] = []
): {
  readonly ports: ReportUseCasePorts;
  readonly reports: ReturnType<typeof inMemoryDeckReportStore>;
} {
  const reports = inMemoryDeckReportStore(seed);
  return {
    ports: { decks: inMemoryDeckFactsReader(decks), reports },
    reports,
  };
}

const command = (reason: "spam" | "harassment" = "spam") => ({
  deckId: DECK,
  reporterId: REPORTER,
  reason,
});

const storedReport = (store: ReturnType<typeof inMemoryDeckReportStore>) =>
  store.rows.get(reporterKey({ reporterId: REPORTER, deckId: DECK }));

describe("reportDeck", () => {
  it("files a pending report on a public deck", async () => {
    const { ports: p, reports } = ports({ [DECK]: PUBLIC_DECK });

    await expect(reportDeck(command(), p)).resolves.toEqual({
      kind: "filed",
      status: "pending",
    });
    expect(storedReport(reports)).toEqual({
      reporterId: REPORTER,
      deckId: DECK,
      reason: "spam",
      status: "pending",
    });
  });

  it("replaces the reason of the reporter's report while it is pending", async () => {
    const { ports: p, reports } = ports({ [DECK]: PUBLIC_DECK }, [
      { reporterId: REPORTER, deckId: DECK, reason: "spam", status: "pending" },
    ]);

    await expect(reportDeck(command("harassment"), p)).resolves.toEqual({
      kind: "filed",
      status: "pending",
    });
    expect(reports.rows.size).toBe(1);
    expect(storedReport(reports)).toMatchObject({
      reason: "harassment",
      status: "pending",
    });
  });

  it.each(["reviewed", "dismissed"] as const)(
    "leaves a %s report closed when its reporter reports the deck again",
    async (status) => {
      const { ports: p, reports } = ports({ [DECK]: PUBLIC_DECK }, [
        { reporterId: REPORTER, deckId: DECK, reason: "spam", status },
      ]);

      await expect(reportDeck(command("harassment"), p)).resolves.toEqual({
        kind: "filed",
        status: "closed",
      });
      expect(storedReport(reports)).toMatchObject({ reason: "spam", status });
      expect(reports.rows.size).toBe(1);
    }
  );

  it("files another reporter's report on a deck whose earlier report was closed", async () => {
    const { ports: p, reports } = ports({ [DECK]: PUBLIC_DECK }, [
      {
        reporterId: "reporter-2",
        deckId: DECK,
        reason: "spam",
        status: "dismissed",
      },
    ]);

    await expect(reportDeck(command(), p)).resolves.toEqual({
      kind: "filed",
      status: "pending",
    });
    expect(reports.rows.size).toBe(2);
  });

  it("answers not-found for a deck that does not exist", async () => {
    const { ports: p, reports } = ports({});

    await expect(reportDeck(command(), p)).resolves.toEqual({
      kind: "not-found",
    });
    expect(reports.rows.size).toBe(0);
  });

  it("answers not-found for a private deck, so a stranger cannot tell it from a missing one", async () => {
    const { ports: p, reports } = ports({ [DECK]: PRIVATE_DECK });

    await expect(reportDeck(command(), p)).resolves.toEqual({
      kind: "not-found",
    });
    expect(reports.rows.size).toBe(0);
  });

  it("refuses the owner's report of their own deck and stores nothing", async () => {
    const { ports: p, reports } = ports({ [DECK]: PUBLIC_DECK });

    await expect(
      reportDeck({ ...command(), reporterId: OWNER }, p)
    ).resolves.toEqual({ kind: "own-deck" });
    expect(reports.rows.size).toBe(0);
  });
});
