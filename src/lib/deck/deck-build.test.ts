import { describe, expect, it } from "vitest";

import {
  buildChangeKind,
  diffBuild,
  resolveBuild,
  type BuildChange,
  type BuildLine,
  type BuildList,
  type CommandZone,
} from "./deck-build";
import type { DeckZone } from "./types";

const NO_COMMANDER: CommandZone = {
  commander: null,
  partner: null,
  companion: null,
};

function line(
  name: string,
  quantity = 1,
  zone: DeckZone = "main",
  printing: string | null = null
): BuildLine {
  return { name, quantity, zone, printing };
}

function list(
  lines: readonly BuildLine[],
  commandZone: Partial<CommandZone> = {}
): BuildList {
  return { commandZone: { ...NO_COMMANDER, ...commandZone }, lines };
}

/** The main build every scenario starts from: a Bracket 3 Atraxa list. */
const MAIN = list(
  [
    line("Sol Ring", 1, "main", "sol-ring-c21"),
    line("Rhystic Study"),
    line("Forest", 10),
    line("Swords to Plowshares", 1, "sideboard"),
  ],
  { commander: "Atraxa, Praetors' Voice" }
);

/** A list as a key → line map, so two lists compare without their order. */
function byLine(build: BuildList): ReadonlyMap<string, BuildLine> {
  return new Map(
    build.lines.map((entry) => [`${entry.zone}|${entry.name}`, entry])
  );
}

describe("diffBuild", () => {
  it("records nothing when the wanted list is the main build", () => {
    expect(diffBuild(MAIN, MAIN)).toEqual([]);
  });

  it("records one change of each kind, command zone first", () => {
    const wanted = list(
      [
        line("Sol Ring", 1, "main", "sol-ring-lea"),
        line("Mystic Remora"),
        line("Forest", 12),
        line("Swords to Plowshares", 1, "sideboard"),
      ],
      { commander: "Tymna the Weaver", partner: "Kraum, Ludevic's Opus" }
    );

    const changes = diffBuild(MAIN, wanted);

    expect(changes.map(buildChangeKind)).toEqual([
      "commandSlot",
      "commandSlot",
      "printing",
      "remove",
      "quantity",
      "add",
    ]);
    expect(changes[0]).toEqual({
      target: "commandSlot",
      slot: "commander",
      expected: "Atraxa, Praetors' Voice",
      value: "Tymna the Weaver",
    });
    expect(changes[3]).toMatchObject({
      target: "line",
      name: "Rhystic Study",
      expected: { quantity: 1, printing: null },
      value: null,
    });
  });

  it("treats the same card in another zone as another line", () => {
    const wanted = list(
      [
        line("Sol Ring", 1, "main", "sol-ring-c21"),
        line("Rhystic Study", 1, "sideboard"),
        line("Forest", 10),
        line("Swords to Plowshares", 1, "sideboard"),
      ],
      { commander: "Atraxa, Praetors' Voice" }
    );

    expect(diffBuild(MAIN, wanted).map(buildChangeKind)).toEqual([
      "remove",
      "add",
    ]);
  });

  it("matches names the way bulk edit does, ignoring case and spacing", () => {
    const wanted = list(
      [
        line("sol ring", 1, "main", "sol-ring-c21"),
        line("RHYSTIC STUDY"),
        line("Forest", 10),
        line("Swords to Plowshares", 1, "sideboard"),
      ],
      { commander: "atraxa, praetors' voice" }
    );

    expect(diffBuild(MAIN, wanted)).toEqual([]);
  });

  it("adds up repeated rows of one line, keeping the first printing", () => {
    const main = list([
      line("Forest", 6, "main", "forest-a"),
      line("Forest", 4, "main", "forest-b"),
    ]);
    const wanted = list([line("Forest", 10, "main", "forest-a")]);

    expect(diffBuild(main, wanted)).toEqual([]);
  });
});

