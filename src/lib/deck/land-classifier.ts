/**
 * The mana base's land classifier: the colours a land makes, the land types it can fetch, and
 * which of four classes its entry belongs to (I-58 requirements 4.1 and 4.2).
 *
 * Context: deck analysis, mana base (I-58 slice 2). The mana facts are Deck Lab's (I-31 slice 2,
 * `deck-lab/land-rules.ts`): one owner, decided 2026-11-10, so the two never disagree on what a
 * land makes. This module adds the entry class: the dated cycle table (`land-cycles.ts`) decides
 * for a land in a cycle, and its Oracle text for a land outside one, or in a cycle whose lands
 * differ.
 * Not responsible for: knowing a card's cycle (the land catalogue, I-58 slice 5), the Game
 * Changer flag or rarity (slice 5), or counting sources (slice 3).
 *
 * @module deck/land-classifier
 */
import { hasCardType, type FaceText } from "@/lib/deck-lab/card-faces";
import { classifyLandFace } from "@/lib/deck-lab/land-rules";
import { entryRuleOf } from "@/lib/deck-lab/oracle-text";
import type {
  BasicLandType,
  FetchTarget,
  ManaProduced,
} from "@/lib/deck-lab/types";

import {
  LAND_CYCLE_TABLE,
  type LandCycle,
  type LandEntry,
} from "./land-cycles";

/** What the mana base knows about one land face (the `LandFacts` of I-58's data model). */
export interface LandFacts {
  /** Colours it makes; for a fetch land, the colours of the lands it can find. */
  readonly produces: ManaProduced;
  /** The basic land types a fetch land can find, basic or not ("an Island or Swamp card"). */
  readonly fetchTypes: readonly BasicLandType[];
  /** True for a fetch land that finds any basic land ("a basic land card"). */
  readonly fetchesAnyBasic: boolean;
  readonly entry: LandEntry;
  /** The cycle the caller named, when it named one. */
  readonly cycle: LandCycle | undefined;
}

const NO_MANA: ManaProduced = { kind: "colours", colours: [] };

/** The Oracle line that makes a land enter tapped. */
const TAPPED_ENTRY = /enters (the battlefield )?tapped/i;

/** Life the player may pay to keep a land untapped (CR 119.4), as "pay 2 life". */
const LIFE_PAYMENT = /\bpay \w+ life\b/i;

/** What a land needs to enter untapped: "unless you control two or fewer other lands". */
const UNLESS_CLAUSE = /\btapped unless ([^.]+)/i;

/** Whether a fetch target is a land type rather than "any basic land". */
function isLandType(target: FetchTarget): target is BasicLandType {
  return target !== "basic";
}

/**
 * The entry of a land whose text lets it avoid entering tapped: paid when the player pays life,
 * otherwise conditional on its "unless" clause, or on the whole line when it has none (a reveal
 * land's "If you don't, this land enters tapped").
 */
function avoidableEntry(oracleText: string): LandEntry {
  const line =
    oracleText.split("\n").find((text) => TAPPED_ENTRY.test(text)) ??
    oracleText;
  const payment = LIFE_PAYMENT.exec(line);
  if (payment) return { class: "paid", cost: payment[0].toLowerCase() };
  const unless = UNLESS_CLAUSE.exec(line);
  return { class: "conditional", condition: unless?.[1] ?? line.trim() };
}

/** The entry class its Oracle text gives a land (CR 614.1c: entering tapped replaces entering). */
function entryFromText(oracleText: string): LandEntry {
  switch (entryRuleOf(oracleText)) {
    case "untapped":
      return { class: "untapped" };
    case "tapped":
      return { class: "tapped" };
    case "conditionally-tapped":
      return avoidableEntry(oracleText);
  }
}

/**
 * The entry class: the cycle table's when it fixes one, else the text's. A fetch land outside the
 * table takes the entry of the land it finds, since that land is the source: Evolving Wilds,
 * whose land "enters tapped", is a tapped land.
 */
function entryOf(
  face: FaceText,
  foundTapped: boolean | undefined,
  cycle: LandCycle | undefined
): LandEntry {
  const fromTable =
    cycle === undefined ? undefined : LAND_CYCLE_TABLE.cycles[cycle];
  if (fromTable?.kind === "fixed") return fromTable.entry;
  if (foundTapped !== undefined)
    return { class: foundTapped ? "tapped" : "untapped" };
  return entryFromText(face.oracleText);
}

/**
 * Classifies a land face for the mana base.
 *
 * @param face - a face, with its type line and English Oracle text as Scryfall prints them
 * @param cycle - the land's cycle, when a catalogue knows it; the table then sets its entry
 * @returns its land facts, or `undefined` when the face is not a land
 */
export function classifyLand(
  face: FaceText,
  cycle?: LandCycle
): LandFacts | undefined {
  if (!hasCardType(face, "Land")) return undefined;
  const facts = classifyLandFace(face);
  const targets = facts.fetchTypes ?? [];
  const foundTapped = facts.kind === "fetch" ? facts.entersTapped : undefined;
  return {
    produces: facts.produces ?? NO_MANA,
    fetchTypes: targets.filter(isLandType),
    fetchesAnyBasic: targets.includes("basic"),
    entry: entryOf(face, foundTapped, cycle),
    cycle,
  };
}
