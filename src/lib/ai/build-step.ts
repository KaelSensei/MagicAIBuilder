/**
 * What an AI deck build is doing, as a code the client words in the player's
 * language.
 *
 * AI copilot context, shared by the build route and the wizard. The route used
 * to stream fixed English lines ("Consulting the AI oracle…"), and the wizard
 * showed the last one, so a French player read English on every build (I-02).
 * Each `status` event now names its step; the wizard picks the step's sentence
 * from the `deck` catalog, and never shows a line the server wrote.
 *
 * @module ai/build-step
 */

/**
 * A step of the build route's progress, in the order a model build sends
 * them: `thinking` when the stream opens, `consulting` while the model
 * answers, `building` once the checked list streams. A placeholder build skips
 * `consulting`.
 */
export type BuildStep = "thinking" | "consulting" | "building";

/** A `deck` catalog key for the line the wizard shows during a build. */
export type BuildStepMessageKey =
  "wizard.thinking" | "wizard.buildStepConsulting" | "wizard.buildStepBuilding";

/** Every step; the key set is checked against the type. */
const BUILD_STEPS: Readonly<Record<BuildStep, true>> = {
  thinking: true,
  consulting: true,
  building: true,
};

/**
 * True when a value read off the wire is a step this client can word.
 *
 * @param value - the `step` field of a parsed status event
 * @returns whether it is one of the known steps
 */
export function isBuildStep(value: unknown): value is BuildStep {
  return typeof value === "string" && Object.hasOwn(BUILD_STEPS, value);
}

/**
 * The line the wizard shows for a build's current step, as a key of the
 * `deck` catalog.
 *
 * @param step - the last step the build named, or null before its first
 *   status line this client can read
 * @returns the step's key; the generic "thinking" line when there is no step
 */
export function buildStepMessageKey(
  step: BuildStep | null
): BuildStepMessageKey {
  switch (step) {
    case null:
    case "thinking":
      return "wizard.thinking";
    case "consulting":
      return "wizard.buildStepConsulting";
    case "building":
      return "wizard.buildStepBuilding";
    default: {
      const unhandled: never = step;
      return unhandled;
    }
  }
}
