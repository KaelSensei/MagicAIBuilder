// Land sweeps for play-style variants, B1 and cEDH (curve shape -> land count).
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PROFILES, withLands } from "./profiles.mjs";
import { simulateBuckets, solve, deckStats } from "./model.mjs";
const OUT = process.env.OUT_DIR ?? join(tmpdir(), "commander-opening-hands");
mkdirSync(OUT, { recursive: true });
const N = Number(process.argv[2] ?? 150000);
const HORIZON = { b1: 8, b3aggro: 7, b3big: 7, b3spells: 7, b5: 4 };
const res = {};
const lines = [];
let seed = 90000;
for (const id of Object.keys(HORIZON)) {
  const base = PROFILES[id];
  const H = HORIZON[id];
  const bl = deckStats(base).lands;
  res[id] = [];
  lines.push(`\n### ${base.label} (horizon T${H}, base ${bl} lands)`);
  lines.push(
    "| lands | free: value | free: ≥4 lands T4 | free: ≤2 lands T4 | free: keep 7 | free: cmd ≤ MV+1 | 1v1: value | no mulligan: value |"
  );
  lines.push("|---|---|---|---|---|---|---|---|");
  for (let L = bl - 6; L <= bl + 4; L++) {
    const p = withLands(base, L);
    const s = {
      L7: simulateBuckets(p, 7, "london", N, (seed += 10) + 1),
      L6: simulateBuckets(p, 6, "london", N, seed + 2),
      L5: simulateBuckets(p, 5, "london", Math.round(N * 0.6), seed + 3),
      L4: simulateBuckets(p, 4, "london", Math.round(N * 0.4), seed + 4),
    };
    const f = solve([s.L7, s.L7, s.L6, s.L5, s.L4], H, "optimal");
    const o = solve([s.L7, s.L6, s.L5, s.L4], H, "optimal");
    const z = solve([s.L7], H, "optimal");
    res[id].push({
      lands: L,
      free: f.value,
      london1v1: o.value,
      none: z.value,
      land4T4: f.metrics.land4T4,
      miss2: f.metrics.miss2T4,
      keep7: f.dist[0],
      cmdPlus1: f.metrics.cmdPlus1,
      mana4T2: f.metrics.mana4T2,
      mana3T1: f.metrics.mana3T1,
    });
    lines.push(
      `| ${L} | ${f.value.toFixed(2)} | ${(100 * f.metrics.land4T4).toFixed(1)} | ${(100 * f.metrics.miss2T4).toFixed(1)} | ${(100 * f.dist[0]).toFixed(1)} | ${(100 * f.metrics.cmdPlus1).toFixed(1)} | ${o.value.toFixed(2)} | ${z.value.toFixed(2)} |`
    );
    process.stderr.write(`${id} L${L}\n`);
  }
  writeFileSync(join(OUT, "sweep2.json"), JSON.stringify(res, null, 1));
  writeFileSync(join(OUT, "sweep2.md"), lines.join("\n"));
}
