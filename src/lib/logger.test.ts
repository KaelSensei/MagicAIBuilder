import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const captureException = vi.fn();
const captureMessage = vi.fn();

vi.mock("@sentry/nextjs", () => ({
  captureException: (...args: readonly unknown[]) => captureException(...args),
  captureMessage: (...args: readonly unknown[]) => captureMessage(...args),
}));

// Imported after the mock so the logger picks up the stubbed Sentry client.
const { logger, toLogPayload } = await import("./logger");

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    captureException.mockReset();
    captureMessage.mockReset();
  });

  describe("info", () => {
    it("writes to console.info with a bracketed context prefix", () => {
      logger.info("cache warmed", "scryfall");

      expect(console.info).toHaveBeenCalledWith("[scryfall]", "cache warmed");
    });

    it("omits the prefix when no context is given", () => {
      logger.info("booted");

      expect(console.info).toHaveBeenCalledWith("", "booted");
    });

    it("does not report to Sentry", () => {
      logger.info("cache warmed", "scryfall");

      expect(captureException).not.toHaveBeenCalled();
      expect(captureMessage).not.toHaveBeenCalled();
    });
  });

  describe("warn", () => {
    it("writes to console.warn with the context prefix", () => {
      logger.warn("rate limited", "scryfall");

      expect(console.warn).toHaveBeenCalledWith("[scryfall]", "rate limited");
    });

    it("does not report to Sentry", () => {
      logger.warn("rate limited", "scryfall");

      expect(captureException).not.toHaveBeenCalled();
    });
  });

  describe("error", () => {
    it("writes to console.error with the context prefix", () => {
      logger.error("boom", "GET /api/decks");

      expect(console.error).toHaveBeenCalledWith("[GET /api/decks]", "boom");
    });

    it("reports the Error passed as the first argument, preserving its stack", () => {
      const cause = new Error("db unreachable");

      logger.error(cause, "GET /api/health");

      expect(captureException).toHaveBeenCalledTimes(1);
      const [reported] = captureException.mock.calls[0];
      expect(reported).toBe(cause);
      expect((reported as Error).stack).toBe(cause.stack);
    });

    it("logs the message of an Error passed as the first argument", () => {
      logger.error(new Error("db unreachable"), "GET /api/health");

      expect(console.error).toHaveBeenCalledWith(
        "[GET /api/health]",
        "db unreachable"
      );
    });

    it("recovers the Error from the meta arguments when the message is a string", () => {
      const cause = new Error("write conflict");

      logger.error("Unexpected error", "addCard", cause);

      expect(captureException).toHaveBeenCalledTimes(1);
      expect(captureException.mock.calls[0][0]).toBe(cause);
    });

    it("tags the report with the context so Sentry can group by route", () => {
      const cause = new Error("write conflict");

      logger.error("Unexpected error", "addCard", cause);

      const [, options] = captureException.mock.calls[0];
      expect(options).toMatchObject({ tags: { context: "addCard" } });
    });

    it("synthesises an Error when no Error is available anywhere", () => {
      logger.error("plain failure", "POST /api/decks");

      expect(captureException).toHaveBeenCalledTimes(1);
      const [reported] = captureException.mock.calls[0];
      expect(reported).toBeInstanceOf(Error);
      expect((reported as Error).message).toBe("plain failure");
    });

    it("attaches non-Error meta as extra context", () => {
      logger.error("lookup failed", "GET /api/cache/cards", { id: "abc" });

      const [, options] = captureException.mock.calls[0];
      expect(options).toMatchObject({ extra: { meta: [{ id: "abc" }] } });
    });

    it("keeps logging to the console when Sentry reporting throws", () => {
      captureException.mockImplementation(() => {
        throw new Error("sentry offline");
      });

      expect(() => logger.error("boom", "GET /api/decks")).not.toThrow();
      expect(console.error).toHaveBeenCalledWith("[GET /api/decks]", "boom");
    });
  });

  describe("toLogPayload", () => {
    // The structured (Pino) path emits one JSON object per line; this payload
    // is everything that rides alongside `level`, `time` and `msg`.
    it("carries the context under a searchable key", () => {
      expect(toLogPayload("GET /api/decks", [])).toEqual({
        context: "GET /api/decks",
      });
    });

    it("omits keys that have nothing to say", () => {
      expect(toLogPayload(undefined, [])).toEqual({});
    });

    it("attaches meta values when present", () => {
      expect(toLogPayload("addCard", [{ id: "abc" }])).toEqual({
        context: "addCard",
        meta: [{ id: "abc" }],
      });
    });

    it("puts an Error under the err key Pino serialises stacks from", () => {
      const cause = new Error("db unreachable");
      const payload = toLogPayload("GET /api/health", [], cause);

      expect(payload.err).toBe(cause);
    });

    it("keeps the Error out of meta so it is not serialised twice", () => {
      const cause = new Error("write conflict");
      const payload = toLogPayload("addCard", ["detail", cause], cause);

      expect(payload.err).toBe(cause);
      expect(payload.meta).toEqual(["detail"]);
    });
  });
});