describe("resolveBuild", () => {
  it("resolves an empty change set to the main build", () => {
    const resolved = resolveBuild(MAIN, []);

    expect(resolved.list).toEqual(MAIN);
    expect(resolved.statuses).toEqual([]);
  });

  it("returns the wanted list for the changes diffed from it", () => {
    const wanted = list(
      [
        line("Sol Ring", 1, "main", "sol-ring-lea"),
        line("Mystic Remora"),
        line("Forest", 12),
        line("Swords to Plowshares", 1, "sideboard"),
      ],
      { commander: "Tymna the Weaver", partner: "Kraum, Ludevic's Opus" }
    );

    const resolved = resolveBuild(MAIN, diffBuild(MAIN, wanted));

    expect(resolved.list.commandZone).toEqual(wanted.commandZone);
    expect(byLine(resolved.list)).toEqual(byLine(wanted));
    expect(resolved.statuses.map(({ status }) => status)).toEqual(
      Array.from({ length: 6 }, () => "applied")
    );
  });

  it("keeps the main order and puts added lines after it", () => {
    const changes = diffBuild(
      MAIN,
      list(
        [
          line("Mystic Remora"),
          line("Sol Ring", 1, "main", "sol-ring-c21"),
          line("Forest", 10),
          line("Swords to Plowshares", 1, "sideboard"),
        ],
        { commander: "Atraxa, Praetors' Voice" }
      )
    );

    expect(
      resolveBuild(MAIN, changes).list.lines.map(({ name }) => name)
    ).toEqual(["Sol Ring", "Forest", "Swords to Plowshares", "Mystic Remora"]);
  });

  it("swaps the commander, so the build is checked against its own (1.5)", () => {
    const changes = diffBuild(
      MAIN,
      list(MAIN.lines, { commander: "Tymna the Weaver" })
    );

    expect(resolveBuild(MAIN, changes).list.commandZone.commander).toBe(
      "Tymna the Weaver"
    );
  });

  describe("when the main build moves (4.2)", () => {
    const bracketTwo = diffBuild(
      MAIN,
      list(
        [
          line("Sol Ring", 1, "main", "sol-ring-c21"),
          line("Mystic Remora"),
          line("Forest", 10),
          line("Swords to Plowshares", 1, "sideboard"),
        ],
        { commander: "Atraxa, Praetors' Voice" }
      )
    );

    it("marks a change absorbed when the main build now holds its value", () => {
      const movedMain = list(
        [...MAIN.lines.filter(({ name }) => name !== "Rhystic Study")],
        MAIN.commandZone
      );

      const resolved = resolveBuild(movedMain, bracketTwo);

      expect(resolved.statuses).toEqual([
        { change: bracketTwo[0], status: "absorbed" },
        { change: bracketTwo[1], status: "applied" },
      ]);
      expect(resolved.list.lines.map(({ name }) => name)).not.toContain(
        "Rhystic Study"
      );
    });

    it("holds a change when the main build holds a third value, and shows main's", () => {
      const movedMain = list(
        MAIN.lines.map((entry) =>
          entry.name === "Rhystic Study" ? { ...entry, quantity: 2 } : entry
        ),
        MAIN.commandZone
      );

      const resolved = resolveBuild(movedMain, bracketTwo);

      expect(resolved.statuses[0]).toEqual({
        change: bracketTwo[0],
        status: "held",
      });
      expect(byLine(resolved.list).get("main|Rhystic Study")).toEqual(
        line("Rhystic Study", 2)
      );
    });

    it("holds a commander swap when main changed its commander", () => {
      const swap = diffBuild(
        MAIN,
        list(MAIN.lines, { commander: "Tymna the Weaver" })
      );
      const movedMain = list(MAIN.lines, {
        commander: "Kenrith, the Returned King",
      });

      const resolved = resolveBuild(movedMain, swap);

      expect(resolved.statuses.map(({ status }) => status)).toEqual(["held"]);
      expect(resolved.list.commandZone.commander).toBe(
        "Kenrith, the Returned King"
      );
    });

    it("holds an addition whose line main has since added with other copies", () => {
      const movedMain = list(
        [...MAIN.lines, line("Mystic Remora", 2)],
        MAIN.commandZone
      );

      const resolved = resolveBuild(movedMain, bracketTwo);

      expect(resolved.statuses[1]?.status).toBe("held");
      expect(byLine(resolved.list).get("main|Mystic Remora")?.quantity).toBe(2);
    });
  });

  it("lists statuses command zone first, then lines by position, then by key", () => {
    const remove: BuildChange = {
      target: "line",
      zone: "main",
      name: "Rhystic Study",
      position: 1,
      expected: { quantity: 1, printing: null },
      value: null,
    };
    const add: BuildChange = {
      target: "line",
      zone: "main",
      name: "Mystic Remora",
      position: 1,
      expected: null,
      value: { quantity: 1, printing: null },
    };
    const swap: BuildChange = {
      target: "commandSlot",
      slot: "companion",
      expected: null,
      value: "Jegantha, the Wellspring",
    };

    const resolved = resolveBuild(MAIN, [remove, add, swap]);

    expect(resolved.statuses.map(({ change }) => change)).toEqual([
      swap,
      add,
      remove,
    ]);
  });
});

