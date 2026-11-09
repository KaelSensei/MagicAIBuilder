// Runs the full analysis and writes analysis.json and report.md to $OUT_DIR
// (default: <os tmpdir>/commander-opening-hands).
// Usage: node analyze.mjs [N=250000]
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PROFILES, withLands } from "./profiles.mjs";
import {
  simulateBuckets,
  solve,
  decodeBucket,
  bucketValue,
  deckStats,
  N_BUCKETS,
} from "./model.mjs";

const OUT = process.env.OUT_DIR ?? join(tmpdir(), "commander-opening-hands");
mkdirSync(OUT, { recursive: true });
const N = Number(process.argv[2] ?? 250000);

// Development horizon per bracket (turn through which mana spent is counted).
// Based on measured game length: first knockout ~9 / 8.5 / 8 / 7.7 turns in
// B1–B4 (EDHRECast 397) and cEDH games decided around turns 3–5.
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

function stagesFor(sim, regime) {
  const { L7, L6, L5, L4, R6, R5, R4 } = sim;
  switch (regime) {
    case "free":
      return [L7, L7, L6, L5, L4]; // multiplayer: 7, free 7, 6, 5, 4
    case "london1v1":
      return [L7, L6, L5, L4]; // no free mulligan
    case "appNow":
      return [L7, R6, R5, R4]; // current app: no free, random cards, no bottom choice
    case "freeRandom":
      return [L7, L7, R6, R5, R4]; // free mulligan but random n cards
    case "none":
      return [L7];
    default:
      throw new Error(regime);
  }
}

// Heuristic keep rules people actually use.
const POLICIES = {
  optimal: () => "optimal",
  // "2 to 5 lands" on seven, 2–4 on six, 1–4 on five
  lands25: () => (b) =>
    b.size === 7
      ? b.L >= 2 && b.L <= 5
      : b.size === 6
        ? b.L >= 2 && b.L <= 4
        : b.L >= 1 && b.L <= 4,
  // Karsten 2022: keep a FREE seven only with 3–5 lands; afterwards 2–5 / 2–4 / 1–4
  karsten: (regime) => (b, i) =>
    regime === "free" && i === 0
      ? b.L >= 3 && b.L <= 5
      : b.size === 7
        ? b.L >= 2 && b.L <= 5
        : b.size === 6
          ? b.L >= 2 && b.L <= 4
          : b.L >= 1 && b.L <= 4,
};

function simulateProfile(profile, n, seed) {
  const t0 = Date.now();
  const sim = {
    L7: simulateBuckets(profile, 7, "london", n, seed + 1),
    L6: simulateBuckets(profile, 6, "london", n, seed + 2),
    L5: simulateBuckets(profile, 5, "london", Math.round(n * 0.6), seed + 3),
    L4: simulateBuckets(profile, 4, "london", Math.round(n * 0.4), seed + 4),
  };
  sim.R6 = simulateBuckets(profile, 6, "random", Math.round(n * 0.6), seed + 5);
  sim.R5 = simulateBuckets(profile, 5, "random", Math.round(n * 0.4), seed + 6);
  sim.R4 = simulateBuckets(profile, 4, "random", Math.round(n * 0.3), seed + 7);
  process.stderr.write(
    `${profile.id}: simulated in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`
  );
  return sim;
}

// Keep table for one stage: rows L 0..7, cols cheap ramp 0/1/2+; cell = rule on E.
function keepTable(st, keep, minCount = 400) {
  const rows = [];
  for (let L = 0; L <= 7; L++) {
    const row = [];
    for (let R = 0; R <= 2; R++) {
      const ks = [];
      for (let E = 0; E <= 3; E++) {
        const b = ((st.size * 8 + L) * 3 + R) * 4 + E;
        if (st.count[b] < minCount) ks.push(null);
        else ks.push(keep[b] === 1);
      }
      const known = ks.filter((k) => k !== null);
      let cell;
      if (known.length === 0) cell = "·";
      else if (known.every((k) => k)) cell = "K";
      else if (known.every((k) => !k)) cell = "M";
      else {
        const first = ks.findIndex((k) => k === true);
        const monotone = ks.slice(first).every((k) => k !== false);
        cell = monotone
          ? `K if ≥${first}`
          : ks.map((k) => (k === null ? "·" : k ? "K" : "M")).join("");
      }
      row.push(cell);
    }
    rows.push(row);
  }
  return rows;
}

const pct = (x) => (100 * x).toFixed(1);
const report = [];
const json = {};

