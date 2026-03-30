import { describe, it, expect } from "vitest";
import {
  validateChallengeSubmission,
  calculateScore,
  rankSubmissions,
  getChallengeStatus,
  isEligibleForReward,
  type Challenge,
  type ChallengeSubmission,
  type Deck,
} from "./challenges";

// ─── Factories ─────────────────────────────────────────────────────────────

function makeChallenge(overrides: Partial<Challenge> = {}): Challenge {
  return {
    id: "ch-1",
    name: "Summer Deckbuilding Challenge",
    type: "deckbuilding",
    rules: {},
    startDate: new Date("2025-06-01T00:00:00Z"),
    endDate: new Date("2025-06-30T23:59:59Z"),
    rewardBadge: "summer-builder",
    rewardCosmetic: "golden-frame",
    ...overrides,
  };
}

function makeDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: "deck-1",
    format: "commander",
    colors: ["W", "U"],
    cardCount: 100,
    removalCount: 10,
    bracketScore: 3,
    ...overrides,
  };
}

function makeSubmission(
  overrides: Partial<ChallengeSubmission> = {}
): ChallengeSubmission {
  return {
    id: "sub-1",
    userId: "user-1",
    challengeId: "ch-1",
    deckId: "deck-1",
    score: 50,
    submittedAt: new Date("2025-06-15T12:00:00Z"),
    ...overrides,
  };
}

// ─── validateChallengeSubmission ────────────────────────────────────────────

describe("validateChallengeSubmission", () => {
  it("returns valid when deck meets no specific rules", () => {
    const result = validateChallengeSubmission(makeDeck(), makeChallenge());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns valid when deck matches required format", () => {
    const challenge = makeChallenge({ rules: { format: "commander" } });
    const deck = makeDeck({ format: "commander" });
    expect(validateChallengeSubmission(deck, challenge).valid).toBe(true);
  });

  it("returns error when deck format does not match", () => {
    const challenge = makeChallenge({ rules: { format: "standard" } });
    const deck = makeDeck({ format: "commander" });
    const result = validateChallengeSubmission(deck, challenge);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Deck format must be standard");
  });

  it("returns valid when deck is monoColor and matches rule", () => {
    const challenge = makeChallenge({ rules: { monoColor: "R" } });
    const deck = makeDeck({ colors: ["R"] });
    expect(validateChallengeSubmission(deck, challenge).valid).toBe(true);
  });

  it("returns error when monoColor rule requires single color but deck has multiple", () => {
    const challenge = makeChallenge({ rules: { monoColor: "R" } });
    const deck = makeDeck({ colors: ["R", "W"] });
    const result = validateChallengeSubmission(deck, challenge);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Deck must be mono-R");
  });

  it("returns error when deck has insufficient removal for minRemoval rule", () => {
    const challenge = makeChallenge({ rules: { minRemoval: 15 } });
    const deck = makeDeck({ removalCount: 10 });
    const result = validateChallengeSubmission(deck, challenge);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Deck must have at least 15 removal spells");
  });

  it("returns valid when deck meets minRemoval exactly", () => {
    const challenge = makeChallenge({ rules: { minRemoval: 10 } });
    const deck = makeDeck({ removalCount: 10 });
    expect(validateChallengeSubmission(deck, challenge).valid).toBe(true);
  });

  it("returns error when deck exceeds maxBracket", () => {
    const challenge = makeChallenge({ rules: { maxBracket: 3 } });
    const deck = makeDeck({ bracketScore: 4 });
    const result = validateChallengeSubmission(deck, challenge);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Deck bracket score must not exceed 3");
  });

  it("returns valid when deck bracketScore equals maxBracket", () => {
    const challenge = makeChallenge({ rules: { maxBracket: 3 } });
    const deck = makeDeck({ bracketScore: 3 });
    expect(validateChallengeSubmission(deck, challenge).valid).toBe(true);
  });

  it("accumulates multiple errors when multiple rules fail", () => {
    const challenge = makeChallenge({
      rules: { format: "standard", minRemoval: 20 },
    });
    const deck = makeDeck({ format: "commander", removalCount: 5 });
    const result = validateChallengeSubmission(deck, challenge);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});

// ─── calculateScore ─────────────────────────────────────────────────────────

describe("calculateScore", () => {
  it("returns the submission score for deckbuilding challenge", () => {
    const submission = makeSubmission({ score: 75 });
    const challenge = makeChallenge({ type: "deckbuilding" });
    expect(calculateScore(submission, challenge)).toBe(75);
  });

  it("applies 1.2x multiplier for performance challenge", () => {
    const submission = makeSubmission({ score: 100 });
    const challenge = makeChallenge({ type: "performance" });
    expect(calculateScore(submission, challenge)).toBeCloseTo(120);
  });

  it("applies 1.5x multiplier for creativity challenge", () => {
    const submission = makeSubmission({ score: 80 });
    const challenge = makeChallenge({ type: "creativity" });
    expect(calculateScore(submission, challenge)).toBeCloseTo(120);
  });

  it("applies 0.8x multiplier for speed challenge", () => {
    const submission = makeSubmission({ score: 100 });
    const challenge = makeChallenge({ type: "speed" });
    expect(calculateScore(submission, challenge)).toBeCloseTo(80);
  });

  it("returns 0 for a submission with score 0", () => {
    const submission = makeSubmission({ score: 0 });
    const challenge = makeChallenge({ type: "creativity" });
    expect(calculateScore(submission, challenge)).toBe(0);
  });
});

// ─── rankSubmissions ────────────────────────────────────────────────────────

describe("rankSubmissions", () => {
  it("returns submissions sorted by score descending", () => {
    const submissions = [
      makeSubmission({ id: "s1", score: 40 }),
      makeSubmission({ id: "s2", score: 90 }),
      makeSubmission({ id: "s3", score: 60 }),
    ];
    const ranked = rankSubmissions(submissions);
    expect(ranked[0].id).toBe("s2");
    expect(ranked[1].id).toBe("s3");
    expect(ranked[2].id).toBe("s1");
  });

  it("returns empty array for empty input", () => {
    expect(rankSubmissions([])).toHaveLength(0);
  });

  it("does not mutate the original array", () => {
    const submissions = [
      makeSubmission({ id: "s1", score: 10 }),
      makeSubmission({ id: "s2", score: 50 }),
    ];
    const original = [...submissions];
    rankSubmissions(submissions);
    expect(submissions[0].id).toBe(original[0].id);
    expect(submissions[1].id).toBe(original[1].id);
  });

  it("handles single submission", () => {
    const submissions = [makeSubmission({ id: "s1", score: 42 })];
    const ranked = rankSubmissions(submissions);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].id).toBe("s1");
  });

  it("preserves all submissions when scores are tied", () => {
    const submissions = [
      makeSubmission({ id: "s1", score: 50 }),
      makeSubmission({ id: "s2", score: 50 }),
    ];
    expect(rankSubmissions(submissions)).toHaveLength(2);
  });
});

