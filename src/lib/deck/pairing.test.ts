/**
 * Commander pairing against CR 702.124, with real Oracle texts.
 *
 * Each row names the rule it pins. Every pair is checked in both orders,
 * because the rules let either card sit in the commander slot.
 */
import { describe, it, expect } from "vitest";
import {
  canPairCommanders,
  detectPairingType,
  pairCommanders,
  partnerSlotLabel,
  supportsPartner,
} from "./pairing";
import type { PairingCard } from "./partner-abilities";
import type { CommanderPairingType } from "./types";
import {
  AMY_POND,
  ATREUS,
  ATRAXA,
  BJORNA,
  BRALLIN,
  CANDLEKEEP_SAGE,
  CECILY,
  CECILY_SAVED_BEFORE_RENAME,
  CLAN_CRAFTER,
  CLARA_OSWALD,
  DOCTOR_STRANGE,
  DONATELLO,
  ELLIE,
  FIRST_DOCTOR,
  HYPOTHETICAL_DOCTOR_WIZARD,
  JAHEIRA,
  JOEL,
  K9_MARK_I,
  KRATOS,
  LEONARDO,
  MASTER_FORMED_ANEW,
  PIR,
  RAISED_BY_GIANTS,
  RORY_WILLIAMS,
  ROSE_TYLER,
  ROWAN,
  SEFRIS,
  SHABRAZ,
  SUSAN_FOREMAN,
  TENTH_DOCTOR,
  THRASIOS,
  TOOTHY,
  TYMNA,
  WILL,
  WILSON,
} from "./fixtures/partner-cards";

interface PairCase {
  readonly rule: string;
  readonly a: PairingCard;
  readonly b: PairingCard;
}

interface LegalPairCase extends PairCase {
  readonly pairing: Exclude<CommanderPairingType, "none">;
}

const LEGAL_PAIRS: readonly LegalPairCase[] = [
  {
    rule: "702.124h, both have partner",
    a: TYMNA,
    b: THRASIOS,
    pairing: "partner",
  },
  {
    rule: "702.124j, each names the other",
    a: PIR,
    b: TOOTHY,
    pairing: "partner_with",
  },
  {
    rule: "702.124j, planeswalkers that can be your commander",
    a: ROWAN,
    b: WILL,
    pairing: "partner_with",
  },
  {
    rule: "702.124j, a reciprocal line without reminder text",
    a: BRALLIN,
    b: SHABRAZ,
    pairing: "partner_with",
  },
  {
    rule: "702.124g, Amy Pond uses partner with",
    a: AMY_POND,
    b: RORY_WILLIAMS,
    pairing: "partner_with",
  },
  {
    rule: "702.124g, Amy Pond uses Doctor's companion",
    a: AMY_POND,
    b: TENTH_DOCTOR,
    pairing: "doctor",
  },
  {
    rule: "702.124m, a companion and a Time Lord Doctor",
    a: CLARA_OSWALD,
    b: TENTH_DOCTOR,
    pairing: "doctor",
  },
  {
    rule: "702.124m, an artifact creature companion",
    a: K9_MARK_I,
    b: FIRST_DOCTOR,
    pairing: "doctor",
  },
  {
    rule: "702.124m, a Time Lord companion",
    a: SUSAN_FOREMAN,
    b: FIRST_DOCTOR,
    pairing: "doctor",
  },
  {
    rule: "702.124k, choose a Background",
    a: WILSON,
    b: RAISED_BY_GIANTS,
    pairing: "background",
  },
  {
    rule: "702.124k, another Background",
    a: JAHEIRA,
    b: CLAN_CRAFTER,
    pairing: "background",
  },
  {
    rule: "702.124i, partner—Friends forever",
    a: BJORNA,
    b: CECILY,
    pairing: "friends_forever",
  },
  {
    rule: "702.124i, the wording saved before the rename",
    a: BJORNA,
    b: CECILY_SAVED_BEFORE_RENAME,
    pairing: "friends_forever",
  },
  {
    rule: "702.124i, partner—Survivors",
    a: ELLIE,
    b: JOEL,
    pairing: "survivors",
  },
  {
    rule: "702.124i, partner—Father & son",
    a: KRATOS,
    b: ATREUS,
    pairing: "father_son",
  },
  {
    rule: "702.124i, partner—Character select",
    a: LEONARDO,
    b: DONATELLO,
    pairing: "character_select",
  },
];