/** A seeded generator, so the random walk below is the same on every run. */
function seededRandom(seed: number): (bound: number) => number {
  let state = seed;
  return (bound) => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state % bound;
  };
}

const POOL = ["Sol Ring", "Arcane Signet", "Counterspell", "Forest", "Island"];
const ZONES: readonly DeckZone[] = ["main", "sideboard", "maybeboard"];
const COMMANDERS = [null, "Atraxa, Praetors' Voice", "Tymna the Weaver"];

function randomList(next: (bound: number) => number): BuildList {
  const lines = new Map<string, BuildLine>();
  for (let index = next(6); index > 0; index -= 1) {
    const entry = line(
      POOL[next(POOL.length)] ?? "Sol Ring",
      1 + next(3),
      ZONES[next(ZONES.length)] ?? "main",
      next(2) === 0 ? null : `printing-${next(2)}`
    );
    lines.set(`${entry.zone}|${entry.name}`, entry);
  }
  return list([...lines.values()], {
    commander: COMMANDERS[next(COMMANDERS.length)] ?? null,
  });
}

/** An applied or absorbed line shows the build's value; a held one shows main's. */
function expectEachLineShowsItsStatus(
  main: BuildList,
  resolved: ReturnType<typeof resolveBuild>
): void {
  const mainLines = byLine(main);
  const resolvedLines = byLine(resolved.list);
  for (const { change, status } of resolved.statuses) {
    if (change.target !== "line") continue;
    const key = `${change.zone}|${change.name}`;
    const shown = resolvedLines.get(key);
    const state = shown
      ? { quantity: shown.quantity, printing: shown.printing }
      : null;
    const mainLine = mainLines.get(key);
    const mainState = mainLine
      ? { quantity: mainLine.quantity, printing: mainLine.printing }
      : null;
    expect(state).toEqual(status === "held" ? mainState : change.value);
  }
}

describe("resolveBuild invariants over 1,000 seeded edits", () => {
  it("keeps every invariant and gives byte-identical output", () => {
    const next = seededRandom(55);
    for (let run = 0; run < 1_000; run += 1) {
      const main = randomList(next);
      const wanted = randomList(next);
      const movedMain = randomList(next);
      const changes = diffBuild(main, wanted);

      const resolved = resolveBuild(main, changes);
      expect(byLine(resolved.list)).toEqual(byLine(wanted));
      expect(resolved.list.commandZone).toEqual(wanted.commandZone);
      expect(
        resolved.statuses.every(({ status }) => status === "applied")
      ).toBe(true);

      const moved = resolveBuild(movedMain, changes);
      expect(JSON.stringify(resolveBuild(movedMain, changes))).toBe(
        JSON.stringify(moved)
      );
      expect(moved.statuses).toHaveLength(changes.length);
      expectEachLineShowsItsStatus(movedMain, moved);
      expect(diffBuild(movedMain, movedMain)).toEqual([]);
    }
  });
});
