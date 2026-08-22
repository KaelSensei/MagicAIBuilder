import { describe, it, expect } from "vitest";
import {
  computeMetaShifts,
  shiftMagnitude,
  toCaptureDay,
  type MetaShift,
  type MetaSnapshotInput,
} from "./history";

function snapshot(day: string, cards: Record<string, number>): MetaSnapshotInput {
  return {
    capturedOn: new Date(`${day}T00:00:00.000Z`),
    cards: Object.entries(cards).map(([name, inclusion]) => ({ name, inclusion })),
  };
}

function shiftFor(shifts: readonly MetaShift[], name: string): MetaShift {
  const found = shifts.find((s) => s.name === name);
  if (!found) throw new Error(`no shift reported for "${name}"`);
  return found;
}

describe("toCaptureDay", () => {
  it("truncates to UTC midnight", () => {
    expect(toCaptureDay(new Date("2026-08-22T23:41:07.500Z")).toISOString()).toBe(
      "2026-08-22T00:00:00.000Z"
    );
  });

  it("keys two moments of the same UTC day to one day", () => {
    const morning = toCaptureDay(new Date("2026-08-22T00:00:00.000Z"));
    const night = toCaptureDay(new Date("2026-08-22T23:59:59.999Z"));
    expect(morning.getTime()).toBe(night.getTime());
  });
});

