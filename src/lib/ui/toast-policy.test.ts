/**
 * The toast policy: which toasts wait for the player, how long the others
 * stay, and which ones interrupt a screen reader.
 */
import { describe, expect, it } from "vitest";
import {
  TOAST_READING_TIME_MS,
  toastAnnouncement,
  toastLifetime,
} from "./toast-policy";

describe("toastLifetime", () => {
  it("keeps an error until the player dismisses it", () => {
    expect(toastLifetime("error")).toBeNull();
  });

  it.each(["success", "info", "warning"] as const)(
    "keeps a %s toast the eight-second reading time",
    (type) => {
      expect(toastLifetime(type)).toBe(TOAST_READING_TIME_MS);
      expect(TOAST_READING_TIME_MS).toBe(8_000);
    }
  );
});

describe("toastAnnouncement", () => {
  it("interrupts the screen reader for an error", () => {
    expect(toastAnnouncement("error")).toBe("assertive");
  });

  it.each(["success", "info", "warning"] as const)(
    "waits for the screen reader to be idle for a %s toast",
    (type) => {
      expect(toastAnnouncement(type)).toBe("polite");
    }
  );
});
