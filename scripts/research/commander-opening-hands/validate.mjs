// Checks the model against exact hypergeometric odds and prints each profile's shape.
import { PROFILES } from "./profiles.mjs";
import { deckStats, simulateBuckets, solve, decodeBucket } from "./model.mjs";
for (const p of Object.values(PROFILES)) {
  const s = deckStats(p);
  console.log(
    p.id.padEnd(11),
    "lands",
    s.lands,
    "ramp",
    s.ramp,
    "cheapRamp",
    s.cheapRamp,
    "draw",
    s.draw,
    "avgMV",
    s.avgMv.toFixed(2),
    "curve0-7+",
    s.curve.join(" ")
  );
}
// validation: keep every 7, no land ramp: P(>=3 lands at T3) should be ~0.780 (hypergeometric, 10 cards seen)
const st = simulateBuckets(PROFILES.validate36, 7, "london", 200000, 1);
const r = solve([st], 3, "optimal");
console.log(
  "validate36 land3T3",
  r.metrics.land3T3.toFixed(4),
  "land4T4",
  r.metrics.land4T4.toFixed(4),
  "(expect 0.780, 0.621)"
);
let p24 = 0;
for (let b = 0; b < st.count.length; b++) {
  if (!st.count[b]) continue;
  const d = decodeBucket(b);
  if (d.L >= 2 && d.L <= 4) p24 += st.count[b];
}
console.log("P(2-4 lands in 7)", (p24 / st.N).toFixed(4), "(expect 0.740)");
