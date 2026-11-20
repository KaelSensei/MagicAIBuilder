/**
 * Reads one untrusted copilot claim back into the two kinds the API sends.
 *
 * AI copilot, pure. The builder in `suggestion-claims` is the only writer;
 * this reader is what a test, or a later panel, uses to refuse an untyped
 * claim. A checked claim needs a known source and a UTC observation time. A
 * reasoned claim is refused when it carries either.
 *
 * @module ai/suggestion-claim-read
 */
import { isRecord } from "@/lib/guards";
import {
  isClaimSource,
  isObservationInstant,
  type CheckedClaim,
  type CopilotClaim,
  type ReasonedClaim,
} from "./suggestion-claims";

function readChecked(value: Record<string, unknown>): CheckedClaim | undefined {
  if (
    typeof value.text !== "string" ||
    value.text.length === 0 ||
    typeof value.source !== "string" ||
    !isClaimSource(value.source) ||
    typeof value.observedAt !== "string" ||
    !isObservationInstant(value.observedAt)
  ) {
    return undefined;
  }
  return {
    kind: "checked",
    text: value.text,
    source: value.source,
    observedAt: value.observedAt,
  };
}

function readReasoned(
  value: Record<string, unknown>
): ReasonedClaim | undefined {
  if (typeof value.text !== "string" || value.text.length === 0) {
    return undefined;
  }
  if ("source" in value || "observedAt" in value) return undefined;
  return { kind: "reasoned", text: value.text };
}

/**
 * Reads one untrusted claim.
 *
 * @param value - a parsed JSON value
 * @returns the claim, or undefined when it is not one of the two kinds
 */
export function readCopilotClaim(value: unknown): CopilotClaim | undefined {
  if (!isRecord(value) || typeof value.kind !== "string") return undefined;
  switch (value.kind) {
    case "checked":
      return readChecked(value);
    case "reasoned":
      return readReasoned(value);
    default:
      return undefined;
  }
}
