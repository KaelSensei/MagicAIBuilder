import { describe, expect, it } from "vitest";
import {
  applyAcquisitionChoice,
  readAcquisitionIntents,
} from "./acquisition-intent";

describe("readAcquisitionIntents", () => {
  it("indexes known modes and skips malformed rows", () => {
    expect(
      readAcquisitionIntents({
        intents: [
          { scryfallId: "sol", mode: "buy_later" },
          { scryfallId: "bolt", mode: "proxy_now" },
          { scryfallId: "bad", mode: "maybe" },
          { mode: "buy_later" },
        ],
      })
    ).toEqual({ sol: "buy_later", bolt: "proxy_now" });
  });

  it("returns an empty map when the intents field is absent", () => {
    expect(readAcquisitionIntents({})).toEqual({});
  });

  it("returns null when the body cannot be trusted", () => {
    expect(readAcquisitionIntents(null)).toBeNull();
    expect(readAcquisitionIntents({ intents: "nope" })).toBeNull();
  });
});

describe("applyAcquisitionChoice", () => {
  it("sets, replaces, and clears one printing without touching another", () => {
    const withLater = applyAcquisitionChoice({}, "sol", "buy_later");
    expect(withLater).toEqual({ sol: "buy_later" });

    const withBoth = applyAcquisitionChoice(withLater, "bolt", "proxy_now");
    const cleared = applyAcquisitionChoice(withBoth, "sol", "buy_now");
    expect(cleared).toEqual({ bolt: "proxy_now" });
  });
});
