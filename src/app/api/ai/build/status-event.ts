/**
 * The build route's `status` events: the step the build reached, for the
 * wizard to word in the player's language (`lib/ai/build-step.ts`).
 *
 * Each event also keeps the English line the route sent before steps existed
 * (I-02). A wizard loaded before the deploy reads only that line, so it keeps
 * a progress line until the player reloads; the current wizard ignores it.
 * Drop `message` one release after steps shipped.
 */
import type { BuildStep } from "@/lib/ai/build-step";
import type { BuildEvent } from "./types";

/** The English line each step carried before steps existed; for older clients only. */
const LEGACY_STATUS_LINE: Readonly<Record<BuildStep, string>> = {
  thinking: "Thinking…",
  consulting: "Consulting the AI oracle…",
  building: "Building card list…",
};

/**
 * The status event the route streams when the build reaches a step.
 *
 * @param step - the step the build reached
 * @returns the event, with the step and the step's legacy English line
 */
export function statusEvent(
  step: BuildStep
): Extract<BuildEvent, { type: "status" }> {
  return { type: "status", step, message: LEGACY_STATUS_LINE[step] };
}