const ids = ["b1", "b2", "b3", "b3aggro", "b3big", "b3spells", "b4", "b5"];
let seed = 1000;
for (const id of ids) {
  const profile = PROFILES[id];
  const stats = deckStats(profile);
  const sim = simulateProfile(profile, N, (seed += 100));
  const H = HORIZON[id];
  const out = {
    profile: {
      id,
      label: profile.label,
      commanderMv: profile.commanderMv,
      ...stats,
    },
    horizon: H,
    regimes: {},
    keepTables: {},
    horizons: {},
  };

  report.push(`\n## ${profile.label}`);
  report.push(
    `lands ${stats.lands} · ramp ${stats.ramp} (≤2 MV: ${stats.cheapRamp}) · draw ${stats.draw} · avg MV ${stats.avgMv.toFixed(2)} · curve 0–7+: ${stats.curve.join("/")} · horizon T${H}`
  );
  report.push(
    "| regime | policy | mana spent by T" +
      H +
      " | keep 7 | 1 mull | 2 mull | 3+ | avg kept | ≥4 lands T4 | ≤2 lands T4 | ≥4 mana T3 | cmd on curve | cmd ≤ MV+1 | key in hand |"
  );
  report.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const regime of ["free", "london1v1", "appNow", "freeRandom", "none"]) {
    for (const pol of ["optimal", "lands25", "karsten"]) {
      if (regime === "none" && pol !== "optimal") continue;
      const stages = stagesFor(sim, regime);
      const r = solve(stages, H, POLICIES[pol](regime));
      const d = r.dist;
      const three = d.slice(3).reduce((a, b) => a + b, 0);
      out.regimes[`${regime}/${pol}`] = {
        value: r.value,
        dist: d,
        keptSize: r.keptSize,
        metrics: r.metrics,
        spentCurve: r.spentCurve,
      };
      report.push(
        `| ${regime} | ${pol} | ${r.value.toFixed(2)} | ${pct(d[0])} | ${pct(d[1] ?? 0)} | ${pct(d[2] ?? 0)} | ${pct(three)} | ${r.keptSize.toFixed(2)} | ${pct(r.metrics.land4T4)} | ${pct(r.metrics.miss2T4)} | ${pct(r.metrics.mana4T3)} | ${pct(r.metrics.cmdOnCurve)} | ${pct(r.metrics.cmdPlus1)} | ${pct(r.metrics.keyInHand)} |`
      );
    }
  }
  // "naive" use of the free mulligan: same keep rule on the first seven as on the second
  {
    const stages = stagesFor(sim, "free");
    const opt = solve(stages, H, "optimal");
    const E6 = opt.Ev[2];
    const naive = solve(stages, H, (b, i) => {
      const st = stages[i];
      const id2 = ((b.size * 8 + b.L) * 3 + b.R) * 4 + b.E;
      const v = bucketValue(st, id2, H);
      return i <= 1 ? v >= E6 : v >= opt.Ev[i + 1];
    });
    out.regimes["free/naive"] = {
      value: naive.value,
      dist: naive.dist,
      keptSize: naive.keptSize,
      metrics: naive.metrics,
    };
    report.push(
      `| free | same rule on both sevens | ${naive.value.toFixed(2)} | ${pct(naive.dist[0])} | ${pct(naive.dist[1])} | ${pct(naive.dist[2])} | ${pct(naive.dist.slice(3).reduce((a, b) => a + b, 0))} | ${naive.keptSize.toFixed(2)} | ${pct(naive.metrics.land4T4)} | ${pct(naive.metrics.miss2T4)} | ${pct(naive.metrics.mana4T3)} | ${pct(naive.metrics.cmdOnCurve)} | ${pct(naive.metrics.cmdPlus1)} | ${pct(naive.metrics.keyInHand)} |`
    );
    report.push(
      `Thresholds (mana spent by T${H}): first seven kept if ≥ ${opt.Ev[1].toFixed(2)}; free seven if ≥ ${opt.Ev[2].toFixed(2)}; six if ≥ ${opt.Ev[3].toFixed(2)}; five if ≥ ${opt.Ev[4].toFixed(2)}`
    );
    const names = [
      "First seven (free mulligan still available)",
      "Second seven (after the free mulligan)",
      "Six (best 6 of 7)",
      "Five (best 5 of 7)",
    ];
    for (let i = 0; i < 4; i++) {
      const t = keepTable(stages[i], opt.keepSets[i]);
      out.keepTables[names[i]] = t;
      report.push(
        `\n${names[i]} — rows: lands in hand; columns: cheap ramp (≤2 MV) 0 / 1 / 2+; "K if ≥n" = keep with at least n other plays of MV ≤3`
      );
      report.push("| lands | ramp 0 | ramp 1 | ramp 2+ |");
      report.push("|---|---|---|---|");
      t.forEach((row, L) => report.push(`| ${L} | ${row.join(" | ")} |`));
    }
    // 1v1 comparison table for the seven
    const one = solve(stagesFor(sim, "london1v1"), H, "optimal");
    const t1 = keepTable(stagesFor(sim, "london1v1")[0], one.keepSets[0]);
    out.keepTables["Seven without a free mulligan (1v1)"] = t1;
    report.push("\nSeven without a free mulligan (1v1 Commander)");
    report.push("| lands | ramp 0 | ramp 1 | ramp 2+ |");
    report.push("|---|---|---|---|");
    t1.forEach((row, L) => report.push(`| ${L} | ${row.join(" | ")} |`));
  }
  // horizon sensitivity: how the first-seven keep rate and the free-mulligan gain move with game speed
  report.push("\nHorizon sensitivity (free regime, optimal):");
  report.push(
    "| horizon | value free | value 1v1 | value app now | keep first 7 | keep first 7 (1v1) | avg kept size |"
  );
  report.push("|---|---|---|---|---|---|---|");
  for (const h of [3, 4, 5, 6, 7, 8, 9, 10]) {
    const f = solve(stagesFor(sim, "free"), h, "optimal");
    const o = solve(stagesFor(sim, "london1v1"), h, "optimal");
    const a = solve(stagesFor(sim, "appNow"), h, "optimal");
    out.horizons[h] = {
      free: f.value,
      london1v1: o.value,
      appNow: a.value,
      keep7: f.dist[0],
      keep7_1v1: o.dist[0],
      keptSize: f.keptSize,
      dist: f.dist,
    };
    report.push(
      `| T${h} | ${f.value.toFixed(2)} | ${o.value.toFixed(2)} | ${a.value.toFixed(2)} | ${pct(f.dist[0])} | ${pct(o.dist[0])} | ${f.keptSize.toFixed(2)} |`
    );
  }
  json[id] = out;
  writeFileSync(join(OUT, "analysis.json"), JSON.stringify(json, null, 1));
  writeFileSync(join(OUT, "report.md"), report.join("\n"));
}

