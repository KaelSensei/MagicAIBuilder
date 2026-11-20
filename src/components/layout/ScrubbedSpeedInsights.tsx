"use client";

/**
 * Vercel Speed Insights, reporting each page's URL without share tokens,
 * usernames or query strings (I-39 requirement 9.3).
 *
 * A client component because `beforeSend` is a function, which the server
 * root layout cannot pass to a client component.
 *
 * @module components/layout/ScrubbedSpeedInsights
 */

import type { ComponentProps, ReactElement } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { scrubTelemetryUrl } from "@/lib/telemetry/scrub-url";

/** The event Speed Insights hands to `beforeSend` before it reports it. */
type SpeedInsightsEvent = Parameters<
  NonNullable<ComponentProps<typeof SpeedInsights>["beforeSend"]>
>[0];

/** Scrubs the page URL of a Speed Insights event; keeps its route template. */
function scrubSpeedInsightsEvent(
  event: SpeedInsightsEvent
): SpeedInsightsEvent {
  return { ...event, url: scrubTelemetryUrl(event.url) };
}

/**
 * Renders Speed Insights with a `beforeSend` that scrubs every reported URL.
 * The hook is a module-level function, so its identity never changes and
 * Speed Insights registers it once.
 */
export function ScrubbedSpeedInsights(): ReactElement {
  return <SpeedInsights beforeSend={scrubSpeedInsightsEvent} />;
}
