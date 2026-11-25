import { describe, expect, it } from "vitest";
import { ScryfallApiError } from "@/lib/scryfall/api-error";
import { searchFailureMessageKey } from "./search-failure";

describe("searchFailureMessageKey", () => {
  it.each([400, 422])(
    "says Scryfall could not read the search when it rejects the query with %i",
    (status) => {
      expect(
        searchFailureMessageKey(new ScryfallApiError(status, "Bad query"))
      ).toBe("failure.rejectedQuery");
    }
  );

  it.each([429, 500, 503])(
    "says card search is unavailable when Scryfall answers %i",
    (status) => {
      expect(
        searchFailureMessageKey(new ScryfallApiError(status, "Unavailable"))
      ).toBe("failure.unavailable");
    }
  );

  it("says card search is unavailable when the network failed", () => {
    expect(searchFailureMessageKey(new TypeError("Failed to fetch"))).toBe(
      "failure.unavailable"
    );
  });

  it("reads the status, not the message: a plain error quoting a 400 is still an outage", () => {
    expect(
      searchFailureMessageKey(new Error("Scryfall API error 400: Bad query"))
    ).toBe("failure.unavailable");
  });

  it("says card search is unavailable for a thrown value that is not an error", () => {
    expect(searchFailureMessageKey("timeout")).toBe("failure.unavailable");
  });
});