// ─── Land sweep: how many lands, with and without the free mulligan ───────
report.push("\n## Land-count sweep (optimal mulligans)");
const sweep = {};
for (const id of ["b2", "b3", "b4"]) {
  const base = PROFILES[id];
  const H = HORIZON[id];
  const baseLands = deckStats(base).lands;
  sweep[id] = [];
  report.push(`\n### ${base.label} (horizon T${H})`);
  report.push(
    "| lands | free: value | free: ≥4 lands T4 | free: ≤2 lands T4 | free: keep 7 | 1v1: value | 1v1: ≥4 lands T4 | no mulligan: value |"
  );
  report.push("|---|---|---|---|---|---|---|---|");
  for (let L = baseLands - 6; L <= baseLands + 4; L++) {
    const p = withLands(base, L);
    const n2 = Math.round(N * 0.6);
    const sim = {
      L7: simulateBuckets(p, 7, "london", n2, (seed += 10) + 1),
      L6: simulateBuckets(p, 6, "london", n2, seed + 2),
      L5: simulateBuckets(p, 5, "london", Math.round(n2 * 0.6), seed + 3),
      L4: simulateBuckets(p, 4, "london", Math.round(n2 * 0.4), seed + 4),
    };
    const f = solve([sim.L7, sim.L7, sim.L6, sim.L5, sim.L4], H, "optimal");
    const o = solve([sim.L7, sim.L6, sim.L5, sim.L4], H, "optimal");
    const z = solve([sim.L7], H, "optimal");
    sweep[id].push({
      lands: L,
      free: f.value,
      london1v1: o.value,
      none: z.value,
      freeLand4T4: f.metrics.land4T4,
      freeMiss2: f.metrics.miss2T4,
      keep7: f.dist[0],
      oneLand4T4: o.metrics.land4T4,
    });
    report.push(
      `| ${L} | ${f.value.toFixed(2)} | ${pct(f.metrics.land4T4)} | ${pct(f.metrics.miss2T4)} | ${pct(f.dist[0])} | ${o.value.toFixed(2)} | ${pct(o.metrics.land4T4)} | ${z.value.toFixed(2)} |`
    );
    process.stderr.write(`sweep ${id} L${L} done\n`);
  }
  json.sweep = sweep;
  writeFileSync(join(OUT, "analysis.json"), JSON.stringify(json, null, 1));
  writeFileSync(join(OUT, "report.md"), report.join("\n"));
}
process.stderr.write("done\n");
