// Opening-hand and goldfish model for multiplayer Commander.
//
// A deck is 99 cards; the commander sits in the command zone and is always
// available. Each game: mulligan procedure -> goldfish N turns -> record how
// much mana was spent and how the mana developed.
//
// Card kinds:
//   land    untapped land            tland  land that enters tapped
//   rock    artifact mana, usable the turn it lands (Sol Ring, Signets, Moxen)
//   dork    creature mana, usable from the next turn
//   lramp   land ramp: puts `out` lands onto the battlefield (tapped or not)
//           and `toHand` lands into hand (Cultivate)
//   draw    draws `n` cards on resolution
//   engine  draws 1 extra card each of your later draw steps
//   spell   everything else (plan cards, interaction, threats)
//
// Rules modelled (CR effective 2026-11-06):
//   103.5c  first mulligan in multiplayer is free (draw 7, bottom 0)
//   800.7   the starting player draws on turn 1 in multiplayer
//   London  draw 7, put N chosen cards on the bottom

export const KIND = Object.freeze({
  land: 0,
  tland: 1,
  rock: 2,
  dork: 3,
  lramp: 4,
  draw: 5,
  engine: 6,
  spell: 7,
});

// ─── Seeded RNG (mulberry32) ───────────────────────────────────────────────
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rand) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
}

// ─── Deck construction ─────────────────────────────────────────────────────
// profile.cards: [{ kind, cost, out?, n?, tapped?, toHand?, key?, count }]
export function buildDeck(profile) {
  const deck = [];
  for (const c of profile.cards) {
    for (let i = 0; i < c.count; i++) {
      deck.push({
        kind: KIND[c.kind],
        cost: c.cost ?? 0,
        out: c.out ?? 0,
        n: c.n ?? 0,
        tapped: c.tapped ?? false,
        toHand: c.toHand ?? 0,
        key: c.key ?? false,
      });
    }
  }
  if (deck.length !== 99)
    throw new Error(`${profile.id}: deck has ${deck.length} cards`);
  return deck;
}

export function deckStats(profile) {
  const deck = buildDeck(profile);
  let lands = 0,
    ramp = 0,
    nonlandMv = 0,
    nonland = 0,
    draw = 0,
    cheapRamp = 0;
  const curve = new Array(8).fill(0);
  for (const c of deck) {
    if (c.kind === KIND.land || c.kind === KIND.tland) {
      lands++;
      continue;
    }
    nonland++;
    nonlandMv += c.cost;
    curve[Math.min(c.cost, 7)]++;
    if (c.kind === KIND.rock || c.kind === KIND.dork || c.kind === KIND.lramp) {
      ramp++;
      if (c.cost <= 2) cheapRamp++;
    }
    if (c.kind === KIND.draw || c.kind === KIND.engine) draw++;
  }
  return {
    lands,
    ramp,
    cheapRamp,
    draw,
    nonland,
    avgMv: nonlandMv / nonland,
    curve,
  };
}

const isLand = (c) => c.kind === KIND.land || c.kind === KIND.tland;
const isRamp = (c) =>
  c.kind === KIND.rock || c.kind === KIND.dork || c.kind === KIND.lramp;

// ─── Hand features (the state a player looks at when deciding to keep) ─────
// L = lands (0–7), R = cheap ramp, mana value <= 2 (capped at 2),
// E = other castable plays with mana value <= 3 (capped at 3)
export function features(hand) {
  let L = 0,
    R = 0,
    E = 0,
    key = 0;
  for (const c of hand) {
    if (isLand(c)) L++;
    else if (isRamp(c)) {
      if (c.cost <= 2) R++;
      else if (c.cost <= 3) E++;
    } else if (c.cost <= 3) E++;
    if (c.key) key++;
  }
  return { L, R: Math.min(R, 2), E: Math.min(E, 3), key };
}
export const bucketId = (size, f) => ((size * 8 + f.L) * 3 + f.R) * 4 + f.E;
export const N_BUCKETS = 8 * 8 * 3 * 4;
export function decodeBucket(id) {
  const E = id % 4;
  id = (id - E) / 4;
  const R = id % 3;
  id = (id - R) / 3;
  const L = id % 8;
  const size = (id - L) / 8;
  return { size, L, R, E };
}

