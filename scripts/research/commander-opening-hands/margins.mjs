// Value of keeping each (lands, cheap ramp) class of hand versus the value of
// mulliganing, at each stage. Positive = keep is better (mana spent by horizon).
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PROFILES } from "./profiles.mjs";
import { simulateBuckets, solve, HMAX } from "./model.mjs";
const OUT = process.env.OUT_DIR ?? join(tmpdir(), "commander-opening-hands");
mkdirSync(OUT, { recursive: true });
const N = Number(process.argv[2] ?? 250000);
const HORIZON = {
  b1: 8,
  b2: 8,
  b3: 7,
  b3aggro: 7,
  b3big: 7,
  b3spells: 7,
  b4: 6,
  b5: 4,
};
const out = {};
let seed = 5000;
for (const id of Object.keys(HORIZON)) {
  const p = PROFILES[id],
    H = HORIZON[id];
  const L7 = simulateBuckets(p, 7, "london", N, (seed += 10)),
    L6 = simulateBuckets(p, 6, "london", N, seed + 1),
    L5 = simulateBuckets(p, 5, "london", (N * 0.6) | 0, seed + 2),
    L4 = simulateBuckets(p, 4, "london", (N * 0.4) | 0, seed + 3);
  const f = solve([L7, L7, L6, L5, L4], H, "optimal");
  const o = solve([L7, L6, L5, L4], H, "optimal");
  const stages = {
    first7: [L7, f.Ev[1]],
    free7: [L7, f.Ev[2]],
    six: [L6, f.Ev[3]],
    seven1v1: [L7, o.Ev[1]],
  };
  out[id] = {
    H,
    thresholds: {
      first7: f.Ev[1],
      free7: f.Ev[2],
      six: f.Ev[3],
      five: f.Ev[4],
      seven1v1: o.Ev[1],
    },
    cells: {},
  };
  for (const [name, [st, thr]] of Object.entries(stages)) {
    const cells = [];
    for (let L = 0; L <= 7; L++)
      for (let R = 0; R <= 2; R++) {
        let n = 0,
          s = 0;
        for (let E = 0; E <= 3; E++) {
          const b = ((st.size * 8 + L) * 3 + R) * 4 + E;
          n += st.count[b];
          s += st.spent[b * HMAX + H - 1];
        }
        if (n < 300) continue;
        cells.push({
          L,
          R,
          share: n / st.N,
          value: s / n,
          margin: s / n - thr,
          marginPct: (s / n - thr) / thr,
        });
      }
    out[id].cells[name] = cells;
  }
  process.stderr.write(id + "\n");
}
writeFileSync(join(OUT, "margins.json"), JSON.stringify(out, null, 1));
for (const [id, o] of Object.entries(out)) {
  console.log(
    `== ${id} H${o.H} thr first7 ${o.thresholds.first7.toFixed(2)} free7 ${o.thresholds.free7.toFixed(2)} six ${o.thresholds.six.toFixed(2)}`
  );
  for (const name of ["first7", "free7", "seven1v1"])
    console.log(
      "  " + name.padEnd(8),
      o.cells[name]
        .filter((c) => c.share > 0.01)
        .map(
          (c) =>
            `${c.L}L${c.R}R:${(100 * c.marginPct).toFixed(1)}%(${(100 * c.share).toFixed(0)})`
        )
        .join(" ")
    );
}
