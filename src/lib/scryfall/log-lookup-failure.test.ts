import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/logger";
import { ScryfallApiError } from "@/lib/scryfall/api-error";
import { ScryfallBlockedError } from "@/lib/scryfall/request-queue";
import { logScryfallLookupFailure } from "./log-lookup-failure";

const MESSAGES = {
  blocked: "Lookup not sent during a Scryfall 429 block",
  failed: "Lookup failed",
} as const;

function spyOnLogger() {
  return {
    info: vi.spyOn(logger, "info").mockImplementation(() => undefined),
    error: vi.spyOn(logger, "error").mockImplementation(() => undefined),
  };
}

describe("logScryfallLookupFailure", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs a lookup the queue refused during a 429 block at info, not as an error", () => {
    const log = spyOnLogger();

    logScryfallLookupFailure(new ScryfallBlockedError(0), "test", MESSAGES);

    expect(log.info).toHaveBeenCalledWith(MESSAGES.blocked, "test");
    expect(log.error).not.toHaveBeenCalled();
  });

  it("logs a 429 Scryfall really answered as an error, with the error", () => {
    const log = spyOnLogger();
    const answered = new ScryfallApiError(429, "Too Many Requests");

    logScryfallLookupFailure(answered, "test", MESSAGES);

    expect(log.error).toHaveBeenCalledWith(MESSAGES.failed, "test", answered);
    expect(log.info).not.toHaveBeenCalled();
  });

  it("logs any other failure as an error, with the error", () => {
    const log = spyOnLogger();
    const failure = new TypeError("Failed to fetch");

    logScryfallLookupFailure(failure, "test", MESSAGES);

    expect(log.error).toHaveBeenCalledWith(MESSAGES.failed, "test", failure);
    expect(log.info).not.toHaveBeenCalled();
  });
});