// ─── London bottom choice: keep `n` of the 7 drawn cards ───────────────────
function nonlandPriority(c) {
  if (c.kind === KIND.rock && c.out >= c.cost) return 100; // Sol Ring, Moxen
  if (isRamp(c) && c.cost <= 2) return 90;
  if (c.key) return 85;
  if ((c.kind === KIND.draw || c.kind === KIND.engine) && c.cost <= 3)
    return 70;
  if (isRamp(c)) return 65;
  return 60 - 5 * c.cost; // cheaper spells first
}
export function londonKeep(seven, n) {
  if (n >= seven.length) return { keep: seven.slice(), bottom: [] };
  const lands = seven.filter(isLand).sort((a, b) => a.kind - b.kind); // untapped first
  const spells = seven
    .filter((c) => !isLand(c))
    .sort((a, b) => nonlandPriority(b) - nonlandPriority(a));
  let cheapRamp = 0;
  for (const c of spells) if (isRamp(c) && c.cost <= 2) cheapRamp++;
  const desired = n >= 6 ? 3 : n === 5 ? (cheapRamp > 0 ? 2 : 3) : 2;
  let keepLands = Math.min(lands.length, desired);
  if (spells.length < n - keepLands) keepLands = n - spells.length; // not enough spells: keep more lands
  const keep = lands.slice(0, keepLands).concat(spells.slice(0, n - keepLands));
  const bottom = lands.slice(keepLands).concat(spells.slice(n - keepLands));
  return { keep, bottom };
}

// ─── Goldfish ──────────────────────────────────────────────────────────────
const HMAX = 10;

// Best total cost <= budget from items (subset sum), preferring draw effects on ties.
function bestSubset(items, budget) {
  // items: array of cards; returns array of chosen indices
  const m = items.length;
  if (m === 0 || budget <= 0) return [];
  // dp over budget: value = cost*16 + drawBonus; small sizes, plain DP with choice tracking
  const W = budget;
  const val = new Float64Array((m + 1) * (W + 1));
  for (let i = 1; i <= m; i++) {
    const c = items[i - 1];
    const w = c.cost;
    const v =
      c.cost * 16 +
      (c.kind === KIND.draw || c.kind === KIND.engine ? 1 : 0) +
      (c.cost === 0 ? 0.5 : 0);
    for (let b = 0; b <= W; b++) {
      let best = val[(i - 1) * (W + 1) + b];
      if (w <= b) {
        const cand = val[(i - 1) * (W + 1) + b - w] + v;
        if (cand > best) best = cand;
      }
      val[i * (W + 1) + b] = best;
    }
  }
  const chosen = [];
  let b = W;
  for (let i = m; i >= 1; i--) {
    if (val[i * (W + 1) + b] !== val[(i - 1) * (W + 1) + b]) {
      chosen.push(i - 1);
      b -= items[i - 1].cost;
    }
  }
  return chosen;
}

/**
 * Play `HMAX` goldfish turns from a kept hand.
 * library: array, top of library = last element (pop to draw).
 * Returns per-turn arrays written into `out`.
 */
