/**
 * Pods for a casual Commander night (I-41 slice 1): allowed sizes, bracket
 * spread, dedicated brackets, play-together groups and a stable tie-break.
 */
import { describe, expect, it, vi } from "vitest";
import {
  formPods,
  type Bracket,
  type FormedPod,
  type PodEntry,
  type PodPolicy,
  type PriorPod,
} from "./form-pods";

function policy(overrides: Partial<PodPolicy> = {}): PodPolicy {
  return {
    allowedSizes: [3, 4, 5],
    unevenSize: 3,
    maxBracketSpread: 1,
    dedicatedBrackets: [],
    pairingBasis: "declared",
    nightId: "friday",
    round: 1,
    ...overrides,
  };
}

function sameBracket(count: number, bracket: Bracket): readonly Bracket[] {
  const brackets: Bracket[] = [];
  for (let index = 0; index < count; index += 1) brackets.push(bracket);
  return brackets;
}

function players(brackets: readonly Bracket[]): readonly PodEntry[] {
  return brackets.map((bracket, index) => ({
    id: `p${index + 1}`,
    bracket,
  }));
}

function sizes(pods: readonly FormedPod[]): readonly number[] {
  return pods
    .map((pod) => pod.entryIds.length)
    .sort((left, right) => left - right);
}

