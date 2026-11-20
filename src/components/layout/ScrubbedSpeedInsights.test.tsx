import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import type { SpeedInsights } from "@vercel/speed-insights/next";
import { renderWithProviders } from "@/test/render";
import { ScrubbedSpeedInsights } from "./ScrubbedSpeedInsights";

type SpeedInsightsProps = ComponentProps<typeof SpeedInsights>;

/** Every set of props the app rendered Speed Insights with. */
const speedInsights = vi.hoisted(() => {
  const props: SpeedInsightsProps[] = [];
  return { props };
});

// Vercel's Speed Insights script is an external boundary: the test reads the
// `beforeSend` the app hands to it instead of loading the script in jsdom.
vi.mock(import("@vercel/speed-insights/next"), () => ({
  SpeedInsights: (props: SpeedInsightsProps) => {
    speedInsights.props.push(props);
    return null;
  },
}));

describe("ScrubbedSpeedInsights", () => {
  it("reports a share page's vitals without its token or query string", () => {
    renderWithProviders(<ScrubbedSpeedInsights />);
    const beforeSend = speedInsights.props.at(-1)?.beforeSend;

    const sent = beforeSend?.({
      type: "vital",
      url: "https://magicaibuilder.app/fr/share/abc123?x=1",
      route: "/[locale]/share/[token]",
    });

    expect(sent).toEqual({
      type: "vital",
      url: "https://magicaibuilder.app/fr/share/[token]",
      route: "/[locale]/share/[token]",
    });
  });
});