// ─── getChallengeStatus ─────────────────────────────────────────────────────

describe("getChallengeStatus", () => {
  it("returns 'upcoming' when now is before startDate", () => {
    const challenge = makeChallenge({
      startDate: new Date("2025-06-10T00:00:00Z"),
      endDate: new Date("2025-06-30T23:59:59Z"),
    });
    const now = new Date("2025-06-05T12:00:00Z");
    expect(getChallengeStatus(challenge, now)).toBe("upcoming");
  });

  it("returns 'active' when now is between startDate and endDate", () => {
    const challenge = makeChallenge({
      startDate: new Date("2025-06-01T00:00:00Z"),
      endDate: new Date("2025-06-30T23:59:59Z"),
    });
    const now = new Date("2025-06-15T12:00:00Z");
    expect(getChallengeStatus(challenge, now)).toBe("active");
  });

  it("returns 'active' when now equals startDate", () => {
    const startDate = new Date("2025-06-01T00:00:00Z");
    const challenge = makeChallenge({
      startDate,
      endDate: new Date("2025-06-30T23:59:59Z"),
    });
    expect(getChallengeStatus(challenge, startDate)).toBe("active");
  });

  it("returns 'active' when now equals endDate", () => {
    const endDate = new Date("2025-06-30T23:59:59Z");
    const challenge = makeChallenge({
      startDate: new Date("2025-06-01T00:00:00Z"),
      endDate,
    });
    expect(getChallengeStatus(challenge, endDate)).toBe("active");
  });

  it("returns 'ended' when now is after endDate", () => {
    const challenge = makeChallenge({
      startDate: new Date("2025-06-01T00:00:00Z"),
      endDate: new Date("2025-06-30T23:59:59Z"),
    });
    const now = new Date("2025-07-01T00:00:00Z");
    expect(getChallengeStatus(challenge, now)).toBe("ended");
  });
});

// ─── isEligibleForReward ────────────────────────────────────────────────────

describe("isEligibleForReward", () => {
  it("returns badge and cosmetic for rank 1", () => {
    const result = isEligibleForReward(1, 100);
    expect(result.badge).toBe(true);
    expect(result.cosmetic).toBe(true);
  });

  it("returns badge and cosmetic for top 10% of participants", () => {
    // top 10% of 100 = rank <= 10
    const result = isEligibleForReward(10, 100);
    expect(result.badge).toBe(true);
    expect(result.cosmetic).toBe(true);
  });

  it("returns badge only for top 25% (outside top 10%)", () => {
    // rank 15 in 100 participants: > 10%, <= 25%
    const result = isEligibleForReward(15, 100);
    expect(result.badge).toBe(true);
    expect(result.cosmetic).toBe(false);
  });

  it("returns no reward outside top 25%", () => {
    // rank 30 in 100 participants: > 25%
    const result = isEligibleForReward(30, 100);
    expect(result.badge).toBe(false);
    expect(result.cosmetic).toBe(false);
  });

  it("returns badge and cosmetic for rank 1 with few participants", () => {
    const result = isEligibleForReward(1, 5);
    expect(result.badge).toBe(true);
    expect(result.cosmetic).toBe(true);
  });

  it("handles exactly top 25% boundary", () => {
    // rank 25 in 100: exactly 25%
    const result = isEligibleForReward(25, 100);
    expect(result.badge).toBe(true);
    expect(result.cosmetic).toBe(false);
  });

  it("returns no reward when rank is 0 or negative (invalid)", () => {
    const result = isEligibleForReward(0, 100);
    expect(result.badge).toBe(false);
    expect(result.cosmetic).toBe(false);
  });
});
