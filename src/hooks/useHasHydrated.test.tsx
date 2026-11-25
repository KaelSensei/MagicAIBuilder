/**
 * `useHasHydrated` through the three renders a component meets: the server
 * render, the hydration over its HTML, and a client render that is not a
 * hydration.
 */
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  hydrateWithIntl,
  renderToStringWithIntl,
} from "@/test/hydrate-with-intl";
import { useHasHydrated } from "./useHasHydrated";

/** Prints what the hook returns, so the HTML shows each render's answer. */
function HydrationProbe() {
  return <p>{useHasHydrated() ? "hydrated" : "server"}</p>;
}

describe("useHasHydrated", () => {
  it("is false in the server render", () => {
    expect(renderToStringWithIntl(<HydrationProbe />)).toContain("server");
  });

  it("hydrates with the server's answer, then turns true", async () => {
    const html = renderToStringWithIntl(<HydrationProbe />);

    const hydrated = await hydrateWithIntl(html, <HydrationProbe />);

    expect(hydrated.mismatches).toEqual([]);
    expect(hydrated.container).toHaveTextContent("hydrated");
    hydrated.unmount();
  });

  it("is true at once in a render that is not a hydration", () => {
    const { result } = renderHook(() => useHasHydrated());

    expect(result.current).toBe(true);
  });
});