export function goldfish(hand, library, profile, out) {
  const cmdMv = profile.commanderMv;
  let landsBF = 0,
    rockMana = 0,
    dorkMana = 0,
    dorkSick = 0,
    engines = 0;
  let cmdCast = false,
    cmdTurn = 99,
    spentTotal = 0,
    firstKeyTurn = 99;
  const h = hand.slice();
  for (const c of h) if (c.key) firstKeyTurn = 0;

  const draw = (k) => {
    for (let i = 0; i < k && library.length > 0; i++) {
      const c = library.pop();
      if (c.key && firstKeyTurn === 99) firstKeyTurn = curTurn;
      h.push(c);
    }
  };
  const fetchLand = () => {
    // land ramp searches a basic: remove one land card from the library
    for (let i = library.length - 1; i >= 0; i--) {
      if (library[i].kind === KIND.land) {
        library.splice(i, 1);
        return true;
      }
    }
    return false;
  };
  const takeFromHand = (c) => {
    const i = h.indexOf(c);
    h.splice(i, 1);
  };

  let curTurn = 0;
  for (let t = 1; t <= HMAX; t++) {
    curTurn = t;
    dorkMana += dorkSick;
    dorkSick = 0;
    draw(1 + engines); // CR 800.7: the starting player draws on turn 1 in multiplayer
    let enteredTapped = 0;
    let landPlayed = false;
    let spent = 0;

    const playLand = (budgetNow) => {
      let u = -1,
        tp = -1;
      for (let i = 0; i < h.length; i++) {
        if (h[i].kind === KIND.land && u < 0) u = i;
        else if (h[i].kind === KIND.tland && tp < 0) tp = i;
      }
      if (u < 0 && tp < 0) return 0;
      let pick = u >= 0 ? u : tp;
      if (u >= 0 && tp >= 0) {
        // play the tapped land when the extra mana would not be spent this turn
        const castables = h.filter((c) => !isLand(c));
        const s0 = sumCost(castables, bestSubset(castables, budgetNow));
        const s1 = sumCost(castables, bestSubset(castables, budgetNow + 1));
        const cmdHelps =
          !cmdCast && budgetNow + 1 >= cmdMv && budgetNow < cmdMv;
        if (s1 === s0 && !cmdHelps) pick = tp;
      }
      const c = h[pick];
      h.splice(pick, 1);
      landsBF++;
      landPlayed = true;
      if (c.kind === KIND.tland) {
        enteredTapped++;
        return 0;
      }
      return 1;
    };

    let M = landsBF + rockMana + dorkMana;
    M += playLand(M);

    // cast loop
    for (let guard = 0; guard < 6; guard++) {
      // 1. free / mana-positive rocks (Moxen, Sol Ring)
      let again = true;
      while (again) {
        again = false;
        for (const c of h) {
          if (c.kind === KIND.rock && c.out >= c.cost && c.cost <= M) {
            takeFromHand(c);
            M += c.out - c.cost;
            rockMana += c.out;
            spent += c.cost;
            again = true;
            break;
          }
        }
      }
      // 2. commander as soon as it is affordable
      if (!cmdCast && M >= cmdMv) {
        M -= cmdMv;
        spent += cmdMv;
        cmdCast = true;
        cmdTurn = t;
      }
      // 3. remaining ramp, cheapest first
      again = true;
      while (again) {
        again = false;
        let best = null;
        for (const c of h)
          if (isRamp(c) && c.cost <= M && (!best || c.cost < best.cost))
            best = c;
        if (best) {
          takeFromHand(best);
          M -= best.cost;
          spent += best.cost;
          again = true;
          if (best.kind === KIND.rock) {
            M += best.out;
            rockMana += best.out;
          } else if (best.kind === KIND.dork) {
            dorkSick += best.out;
          } else {
            for (let k = 0; k < best.out; k++)
              if (fetchLand()) {
                landsBF++;
                if (best.tapped) enteredTapped++;
                else M++;
              }
            for (let k = 0; k < best.toHand; k++)
              if (fetchLand())
                h.push({
                  kind: KIND.land,
                  cost: 0,
                  out: 0,
                  n: 0,
                  tapped: false,
                  toHand: 0,
                  key: false,
                });
          }
        }
      }
      if (!cmdCast && M >= cmdMv) {
        M -= cmdMv;
        spent += cmdMv;
        cmdCast = true;
        cmdTurn = t;
      }
      // 4. spend the rest; resolve draw effects first and re-plan
      const items = h.filter((c) => !isLand(c) && !isRamp(c));
      const pick = bestSubset(items, M);
      const draws = pick.filter(
        (i) => items[i].kind === KIND.draw || items[i].kind === KIND.engine
      );
      if (draws.length > 0) {
        for (const i of draws) {
          const c = items[i];
          takeFromHand(c);
          M -= c.cost;
          spent += c.cost;
          if (c.kind === KIND.engine) engines++;
          else draw(c.n);
        }
        if (!landPlayed) M += playLand(M);
        continue; // re-plan with the new cards
      }
      for (const i of pick) {
        const c = items[i];
        takeFromHand(c);
        M -= c.cost;
        spent += c.cost;
      }
      if (!landPlayed) {
        const add = playLand(M);
        if (add > 0 || landPlayed) {
          M += add;
          continue;
        }
      }
      break;
    }

    spentTotal += spent;
    out.spent[t - 1] = spentTotal;
    out.lands[t - 1] = landsBF;
    out.mana[t - 1] = landsBF + rockMana + dorkMana + dorkSick; // sources at end of turn
  }
  out.cmdTurn = cmdTurn;
  out.firstKeyTurn = firstKeyTurn;
}

function sumCost(items, idx) {
  let s = 0;
  for (const i of idx) s += items[i].cost;
  return s;
}

// ─── Bucket statistics ─────────────────────────────────────────────────────
// For a given hand size and selection mode ("london" = best n of 7,
// "random" = n random cards, as the app currently does), simulate N kept
// hands and accumulate per-bucket outcome sums.
export const METRICS = [
  "land3T3", // >= 3 lands on the battlefield at end of turn 3
  "land4T4", // >= 4 lands at end of turn 4 (no missed land drop by T4)
  "miss2T4", // <= 2 lands at end of turn 4 (two or more missed drops)
  "mana4T3", // >= 4 mana sources at end of turn 3 (ramped)
  "mana6T5", // >= 6 mana sources at end of turn 5
  "cmdOnCurve", // commander cast on the turn equal to its mana value or earlier
  "cmdPlus1", // commander cast by turn MV + 1
  "keyInHand", // a key card (tutor, combo piece, engine) in the kept hand
  "keyByT2", // a key card seen by turn 2
  "mana3T1", // >= 3 mana sources at end of turn 1 (cEDH speed)
  "mana4T2", // >= 4 mana sources at end of turn 2
];

