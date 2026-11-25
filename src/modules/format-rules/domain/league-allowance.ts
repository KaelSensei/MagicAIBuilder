/**
 * A league round's change allowance: how far a registered list may move from
 * the member's previous one (I-104 slice 1).
 *
 * Format-rules context, domain layer. A pure report the server will store at
 * registration (ADR 0009); this module decides nothing about membership, dates
 * or standings. The swap cap follows the precon-league rule Commander's Herald
 * described on 2024-01-15: a counted swap is one card out and one card in, and
 * a basic land replaced by a basic land is exempt when the host says so
 * (https://commandersherald.com/why-you-should-consider-starting-a-precon-league/,
 * read 2026-11-19).
 * Not responsible for: the money sum (`league-allowance-money.ts`), static deck
 * rules (`checkDeckAgainstRules`, I-53), fetching a price (I-32), or freezing
 * the list (I-104 slice 3).
 *
 * @module format-rules/league-allowance
 */

import { checkMoney } from "./league-allowance-money";
import { changedCopies, type CopyLine } from "./league-list-diff";
import type {
  AllowancePart,
  AllowancePartReport,
  AllowanceReport,
  DatedCardPrice,
  LeagueListPair,
  SwapPair,
} from "./league-allowance-types";

export type {
  AllowancePart,
  AllowancePartReport,
  AllowanceReport,
  AllowanceVerdict,
  DatedCardPrice,
  LeagueListCard,
  LeagueListPair,
  PriceMarket,
  SwapPair,
} from "./league-allowance-types";

/**
 * Compares the next list with the previous one under each allowance part.
 *
 * Swaps are pairs of cards out and in; the count is the larger side once
 * exempt pairs are removed. Money prices only cards added. The pool part
 * fails when an added card is outside the names the member declared.
 * The spec's four inputs are these three arguments: the two lists travel
 * together because a function here takes at most three parameters.
 *
 * @param lists - the previous registered list and the list being checked
 * @param allowance - the round's parts, in the order the report repeats them
 * @param prices - prices for the registration day; a missing card is unpriced
 * @returns a report that never throws for an empty list or an empty allowance
 */
export function checkRoundAllowance(
  lists: LeagueListPair,
  allowance: readonly AllowancePart[],
  prices: readonly DatedCardPrice[]
): AllowanceReport {
  const parts = allowance.map((part) => checkPart(part, lists, prices));
  return {
    parts,
    passed: parts.every((part) => part.verdict === "pass"),
  };
}

function checkPart(
  part: AllowancePart,
  lists: LeagueListPair,
  prices: readonly DatedCardPrice[]
): AllowancePartReport {
  switch (part.kind) {
    case "swaps":
      return checkSwaps(part, lists);
    case "money":
      return checkMoney(part, lists, prices);
    case "pool":
      return checkPool(part, lists);
    default: {
      const unreachable: never = part;
      return unreachable;
    }
  }
}

function checkSwaps(
  part: Extract<AllowancePart, { kind: "swaps" }>,
  lists: LeagueListPair
): AllowancePartReport {
  const changed = changedCopies(lists.previous, lists.next);
  const swapped = part.commanderCounts ? changed : withoutCommanders(changed);
  const exempt = part.basicsExempt
    ? pairBasics(swapped.out, swapped.in)
    : { pairs: [], out: swapped.out, in: swapped.in };
  const pairs = [...exempt.pairs, ...zipPairs(exempt.out, exempt.in, false)];
  const counted = pairs.filter((pair) => !pair.exempt).length;
  return {
    part: "swaps",
    verdict: counted <= part.max ? "pass" : "fail",
    detail: `${counted} of ${part.max}`,
    pairs,
  };
}

function checkPool(
  part: Extract<AllowancePart, { kind: "pool" }>,
  lists: LeagueListPair
): AllowancePartReport {
  if (!part.declaredOnly) {
    return {
      part: "pool",
      verdict: "pass",
      detail: "not restricted",
      cards: [],
    };
  }
  const declared = new Set(part.declared);
  const outside = uniqueOutside(lists, declared);
  if (outside.length === 0) {
    return {
      part: "pool",
      verdict: "pass",
      detail: "inside the declared pool",
      cards: [],
    };
  }
  const verb = outside.length === 1 ? "is" : "are";
  return {
    part: "pool",
    verdict: "fail",
    detail: `${outside.join(", ")} ${verb} outside the declared pool`,
    cards: outside,
  };
}

/** The copies that left and arrived, as `changedCopies` sorts them. */
type ChangedCopies = ReturnType<typeof changedCopies>;

/**
 * The changed copies without the commanders, for a host whose swaps part does
 * not count a commander leaving or arriving (`commanderCounts` false).
 */
function withoutCommanders(changed: ChangedCopies): ChangedCopies {
  const isDeckCard = (line: CopyLine) => !line.commander;
  return {
    out: changed.out.filter(isDeckCard),
    in: changed.in.filter(isDeckCard),
  };
}

function uniqueOutside(
  lists: LeagueListPair,
  declared: ReadonlySet<string>
): readonly string[] {
  const names = changedCopies(lists.previous, lists.next)
    .in.filter((line) => !declared.has(line.name))
    .map((line) => line.name);
  return [...new Set(names)].sort((left, right) =>
    left.localeCompare(right, "en")
  );
}

function pairBasics(
  outgoing: readonly CopyLine[],
  incoming: readonly CopyLine[]
): {
  readonly pairs: readonly SwapPair[];
  readonly out: readonly CopyLine[];
  readonly in: readonly CopyLine[];
} {
  const outBasics = outgoing.filter((line) => line.basic);
  const inBasics = incoming.filter((line) => line.basic);
  const shared = Math.min(outBasics.length, inBasics.length);
  return {
    pairs: zipPairs(
      outBasics.slice(0, shared),
      inBasics.slice(0, shared),
      true
    ),
    out: [
      ...outgoing.filter((line) => !line.basic),
      ...outBasics.slice(shared),
    ],
    in: [...incoming.filter((line) => !line.basic), ...inBasics.slice(shared)],
  };
}

function zipPairs(
  outgoing: readonly CopyLine[],
  incoming: readonly CopyLine[],
  exempt: boolean
): readonly SwapPair[] {
  const pairs: SwapPair[] = [];
  const shared = Math.min(outgoing.length, incoming.length);
  for (let index = 0; index < outgoing.length; index += 1) {
    const out = outgoing[index];
    const inn = index < shared ? incoming[index] : undefined;
    if (out === undefined) continue;
    pairs.push({
      out: out.name,
      in: inn === undefined ? null : inn.name,
      exempt,
    });
  }
  for (let index = shared; index < incoming.length; index += 1) {
    const inn = incoming[index];
    if (inn === undefined) continue;
    pairs.push({ out: null, in: inn.name, exempt });
  }
  return pairs;
}
