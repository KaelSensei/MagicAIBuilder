import { describe, expect, it } from "vitest";
import { ScryfallApiError } from "./api-error";
import {
  MAX_SEARCH_RETRIES,
  isRetryableSearchFailure,
  retrySearchFailure,
} from "./search-retry";

describe("isRetryableSearchFailure", () => {
  it.each([400, 404, 422])(
    "does not send again a search Scryfall answered %i: the same query gets the same answer",
    (status) => {
      expect(
        isRetryableSearchFailure(new ScryfallApiError(status, "rejected"))
      ).toBe(false);
    }
  );

  it.each([429, 500, 503])(
    "sends again a search Scryfall answered %i: the next attempt can pass",
    (status) => {
      expect(
        isRetryableSearchFailure(new ScryfallApiError(status, "unavailable"))
      ).toBe(true);
    }
  );

  it("sends again a search the network failed (fetch's TypeError)", () => {
    expect(isRetryableSearchFailure(new TypeError("Failed to fetch"))).toBe(
      true
    );
  });

  it("sends again a search that failed without a status, as before", () => {
    expect(
      isRetryableSearchFailure(new Error("The operation timed out."))
    ).toBe(true);
  });

  it("reads the status, never the message", () => {
    expect(
      isRetryableSearchFailure(new Error("Scryfall API error 400: rejected"))
    ).toBe(true);
    expect(
      isRetryableSearchFailure(
        new ScryfallApiError(503, "card 404 is out of stock")
      )
    ).toBe(true);
  });
});

describe("retrySearchFailure", () => {
  const outage = new ScryfallApiError(503, "Service Unavailable");

  it("allows two retries of a failure that can pass, then stops", () => {
    expect(MAX_SEARCH_RETRIES).toBe(2);
    expect(retrySearchFailure(0, outage)).toBe(true);
    expect(retrySearchFailure(1, outage)).toBe(true);
    expect(retrySearchFailure(2, outage)).toBe(false);
  });

  it("allows no retry of a search Scryfall rejected", () => {
    expect(
      retrySearchFailure(0, new ScryfallApiError(400, "Bad Request"))
    ).toBe(false);
  });
});
