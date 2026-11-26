import { describe, expect, it } from "vitest";
import enDeck from "@/messages/en/deck.json";
import frDeck from "@/messages/fr/deck.json";
import {
  buildStepMessageKey,
  isBuildStep,
  type BuildStep,
  type BuildStepMessageKey,
} from "@/lib/ai/build-step";

describe("buildStepMessageKey", () => {
  it.each<[BuildStep | null, BuildStepMessageKey]>([
    ["thinking", "wizard.thinking"],
    ["consulting", "wizard.buildStepConsulting"],
    ["building", "wizard.buildStepBuilding"],
    [null, "wizard.thinking"],
  ])("words the %s step with the deck catalog's %s", (step, key) => {
    expect(buildStepMessageKey(step)).toBe(key);
  });

  it.each([
    ["en", enDeck.wizard],
    ["fr", frDeck.wizard],
  ])("finds every step's line in the %s catalog", (_locale, wizard) => {
    const lines = (["thinking", "consulting", "building"] as const).map(
      (step) => buildStepMessageKey(step).replace("wizard.", "")
    );

    expect(lines.filter((line) => !Object.hasOwn(wizard, line))).toEqual([]);
  });
});

describe("isBuildStep", () => {
  it.each(["thinking", "consulting", "building"])(
    "accepts the known step %s",
    (step) => {
      expect(isBuildStep(step)).toBe(true);
    }
  );

  it.each([
    ["a step this client does not know", "polishing"],
    ["a key inherited by every object", "toString"],
    ["a server's English line", "Thinking…"],
    ["no step at all", undefined],
    ["a number", 1],
  ])("rejects %s", (_case, value) => {
    expect(isBuildStep(value)).toBe(false);
  });
});
