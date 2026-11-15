/**
 * The coloured sources each colour of a deck needs, read from its spells:
 * Karsten's 99-card target for the colour's most demanding spell, its driver
 * (I-58 requirements 3.1 and 3.2).
 *
 * Deck analysis, I-58 slice 4. The wizard's size repair reads these targets to
 * split the basic lands it adds; the mana base check (slice 3) will show them.
 * Not responsible for: the column itself (`mana-base-tables.ts`), counting the
 * sources a deck already has, or excluding a card from driving (3.3).
 *
 * @module deck/source-targets
 */
import type { PipColor } from "@/lib/deck/mana-alignment";
import { PIP_COLORS } from "@/lib/deck/mana-alignment";
import { sourceTarget } from "@/lib/deck/mana-base-tables";
import { parseManaCost, type ManaToken } from "@/lib/mana/parse";

/** One castable cost of a card: the face a player casts, in Scryfall's notation. */
export interface SpellCost {
  readonly name: string;
  /** Such as "{2}{G}{G}"; empty for a land or a face with no cost */
  readonly manaCost: string;
}

/** A colour's source target and the spell that sets it. */
export interface ColourSourceTarget {
  /** Sources needed, the gold spell's extra one included */
  readonly sources: number;
  /** Karsten's column entry used, such as "1CC" */
  readonly entry: string;
  /** The spell that sets the target: the first listed among the most demanding */
  readonly driver: string;
  /** True when the driver needs pips of another colour too, which adds one source [3.2] */
  readonly gold: boolean;
}

/** One cost read as Karsten's table reads it. */
interface CostDemand {
  readonly manaValue: number;
  /** Pips each colour alone can pay: hybrid and Phyrexian pips are left out */
  readonly pips: ReadonlyMap<PipColor, number>;
}

const PIP_COLOR_SET: ReadonlySet<string> = new Set(PIP_COLORS);

/** Narrows a mana symbol to one of the five colours. */
function isPipColor(symbol: string): symbol is PipColor {
  return PIP_COLOR_SET.has(symbol);
}

/**
 * One symbol's share of the mana value (CR 202.3): X counts 0 off the stack
 * (CR 202.3e), and a hybrid symbol its largest component (CR 202.3f), so
 * {2/W} counts 2 and {W/U} or {W/P} counts 1.
 */
function manaValueOf(token: ManaToken): number {
  switch (token.kind) {
    case "generic":
      return /^\d+$/.test(token.value) ? Number(token.value) : 0;
    case "color":
      return 1;
    case "hybrid":
      return /^\d+$/.test(token.left) ? Number(token.left) : 1;
    case "unknown":
      return 0;
  }
  const exhaustive: never = token;
  return exhaustive;
}

/**
 * Reads a cost's mana value and coloured pips. A hybrid or Phyrexian pip sets
 * no colour's target: another kind of mana or life can pay it.
 */
function demandOf(manaCost: string): CostDemand {
  const pips = new Map<PipColor, number>();
  let manaValue = 0;
  for (const token of parseManaCost(manaCost)) {
    manaValue += manaValueOf(token);
    if (token.kind === "color" && isPipColor(token.color)) {
      pips.set(token.color, (pips.get(token.color) ?? 0) + 1);
    }
  }
  return { manaValue, pips };
}

/** The target one spell sets for one of its colours, or null outside the column. */
function targetFor(
  spell: SpellCost,
  demand: CostDemand,
  pips: number
): ColourSourceTarget | null {
  const target = sourceTarget({ manaValue: demand.manaValue, pips });
  if (target.kind === "outside-table") return null;
  const gold = demand.pips.size > 1;
  return {
    sources: target.sources + (gold ? 1 : 0),
    entry: target.entry,
    driver: spell.name,
    gold,
  };
}

/**
 * Karsten's source target for each colour the spells ask for [3]: the 99-card
 * entry of the colour's most demanding spell, plus one when that spell is gold.
 *
 * A cost past the column uses the nearest lower entry with the same pips; a
 * cost with five or more pips of a colour sets no number for it, and the next
 * spell drives instead. List the commander first: it is always a candidate
 * driver (3.3), and a tie keeps the first listed spell.
 *
 * @example
 * sourceTargetsByColour([{ name: "Wrath of God", manaCost: "{2}{W}{W}" }]);
 * // → Map { "W" => { sources: 26, entry: "2CC", driver: "Wrath of God", gold: false } }
 *
 * @param spells - the castable costs of the command zone and the deck
 * @returns one target per colour that some spell's pips ask for
 */
export function sourceTargetsByColour(
  spells: readonly SpellCost[]
): ReadonlyMap<PipColor, ColourSourceTarget> {
  const targets = new Map<PipColor, ColourSourceTarget>();
  for (const spell of spells) {
    const demand = demandOf(spell.manaCost);
    for (const [colour, pips] of demand.pips) {
      const candidate = targetFor(spell, demand, pips);
      const current = targets.get(colour);
      if (candidate && (!current || candidate.sources > current.sources)) {
        targets.set(colour, candidate);
      }
    }
  }
  return targets;
}