const ILLEGAL_PAIRS: readonly PairCase[] = [
  { rule: "903.5b, one card twice", a: TYMNA, b: TYMNA },
  { rule: "702.124f, partner and partner with", a: TYMNA, b: PIR },
  { rule: "702.124j, partner with names another card", a: PIR, b: SHABRAZ },
  { rule: "702.124j, partner with names another card", a: PIR, b: BRALLIN },
  { rule: "702.124j, Amy Pond names Rory Williams", a: AMY_POND, b: TOOTHY },
  { rule: "702.124j, a commander without partner with", a: PIR, b: SEFRIS },
  { rule: "702.124f, partner—Survivors and partner", a: ELLIE, b: TYMNA },
  {
    rule: "702.124i, partner—Survivors and partner—Friends forever",
    a: ELLIE,
    b: CECILY,
  },
  {
    rule: "702.124i, partner—Father & son and partner—Survivors",
    a: KRATOS,
    b: JOEL,
  },
  {
    rule: "702.124i, partner—Character select and partner—Father & son",
    a: LEONARDO,
    b: ATREUS,
  },
  {
    rule: "702.124f, partner—Friends forever and partner",
    a: BJORNA,
    b: TYMNA,
  },
  {
    rule: "702.124k, a commander that is not a Background",
    a: WILSON,
    b: TYMNA,
  },
  {
    rule: "702.124k, a commander without a partner ability",
    a: WILSON,
    b: SEFRIS,
  },
  {
    rule: "702.124k, two Backgrounds",
    a: RAISED_BY_GIANTS,
    b: CANDLEKEEP_SAGE,
  },
  {
    rule: "702.124k, a Background beside a Partner commander",
    a: TYMNA,
    b: CANDLEKEEP_SAGE,
  },
  { rule: "702.124k, choose a Background twice", a: WILSON, b: JAHEIRA },
  {
    rule: "702.124m, a Doctor who is not a Time Lord",
    a: CLARA_OSWALD,
    b: DOCTOR_STRANGE,
  },
  {
    rule: "702.124m, a Time Lord who is not a Doctor",
    a: CLARA_OSWALD,
    b: MASTER_FORMED_ANEW,
  },
  {
    rule: "702.124m, a Doctor with another creature type",
    a: CLARA_OSWALD,
    b: HYPOTHETICAL_DOCTOR_WIZARD,
  },
  { rule: "702.124m, any other commander", a: CLARA_OSWALD, b: SEFRIS },
  { rule: "702.124m, two companions", a: CLARA_OSWALD, b: ROSE_TYLER },
  {
    rule: "702.124m, a companion and a Partner commander",
    a: CLARA_OSWALD,
    b: TYMNA,
  },
  { rule: "702.124m, two Doctors", a: TENTH_DOCTOR, b: FIRST_DOCTOR },
  {
    rule: "702.124m, a Doctor and a commander without the ability",
    a: TENTH_DOCTOR,
    b: ATRAXA,
  },
  {
    rule: "702.124g, Amy Pond and another companion",
    a: AMY_POND,
    b: CLARA_OSWALD,
  },
  { rule: "702.124a, no partner ability on either", a: SEFRIS, b: ATRAXA },
];

describe("canPairCommanders — pairs CR 702.124 allows", () => {
  it.each(LEGAL_PAIRS)("$a.name and $b.name ($rule)", ({ a, b, pairing }) => {
    expect(canPairCommanders(a, b)).toBe(true);
    expect(canPairCommanders(b, a)).toBe(true);
    expect(pairCommanders(a, b)).toBe(pairing);
    expect(pairCommanders(b, a)).toBe(pairing);
  });
});

describe("canPairCommanders — pairs CR 702.124 forbids", () => {
  it.each(ILLEGAL_PAIRS)("$a.name and $b.name ($rule)", ({ a, b }) => {
    expect(canPairCommanders(a, b)).toBe(false);
    expect(canPairCommanders(b, a)).toBe(false);
    expect(pairCommanders(a, b)).toBeNull();
  });
});

describe("detectPairingType — the second slot a lone commander opens", () => {
  it.each([
    { card: TYMNA, expected: "partner" },
    { card: PIR, expected: "partner_with" },
    { card: AMY_POND, expected: "partner_with" },
    { card: CLARA_OSWALD, expected: "doctor" },
    { card: TENTH_DOCTOR, expected: "doctor" },
    { card: WILSON, expected: "background" },
    { card: RAISED_BY_GIANTS, expected: "background" },
    { card: BJORNA, expected: "friends_forever" },
    { card: CECILY_SAVED_BEFORE_RENAME, expected: "friends_forever" },
    { card: ELLIE, expected: "survivors" },
    { card: KRATOS, expected: "father_son" },
    { card: LEONARDO, expected: "character_select" },
    { card: SEFRIS, expected: "none" },
    { card: DOCTOR_STRANGE, expected: "none" },
    { card: MASTER_FORMED_ANEW, expected: "none" },
  ] as const)("$card.name opens $expected", ({ card, expected }) => {
    expect(detectPairingType(card)).toBe(expected);
  });
});

describe("partnerSlotLabel", () => {
  it.each([
    ["partner", "Partner"],
    ["partner_with", "Partner With"],
    ["friends_forever", "Friends Forever"],
    ["background", "Background"],
    ["doctor", "Doctor's Companion"],
    ["character_select", "Character Select Partner"],
    ["father_son", "Father & Son Partner"],
    ["survivors", "Survivors Partner"],
    ["none", "Partner"],
  ] as const)("labels %s as %s", (pairing, label) => {
    expect(partnerSlotLabel(pairing)).toBe(label);
  });
});

describe("supportsPartner", () => {
  it("is false only for a commander without a pairing", () => {
    expect(supportsPartner("none")).toBe(false);
    expect(supportsPartner("partner")).toBe(true);
    expect(supportsPartner("survivors")).toBe(true);
    expect(supportsPartner("doctor")).toBe(true);
  });
});
