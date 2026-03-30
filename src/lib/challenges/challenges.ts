/**
 * Seasonal Challenges — Pure logic functions
 * Zero framework dependencies.
 */

// ─── Types ────────────────────────────────────────────────────────────────

export interface Challenge {
  readonly id: string;
  readonly name: string;
  readonly type: "deckbuilding" | "performance" | "creativity" | "speed";
  readonly rules: {
    readonly format?: string;
    readonly monoColor?: string;
    readonly minRemoval?: number;
    readonly maxBracket?: number;
  };
  readonly startDate: Date;
  readonly endDate: Date;
  readonly rewardBadge: string;
  readonly rewardCosmetic: string;
}

export interface ChallengeSubmission {
  readonly id: string;
  readonly userId: string;
  readonly challengeId: string;
  readonly deckId: string;
  readonly score: number;
  readonly submittedAt: Date;
}

export interface Deck {
  readonly id: string;
  readonly format: string;
  readonly colors: readonly string[];
  readonly cardCount: number;
  readonly removalCount: number;
  readonly bracketScore: number;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export interface RewardEligibility {
  readonly badge: boolean;
  readonly cosmetic: boolean;
}

export type ChallengeStatus = "upcoming" | "active" | "ended";

// ─── Score multipliers ────────────────────────────────────────────────────

const SCORE_MULTIPLIERS: Record<Challenge["type"], number> = {
  deckbuilding: 1,
  performance: 1.2,
  creativity: 1.5,
  speed: 0.8,
};

// ─── validateChallengeSubmission ──────────────────────────────────────────

export function validateChallengeSubmission(
  deck: Deck,
  challenge: Challenge
): ValidationResult {
  const errors: string[] = [];
  const { rules } = challenge;

  if (rules.format !== undefined && deck.format !== rules.format) {
    errors.push(`Deck format must be ${rules.format}`);
  }

  if (rules.monoColor !== undefined) {
    const isMonoRequired =
      deck.colors.length !== 1 || deck.colors[0] !== rules.monoColor;
    if (isMonoRequired) {
      errors.push(`Deck must be mono-${rules.monoColor}`);
    }
  }

  if (
    rules.minRemoval !== undefined &&
    deck.removalCount < rules.minRemoval
  ) {
    errors.push(`Deck must have at least ${rules.minRemoval} removal spells`);
  }

  if (
    rules.maxBracket !== undefined &&
    deck.bracketScore > rules.maxBracket
  ) {
    errors.push(`Deck bracket score must not exceed ${rules.maxBracket}`);
  }

  return { valid: errors.length === 0, errors };
}

// ─── calculateScore ───────────────────────────────────────────────────────

export function calculateScore(
  submission: ChallengeSubmission,
  challenge: Challenge
): number {
  const multiplier = SCORE_MULTIPLIERS[challenge.type];
  return submission.score * multiplier;
}

// ─── rankSubmissions ──────────────────────────────────────────────────────

export function rankSubmissions(
  submissions: readonly ChallengeSubmission[]
): ChallengeSubmission[] {
  return [...submissions].sort((a, b) => b.score - a.score);
}

// ─── getChallengeStatus ───────────────────────────────────────────────────

export function getChallengeStatus(
  challenge: Challenge,
  now: Date
): ChallengeStatus {
  if (now < challenge.startDate) return "upcoming";
  if (now > challenge.endDate) return "ended";
  return "active";
}

// ─── isEligibleForReward ──────────────────────────────────────────────────

export function isEligibleForReward(
  rank: number,
  totalParticipants: number
): RewardEligibility {
  if (rank <= 0) return { badge: false, cosmetic: false };

  const top10Threshold = Math.ceil(totalParticipants * 0.1);
  const top25Threshold = Math.ceil(totalParticipants * 0.25);

  return {
    badge: rank <= top25Threshold,
    cosmetic: rank <= top10Threshold,
  };
}
