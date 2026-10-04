import { describe, expect, it } from "vitest";
import { evidenceLabel, type MetaEvidenceKind } from "./evidence-label";

describe("evidenceLabel", () => {
  it.each([
    ["popular", "popular recommendations"],
    ["synergy", "high-synergy recommendations"],
    ["tournament", "tournament observations"],
    ["ai", "AI suggestions"],
  ] satisfies readonly [MetaEvidenceKind, string][]) (
    "labels %s evidence as %s",
    (kind, expected) => {
      expect(evidenceLabel(kind)).toBe(expected);
    }
  );
});
