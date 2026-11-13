import { describe, expect, it } from "vitest";
import {
  INITIAL_META_STATE,
  beginSourceLoad,
  failSourceLoad,
  finishSourceLoad,
  type MetaState,
} from "./meta-source-state";

const edhrecPayload = { cards: [{ name: "Sol Ring", inclusion: 0.9 }] };
const tournamentPayload = { decks: [] };

/** A state where both sources already answered once, to see what each transition leaves alone. */
function settledState(): MetaState {
  const afterEdhrec = finishSourceLoad(
    beginSourceLoad(INITIAL_META_STATE, "edhrec"),
    "edhrec",
    edhrecPayload
  );
  return failSourceLoad(
    beginSourceLoad(afterEdhrec, "tournament"),
    "tournament",
    "HTTP 502"
  );
}

describe("the meta source state machine", () => {
  it("starts idle for both sources, with nothing loaded and no attempt counted", () => {
    expect(INITIAL_META_STATE).toEqual({
      edhrec: null,
      tournament: null,
      isLoadingEdhrec: false,
      isLoadingTournament: false,
      errorEdhrec: null,
      errorTournament: null,
      sourceHealth: {
        edhrec: { status: "idle", attempts: 0 },
        tournament: { status: "idle", attempts: 0 },
      },
    });
  });

  describe("beginning a load", () => {
    it("marks the source loading, clears its previous error and counts the attempt", () => {
      const failed = failSourceLoad(
        beginSourceLoad(INITIAL_META_STATE, "edhrec"),
        "edhrec",
        "offline"
      );

      const next = beginSourceLoad(failed, "edhrec");

      expect(next.isLoadingEdhrec).toBe(true);
      expect(next.errorEdhrec).toBeNull();
      expect(next.sourceHealth.edhrec.attempts).toBe(2);
    });

    it("keeps the source's last known health status until the answer arrives", () => {
      const failed = failSourceLoad(
        beginSourceLoad(INITIAL_META_STATE, "tournament"),
        "tournament",
        "offline"
      );

      expect(
        beginSourceLoad(failed, "tournament").sourceHealth.tournament.status
      ).toBe("unavailable");
    });

    it("keeps the payload already shown while a refresh is in flight", () => {
      const next = beginSourceLoad(settledState(), "edhrec");

      expect(next.edhrec).toEqual(edhrecPayload);
    });
  });

  describe("finishing a load", () => {
    it("stores the payload, ends loading and marks the source available", () => {
      const next = finishSourceLoad(
        beginSourceLoad(INITIAL_META_STATE, "tournament"),
        "tournament",
        tournamentPayload
      );

      expect(next.tournament).toEqual(tournamentPayload);
      expect(next.isLoadingTournament).toBe(false);
      expect(next.errorTournament).toBeNull();
      expect(next.sourceHealth.tournament).toEqual({
        status: "available",
        attempts: 1,
      });
    });
  });

  describe("failing a load", () => {
    it("stores the message, ends loading and marks the source unavailable", () => {
      const next = failSourceLoad(
        beginSourceLoad(INITIAL_META_STATE, "edhrec"),
        "edhrec",
        "Meta unavailable"
      );

      expect(next.errorEdhrec).toBe("Meta unavailable");
      expect(next.isLoadingEdhrec).toBe(false);
      expect(next.edhrec).toBeNull();
      expect(next.sourceHealth.edhrec).toEqual({
        status: "unavailable",
        attempts: 1,
      });
    });

    it("keeps the payload a previous answer left, so the panel does not blank on a failed refresh", () => {
      const next = failSourceLoad(
        beginSourceLoad(settledState(), "edhrec"),
        "edhrec",
        "offline"
      );

      expect(next.edhrec).toEqual(edhrecPayload);
      expect(next.errorEdhrec).toBe("offline");
    });
  });

  describe("independence of the two sources", () => {
    it("a transition on EDHREC leaves the tournament source untouched", () => {
      const before = settledState();

      const next = finishSourceLoad(
        beginSourceLoad(before, "edhrec"),
        "edhrec",
        edhrecPayload
      );

      expect(next.tournament).toBe(before.tournament);
      expect(next.isLoadingTournament).toBe(before.isLoadingTournament);
      expect(next.errorTournament).toBe(before.errorTournament);
      expect(next.sourceHealth.tournament).toEqual(
        before.sourceHealth.tournament
      );
    });

    it("a transition on the tournament source leaves EDHREC untouched", () => {
      const before = settledState();

      const next = failSourceLoad(
        beginSourceLoad(before, "tournament"),
        "tournament",
        "HTTP 504"
      );

      expect(next.edhrec).toBe(before.edhrec);
      expect(next.isLoadingEdhrec).toBe(before.isLoadingEdhrec);
      expect(next.errorEdhrec).toBe(before.errorEdhrec);
      expect(next.sourceHealth.edhrec).toEqual(before.sourceHealth.edhrec);
    });

    it("never mutates the state it was given", () => {
      const before = settledState();
      const snapshot = structuredClone(before);

      beginSourceLoad(before, "edhrec");
      finishSourceLoad(before, "tournament", tournamentPayload);
      failSourceLoad(before, "edhrec", "offline");

      expect(before).toEqual(snapshot);
    });
  });
});