export function simulateBuckets(profile, size, mode, N, seed) {
  const rand = rng(seed);
  const deck = buildDeck(profile);
  const count = new Float64Array(N_BUCKETS);
  const spent = new Float64Array(N_BUCKETS * HMAX);
  const met = new Float64Array(N_BUCKETS * METRICS.length);
  const out = {
    spent: new Array(HMAX),
    lands: new Array(HMAX),
    mana: new Array(HMAX),
    cmdTurn: 0,
    firstKeyTurn: 0,
  };
  const cmdMv = profile.commanderMv;
  for (let g = 0; g < N; g++) {
    const d = deck.slice();
    shuffle(d, rand);
    let hand, library;
    if (mode === "random") {
      hand = d.slice(0, size);
      library = d.slice(size).reverse(); // top = last
    } else {
      const seven = d.slice(0, 7);
      const { keep, bottom } = londonKeep(seven, size);
      hand = keep;
      library = bottom.concat(d.slice(7).reverse()); // bottomed cards at the bottom
    }
    const f = features(hand);
    const b = bucketId(size, f);
    goldfish(hand, library, profile, out);
    count[b]++;
    for (let t = 0; t < HMAX; t++) spent[b * HMAX + t] += out.spent[t];
    const m = met.subarray(b * METRICS.length, (b + 1) * METRICS.length);
    m[0] += out.lands[2] >= 3;
    m[1] += out.lands[3] >= 4;
    m[2] += out.lands[3] <= 2;
    m[3] += out.mana[2] >= 4;
    m[4] += out.mana[4] >= 6;
    m[5] += out.cmdTurn <= cmdMv;
    m[6] += out.cmdTurn <= cmdMv + 1;
    m[7] += f.key > 0;
    m[8] += out.firstKeyTurn <= 2;
    m[9] += out.mana[0] >= 3;
    m[10] += out.mana[1] >= 4;
  }
  return { size, mode, N, count, spent, met };
}

// ─── Mulligan solver ───────────────────────────────────────────────────────
// stages: array of bucket-stat objects, in the order hands are seen.
// policy: 'optimal' or a function (features, stageIndex, size) -> keep?
// horizon: value = mana spent through this turn.
export function solve(stages, horizon, policy) {
  const S = stages.length;
  const Ev = new Array(S).fill(0);
  const keepSets = new Array(S);
  const pKeep = new Array(S).fill(0);
  // backward induction
  for (let i = S - 1; i >= 0; i--) {
    const st = stages[i];
    const next = i + 1 < S ? Ev[i + 1] : -Infinity;
    const keep = new Uint8Array(N_BUCKETS);
    let e = 0,
      pk = 0;
    for (let b = 0; b < N_BUCKETS; b++) {
      const n = st.count[b];
      if (n === 0) continue;
      const p = n / st.N;
      const v = st.spent[b * HMAX + horizon - 1] / n;
      let k;
      if (i === S - 1) k = true;
      else if (policy === "optimal") k = v >= next;
      else k = policy(decodeBucket(b), i, st.size);
      keep[b] = k ? 1 : 0;
      if (k) {
        e += p * v;
        pk += p;
      } else e += p * next;
    }
    Ev[i] = e;
    keepSets[i] = keep;
    pKeep[i] = pk;
  }
  // forward: probability of keeping at each stage and policy-weighted metrics
  const dist = new Array(S).fill(0);
  let reach = 1;
  const metrics = new Float64Array(METRICS.length);
  let keptSize = 0;
  const spentCurve = new Float64Array(HMAX);
  for (let i = 0; i < S; i++) {
    const st = stages[i];
    dist[i] = reach * pKeep[i];
    for (let b = 0; b < N_BUCKETS; b++) {
      const n = st.count[b];
      if (n === 0 || !keepSets[i][b]) continue;
      const w = (reach * (n / st.N)) / n; // reach * p(bucket) / count
      for (let m = 0; m < METRICS.length; m++)
        metrics[m] += w * st.met[b * METRICS.length + m];
      for (let t = 0; t < HMAX; t++)
        spentCurve[t] += w * st.spent[b * HMAX + t];
      keptSize += reach * (n / st.N) * st.size;
    }
    reach *= 1 - pKeep[i];
  }
  const m = {};
  METRICS.forEach((k, i) => (m[k] = metrics[i]));
  return {
    value: Ev[0],
    Ev,
    keepSets,
    dist,
    metrics: m,
    keptSize,
    spentCurve: Array.from(spentCurve),
  };
}

// Bucket value lookup helper for reporting keep tables.
export function bucketValue(st, b, horizon) {
  const n = st.count[b];
  return n === 0 ? null : st.spent[b * HMAX + horizon - 1] / n;
}

export { HMAX };
