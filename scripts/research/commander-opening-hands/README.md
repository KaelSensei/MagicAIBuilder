# Commander opening-hand model

Research tooling behind [`docs/product/guides/commander-mulligans-curves-and-play-style.md`](../../../docs/product/guides/commander-mulligans-curves-and-play-style.md). It is not product code: nothing in `src/` imports it, and it has no dependencies beyond Node 22.

It answers three questions for multiplayer Commander:

1. What is the free first mulligan (CR 103.5c) worth, and how much pickier should the first seven be because of it?
2. Which opening hands should be kept or mulliganed at each bracket and play style?
3. How flat is the land-count curve once mulligans are played well?

## Model in one paragraph

A 99-card deck plus a commander in the command zone is goldfished for ten turns. The model uses the London mulligan with the bottom choice, and the first mulligan is free in multiplayer: the sequence of hands is 7, free 7, 6, 5, 4. The starting player draws on turn 1 (CR 800.7). A game's value is the mana spent through a horizon turn chosen per bracket, which is Frank Karsten's goldfish metric. Hands are grouped by lands, cheap ramp (mana value 2 or less) and other plays of mana value 3 or less. Backward induction over those classes gives the optimal keep rule, and heuristic rules are scored the same way. The model has no opponents and no colours. See the guide's "The model" section for the assumptions and limits.

## Files

| File               | Purpose                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `model.mjs`        | Seeded PRNG, deck builder, London bottom choice, goldfish turn loop, per-class statistics, backward-induction solver                          |
| `profiles.mjs`     | Deck shells tuned to the 2026 per-bracket medians, plus aggro, big-mana and spellslinger variants of Bracket 3                                |
| `validate.mjs`     | Checks the model against exact hypergeometric odds and prints each profile's shape                                                            |
| `analyze.mjs`      | Mulligan systems compared (no mulligan, the app's current engine, 1v1 London, multiplayer), keep tables, horizon sweep, land sweeps for B2–B4 |
| `margins.mjs`      | Value of keeping each hand class minus the value of mulliganing, for the first seven, the free seven and 1v1                                  |
| `sweep-styles.mjs` | Land sweeps for B1, the Bracket 3 play-style variants and cEDH                                                                                |

## Running

```bash
cd scripts/research/commander-opening-hands
node validate.mjs                  # a few seconds; expects 0.780, 0.621 and 0.740
node analyze.mjs 250000            # about 7 minutes on one core
node margins.mjs 200000            # about 3 minutes
node sweep-styles.mjs 150000       # about 6 minutes
```

Results are written to `$OUT_DIR`, which defaults to `<os tmpdir>/commander-opening-hands`. Every random draw comes from a seeded mulberry32 generator, so rerunning with the same sample size reproduces the guide's tables exactly.
