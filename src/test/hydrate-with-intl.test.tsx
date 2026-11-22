/**
 * Pins the kit's server-render-then-hydrate helper: it must report a text that
 * differs between the server and the browser, or a test that relies on it to
 * prove "no mismatch" would pass for nothing.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  hydrateWithIntl,
  renderToStringWithIntl,
} from "@/test/hydrate-with-intl";

/** Shows the clock's current second, so a moved clock changes the text. */
function ClockSecond() {
  return <p>{new Date().getUTCSeconds()}</p>;
}

/** Shows the same text whatever the clock says. */
function Steady() {
  return <p>steady</p>;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-21T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("hydrateWithIntl", () => {
  it("reports a text the browser renders differently from the server", async () => {
    const html = renderToStringWithIntl(<ClockSecond />);
    vi.setSystemTime(new Date("2026-11-21T12:00:07.000Z"));

    const hydrated = await hydrateWithIntl(html, <ClockSecond />);

    expect(hydrated.mismatches).not.toHaveLength(0);
    hydrated.unmount();
  });

  it("reports nothing when the browser renders what the server sent", async () => {
    const html = renderToStringWithIntl(<Steady />);

    const hydrated = await hydrateWithIntl(html, <Steady />);

    expect(hydrated.mismatches).toEqual([]);
    expect(hydrated.container).toHaveTextContent("steady");
    hydrated.unmount();
  });
});
