import { describe, expect, it } from "vitest";
import {
  isMetaApiResponse,
  metaErrorMessage,
  thrownMetaMessage,
} from "./meta-api-response";

describe("recognising a meta payload", () => {
  it("accepts any JSON object, including an empty one", () => {
    expect(isMetaApiResponse({ cards: [] })).toBe(true);
    expect(isMetaApiResponse({})).toBe(true);
  });

  it("rejects an array, null and primitives", () => {
    expect(isMetaApiResponse([{ name: "Sol Ring" }])).toBe(false);
    expect(isMetaApiResponse(null)).toBe(false);
    expect(isMetaApiResponse("cards")).toBe(false);
    expect(isMetaApiResponse(42)).toBe(false);
  });
});

describe("reading the error of a meta response", () => {
  it("surfaces the body's error field even when the status is 200", () => {
    expect(metaErrorMessage({ error: "Meta unavailable" }, 200)).toBe(
      "Meta unavailable"
    );
  });

  it("prefers the body's error field over the HTTP status", () => {
    expect(metaErrorMessage({ error: "Upstream down" }, 502)).toBe(
      "Upstream down"
    );
  });

  it("falls back to the HTTP status when a failed response carries no error text", () => {
    expect(metaErrorMessage({}, 502)).toBe("HTTP 502");
    expect(metaErrorMessage({ error: "" }, 404)).toBe("HTTP 404");
  });

  it("has no error for a 2xx body without an error field", () => {
    expect(metaErrorMessage({ cards: [] }, 200)).toBeNull();
    expect(metaErrorMessage({ decks: [] }, 204)).toBeNull();
  });
});

describe("naming a thrown failure", () => {
  it("keeps the message of an Error", () => {
    expect(thrownMetaMessage(new Error("offline"))).toBe("offline");
    expect(thrownMetaMessage(new TypeError("Failed to fetch"))).toBe(
      "Failed to fetch"
    );
  });

  it("falls back to a generic message for anything that is not an Error", () => {
    expect(thrownMetaMessage("boom")).toBe("Failed to load meta");
    expect(thrownMetaMessage(undefined)).toBe("Failed to load meta");
  });
});