describe("computeMetaShifts", () => {
  it("returns null with a single snapshot — the first visit can only set a baseline", () => {
    expect(computeMetaShifts([snapshot("2026-08-22", { "Sol Ring": 0.9 })], 30)).toBeNull();
  });

  it("returns null when both snapshots land on the same day", () => {
    const twice = [
      snapshot("2026-08-22", { "Sol Ring": 0.9 }),
      snapshot("2026-08-22", { "Sol Ring": 0.8 }),
    ];
    expect(computeMetaShifts(twice, 30)).toBeNull();
  });

  it("returns null when every older snapshot falls outside the window", () => {
    const far = [
      snapshot("2026-01-01", { "Sol Ring": 0.5 }),
      snapshot("2026-08-22", { "Sol Ring": 0.9 }),
    ];
    expect(computeMetaShifts(far, 30)).toBeNull();
  });

  it("reports an exact delta for a card listed at both ends", () => {
    const report = computeMetaShifts(
      [
        snapshot("2026-07-23", { "Sol Ring": 0.7, "Arcane Signet": 0.6 }),
        snapshot("2026-08-22", { "Sol Ring": 0.82, "Arcane Signet": 0.44 }),
      ],
      60
    );

    expect(report).not.toBeNull();
    expect(report?.spanDays).toBe(30);

    const rise = shiftFor(report?.shifts ?? [], "Sol Ring");
    expect(rise.kind).toBe("rose");
    expect(rise.kind === "rose" && rise.delta).toBeCloseTo(0.12, 10);

    const fall = shiftFor(report?.shifts ?? [], "Arcane Signet");
    expect(fall.kind).toBe("fell");
    expect(fall.kind === "fell" && fall.delta).toBeCloseTo(-0.16, 10);
  });

  it("calls a movement inside the steady band steady, not a shift", () => {
    const report = computeMetaShifts(
      [
        snapshot("2026-08-01", { "Sol Ring": 0.7 }),
        snapshot("2026-08-22", { "Sol Ring": 0.705 }),
      ],
      60
    );
    expect(shiftFor(report?.shifts ?? [], "Sol Ring").kind).toBe("steady");
  });

  // ─── The truncation rule ────────────────────────────────────────────────────

  it("never reports a vanished card as a fall to zero", () => {
    const report = computeMetaShifts(
      [
        snapshot("2026-08-01", { "Cyclonic Rift": 0.78, "Sol Ring": 0.6 }),
        snapshot("2026-08-22", { "Sol Ring": 0.61 }),
      ],
      60
    );

    const gone = shiftFor(report?.shifts ?? [], "Cyclonic Rift");
    expect(gone.kind).toBe("left");
    // The card sits somewhere below the surviving cut-off of 0.61, so the most
    // that can be claimed is a fall of 0.17 — never the full 0.78.
    expect(gone.kind === "left" && gone.deltaAtMost).toBeCloseTo(-0.17, 10);
    expect(gone).not.toHaveProperty("current");
  });

  it("bounds a newcomer's rise by the baseline cut-off rather than inventing one", () => {
    const report = computeMetaShifts(
      [
        snapshot("2026-08-01", { "Sol Ring": 0.6, "Swords to Plowshares": 0.45 }),
        snapshot("2026-08-22", { "Sol Ring": 0.6, "The One Ring": 0.52 }),
      ],
      60
    );

    const arrival = shiftFor(report?.shifts ?? [], "The One Ring");
    expect(arrival.kind).toBe("entered");
    // Below 0.45 at baseline, 0.52 now: it rose by at least 0.07.
    expect(arrival.kind === "entered" && arrival.deltaAtLeast).toBeCloseTo(0.07, 10);
    expect(arrival).not.toHaveProperty("baseline");
  });

  it("clamps a bound to zero when the card entered below the old cut-off", () => {
    const report = computeMetaShifts(
      [
        snapshot("2026-08-01", { "Sol Ring": 0.6, "Mana Crypt": 0.5 }),
        snapshot("2026-08-22", { "Sol Ring": 0.6, "Dockside Extortionist": 0.3 }),
      ],
      60
    );
    const arrival = shiftFor(report?.shifts ?? [], "Dockside Extortionist");
    // A shorter list can seat a newcomer under the old cut-off; the rise is then
    // unbounded below by anything useful, and claiming a negative rise is wrong.
    expect(arrival.kind === "entered" && arrival.deltaAtLeast).toBe(0);
  });

  // ─── Ordering and window selection ──────────────────────────────────────────

  it("ranks by magnitude, mixing measured deltas and bounds", () => {
    const report = computeMetaShifts(
      [
        snapshot("2026-08-01", { A: 0.5, B: 0.5, C: 0.5 }),
        snapshot("2026-08-22", { A: 0.52, B: 0.9, D: 0.8 }),
      ],
      60
    );
    // B rose by an exact 0.40 and D entered above the old 0.50 cut-off, so its
    // rise is at least 0.30. C last — it dropped out, but from 0.50, already
    // under the new 0.52 cut-off, so nothing can be claimed about its fall.
    expect((report?.shifts ?? []).map((s) => s.name)).toEqual(["B", "D", "A", "C"]);
    expect(shiftFor(report?.shifts ?? [], "C")).toMatchObject({
      kind: "left",
      deltaAtMost: 0,
    });
  });

  it("takes the oldest snapshot inside the window as the baseline", () => {
    const report = computeMetaShifts(
      [
        snapshot("2026-08-22", { "Sol Ring": 0.9 }),
        snapshot("2026-08-21", { "Sol Ring": 0.89 }),
        snapshot("2026-07-30", { "Sol Ring": 0.5 }),
        snapshot("2026-05-01", { "Sol Ring": 0.1 }),
      ],
      30
    );
    // 2026-07-30 is inside 30 days; 2026-05-01 is not, and 2026-08-21 is the
    // *latest* candidate, which would answer a different question.
    expect(report?.baselineCapturedOn.toISOString()).toBe("2026-07-30T00:00:00.000Z");
    expect(report?.spanDays).toBe(23);
  });

  it("does not depend on the order it is handed", () => {
    const chronological = [
      snapshot("2026-08-01", { A: 0.5 }),
      snapshot("2026-08-22", { A: 0.7 }),
    ];
    const shuffled = [chronological[1], chronological[0]];
    expect(computeMetaShifts(shuffled, 60)).toEqual(computeMetaShifts(chronological, 60));
  });

  it("rejects a non-positive window instead of comparing a snapshot to itself", () => {
    const pair = [snapshot("2026-08-01", { A: 0.5 }), snapshot("2026-08-22", { A: 0.7 })];
    expect(computeMetaShifts(pair, 0)).toBeNull();
    expect(computeMetaShifts(pair, -30)).toBeNull();
  });

  it("keeps the first entry when a snapshot lists a name twice", () => {
    const duplicated: MetaSnapshotInput = {
      capturedOn: new Date("2026-08-22T00:00:00.000Z"),
      cards: [
        { name: "Sol Ring", inclusion: 0.9 },
        { name: "Sol Ring", inclusion: 0.1 },
      ],
    };
    const report = computeMetaShifts(
      [snapshot("2026-08-01", { "Sol Ring": 0.8 }), duplicated],
      60
    );
    expect(shiftFor(report?.shifts ?? [], "Sol Ring")).toMatchObject({ current: 0.9 });
    expect(report?.shifts).toHaveLength(1);
  });

  it("survives an empty snapshot on either end", () => {
    const emptied = computeMetaShifts(
      [snapshot("2026-08-01", { A: 0.5 }), snapshot("2026-08-22", {})],
      60
    );
    expect(emptied?.shifts).toEqual([
      { kind: "left", name: "A", baseline: 0.5, deltaAtMost: -0.5 },
    ]);
  });
});

describe("shiftMagnitude", () => {
  it("reads the right field for every variant", () => {
    expect(
      shiftMagnitude({ kind: "fell", name: "A", baseline: 0.5, current: 0.2, delta: -0.3 })
    ).toBeCloseTo(0.3, 10);
    expect(
      shiftMagnitude({ kind: "entered", name: "B", current: 0.4, deltaAtLeast: 0.15 })
    ).toBe(0.15);
    expect(
      shiftMagnitude({ kind: "left", name: "C", baseline: 0.6, deltaAtMost: -0.25 })
    ).toBe(0.25);
  });
});