describe("formPods", () => {
  it("seats four players of one bracket at one table", () => {
    const formed = formPods(players([3, 3, 3, 3]), policy(), []);
    expect(formed.waiting).toEqual([]);
    expect(sizes(formed.pods)).toEqual([4]);
    expect(formed.pods[0]?.spread).toBe(0);
  });

  it("uses the same pods for the same input and never draws from Math.random", () => {
    const entries = players([2, 2, 3, 3, 3, 4, 4]);
    const random = vi.spyOn(Math, "random").mockReturnValue(0);
    try {
      const first = formPods(entries, policy(), []);
      const second = formPods(entries, policy(), []);
      expect(second).toEqual(first);
      expect(random).not.toHaveBeenCalled();
    } finally {
      random.mockRestore();
    }
  });

  it("seats counts from zero to seven as the size policy says", () => {
    expect(formPods([], policy(), [])).toEqual({ pods: [], waiting: [] });
    expect(formPods(players([3]), policy(), []).waiting).toEqual([
      { entryId: "p1", reason: "below-smallest-pod" },
    ]);
    expect(
      formPods(players([3, 3]), policy(), []).waiting.map((row) => row.reason)
    ).toEqual(["below-smallest-pod", "below-smallest-pod"]);
    expect(sizes(formPods(players([3, 3, 3]), policy(), []).pods)).toEqual([3]);
    expect(sizes(formPods(players([3, 3, 3, 3]), policy(), []).pods)).toEqual([
      4,
    ]);
    expect(
      sizes(formPods(players([3, 3, 3, 3, 3]), policy(), []).pods)
    ).toEqual([5]);
    expect(
      sizes(formPods(players([3, 3, 3, 3, 3, 3]), policy(), []).pods)
    ).toEqual([3, 3]);
    expect(
      sizes(formPods(players([3, 3, 3, 3, 3, 3, 3]), policy(), []).pods)
    ).toEqual([3, 4]);
  });

  it("prefers the most tables of four, then seats everyone it can", () => {
    expect(
      sizes(formPods(players(sameBracket(9, 3)), policy(), []).pods)
    ).toEqual([4, 5]);
    expect(
      sizes(formPods(players(sameBracket(10, 3)), policy(), []).pods)
    ).toEqual([3, 3, 4]);
  });

  it("keeps a player whose bracket does not fit a table on the waiting list", () => {
    const formed = formPods(players([1, 1, 1, 1, 5]), policy(), []);
    expect(sizes(formed.pods)).toEqual([4]);
    expect(formed.waiting).toEqual([
      { entryId: "p5", reason: "bracket-spread" },
    ]);
    expect(formed.pods[0]?.spread).toBe(0);
  });

  it("never mixes a dedicated bracket with another bracket", () => {
    const formed = formPods(
      players([2, 2, 2, 3, 3, 3]),
      policy({ dedicatedBrackets: [2] }),
      []
    );
    expect(sizes(formed.pods)).toEqual([3, 3]);
    const brackets = new Map(
      players([2, 2, 2, 3, 3, 3]).map((entry) => [entry.id, entry.bracket])
    );
    for (const pod of formed.pods) {
      const present = new Set(pod.entryIds.map((id) => brackets.get(id)));
      expect(present.size).toBe(1);
    }
  });

  it("keeps a play-together group at one table", () => {
    const entries: readonly PodEntry[] = [
      { id: "g1", bracket: 3, playTogetherGroup: "ride" },
      { id: "g2", bracket: 3, playTogetherGroup: "ride" },
      { id: "g3", bracket: 3, playTogetherGroup: "ride" },
      { id: "g4", bracket: 3, playTogetherGroup: "ride" },
      ...players([3, 3, 3, 3]),
    ];
    const formed = formPods(entries, policy(), []);
    const together = formed.pods.find((pod) => pod.entryIds.includes("g1"));
    expect(together?.entryIds.slice().sort()).toEqual(["g1", "g2", "g3", "g4"]);
    expect(formed.waiting).toEqual([]);
  });

  it("waits a play-together group that cannot fit an allowed table", () => {
    const entries: readonly PodEntry[] = [
      { id: "g1", bracket: 3, playTogetherGroup: "six" },
      { id: "g2", bracket: 3, playTogetherGroup: "six" },
      { id: "g3", bracket: 3, playTogetherGroup: "six" },
      { id: "g4", bracket: 3, playTogetherGroup: "six" },
      { id: "g5", bracket: 3, playTogetherGroup: "six" },
      { id: "g6", bracket: 3, playTogetherGroup: "six" },
    ];
    const formed = formPods(entries, policy(), []);
    expect(formed.pods).toEqual([]);
    expect(formed.waiting.map((row) => row.reason)).toEqual([
      "play-together-group",
      "play-together-group",
      "play-together-group",
      "play-together-group",
      "play-together-group",
      "play-together-group",
    ]);
  });

  it("seats two players when the policy allows a pod of two", () => {
    const formed = formPods(
      players([3, 4]),
      policy({ allowedSizes: [2, 3, 4, 5] }),
      []
    );
    expect(formed.waiting).toEqual([]);
    expect(sizes(formed.pods)).toEqual([2]);
    expect(formed.pods[0]?.spread).toBe(1);
  });

  it("minimises pairs who already shared a table", () => {
    const entries = players([3, 3, 3, 3, 3, 3, 3, 3]);
    const prior: readonly PriorPod[] = [
      { entryIds: ["p1", "p2", "p3", "p4"] },
      { entryIds: ["p5", "p6", "p7", "p8"] },
    ];
    const formed = formPods(entries, policy({ round: 2 }), prior);
    expect(sizes(formed.pods)).toEqual([4, 4]);
    expect(repeatedPairs(formed.pods, prior)).toBe(4);
  });

  it("does not change the pods when only the pairing basis changes", () => {
    const entries = players([2, 3, 3, 4]);
    const declared = formPods(
      entries,
      policy({ pairingBasis: "declared" }),
      []
    );
    const higher = formPods(
      entries,
      policy({ pairingBasis: "higherOfBoth" }),
      []
    );
    expect(higher).toEqual(declared);
  });
});

function repeatedPairs(
  pods: readonly FormedPod[],
  prior: readonly PriorPod[]
): number {
  const together = new Set<string>();
  for (const pod of prior) addPairs(together, pod.entryIds);
  let count = 0;
  for (const pod of pods) {
    const ids = [...pod.entryIds].sort((left, right) =>
      left.localeCompare(right, "en")
    );
    for (let left = 0; left < ids.length; left += 1) {
      for (let right = left + 1; right < ids.length; right += 1) {
        const key = pairKey(ids[left], ids[right]);
        if (key !== null && together.has(key)) count += 1;
      }
    }
  }
  return count;
}

function addPairs(together: Set<string>, entryIds: readonly string[]): void {
  const ids = [...entryIds].sort((left, right) =>
    left.localeCompare(right, "en")
  );
  for (let left = 0; left < ids.length; left += 1) {
    for (let right = left + 1; right < ids.length; right += 1) {
      const key = pairKey(ids[left], ids[right]);
      if (key !== null) together.add(key);
    }
  }
}

function pairKey(
  left: string | undefined,
  right: string | undefined
): string | null {
  if (left === undefined || right === undefined) return null;
  return `${left}\u0000${right}`;
}
