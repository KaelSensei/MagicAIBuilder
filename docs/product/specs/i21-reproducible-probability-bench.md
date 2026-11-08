# Spec: Reproducible Probability Bench (I-21)

> **Initiative:** [I-21 in the roadmap](../roadmap.md) · **Status:** Later · **Researched:** 2026-11-08
> **Owns:** seeded, comparable simulation between two snapshots. **Does not own:** recorded goldfish logs and player-authored comparisons, which stay in I-07.

## Overview

"Did that change actually make the deck more consistent?" is currently answered by feel. This bench answers it with a seeded sample: simulate thousands of hands for two snapshots under a stated mulligan policy, report colour availability and land drops on turns 2 to 5 with intervals, and **reproduce the same numbers on a rerun**.

## What the market does

Hand-probability tools are abundant and technically competent.

| Product                        | Method                                              | Reported output                                                         |
| ------------------------------ | --------------------------------------------------- | ----------------------------------------------------------------------- |
| **ManaTap** mulligan simulator | Thousands of iterations                             | Keep rates for 7, 6 and 5 cards                                         |
| **ScrollVault** hand simulator | WebAssembly engine, ~50 000 hands in the background | Running statistics over generated hands                                 |
| **MyDeckStats**                | Exact combinatorics **plus** Monte Carlo            | Opening-hand and mulligan odds, curve behaviour over thousands of games |
| **KrakenTheMeta**              | Hypergeometric calculator                           | London mulligan opening-hand odds                                       |
| **Deckstats**, **Archidekt**   | Multi-turn hand odds                                | Named as the references in the roadmap                                  |

**What none of them states.** Reading all five on 2026-11-08, none advertises:

1. **A published seed.** Rerun any of them and the numbers move. A player cannot quote a result and have a friend reproduce it.
2. **A two-snapshot comparison with a statistical verdict.** They measure one list. Measuring whether version B is _distinguishably_ better than version A is the question a deckbuilder actually has.
3. **Intervals.** A keep rate of 71 % from 1 000 hands and from 50 000 hands are different claims; none of them says which.

Those three are the initiative, and they align exactly with the product's "AI you can check" positioning: a number you can reproduce and whose uncertainty is stated.

## Current state in this codebase

- `src/lib/playtest/` — `analytics.ts`, `comparison.ts`, `ai-context.ts`, `action-log-export.ts`. Snapshot-linked sessions, a deterministic comparison engine, cohort-size disclosure and early-signal guidance already exist (I-07).
- Opening-hand evidence already distinguishes land balance from immediate castability and surfaces missing colours and dead hands.
- **Missing:** any seeded RNG, any Monte Carlo loop, and any statistical comparison between two samples.

The disclosure habits this initiative needs are therefore already in the codebase; the mathematics is not.

## Functional requirements

### 1. Seeded and reproducible

1.1 Every run records its **seed**, sample size, mulligan policy and the two snapshot ids.
1.2 Rerunning with the same recorded inputs reproduces the reported intervals **exactly**. This is the acceptance criterion of the whole initiative.
1.3 The seed is visible and copyable, so a result can be quoted and checked by someone else.
1.4 The shuffler is a seeded PRNG committed in the repo. `Math.random()` is never used in the bench.

### 2. What is measured

2.1 Colour availability and land drops on turns 2, 3, 4 and 5.
2.2 Keep rate per hand size under the stated mulligan policy.
2.3 Each reported figure carries a confidence interval derived from the sample size.
2.4 Assumptions are listed on screen: no opponent interaction, no decisions beyond the mulligan policy, no mana-ability optimisation beyond a stated rule.

### 3. The mulligan policy is explicit

3.1 The policy is chosen from a small, named set — for example "keep 2 to 5 lands", "London to 6 then keep" — never implicit.
3.2 The policy is recorded with the run and shown with the result.
3.3 Changing the policy invalidates the comparison between two existing runs; the UI says so rather than silently comparing across policies.

### 4. Comparison between two snapshots

4.1 Two snapshots are simulated under the same seed, sample size and policy.
4.2 The result reports the difference per metric **with a statistical comparison**, not two numbers side by side.
4.3 A difference inside the interval is reported as **not distinguishable at this sample size**, with the sample size that would be needed. This is the most important sentence the feature will produce.

### 5. Bounded compute

5.1 Sample size is capped per run, and the cap is stated.
5.2 Simulation runs where it does not block the interface; a long run reports progress and can be cancelled.

## Non-goals

- An AI opponent, or any opponent at all.
- A full Magic rules engine. No triggers, no stack, no targeting.
- Replacing I-07's action logs or player-authored snapshot comparisons. This bench is evidence beside them, not instead of them.
- Optimising play decisions. The bench measures what the deck draws, not how well it is piloted.

## Testing strategy

- **Reproducibility:** the same seed, size and policy produce byte-identical reported intervals across two runs and across processes. This test is the specification.
- **Statistical:** a deck with 40 lands and one with 30 compare as distinguishable; two shuffles of the same list compare as not distinguishable. Testing the summary, not a single hand, is explicitly required by the roadmap.
- **Boundary:** sample size at the cap, and a cancelled run leaving no partial result recorded.
- **Honesty:** a difference inside the interval renders the "not distinguishable" message and the required sample size.

## Delivery slices

| #   | Slice                                                                  | Depends on |
| --- | ---------------------------------------------------------------------- | ---------- |
| 1   | Seeded PRNG and shuffler, with the reproducibility test                | —          |
| 2   | Single-snapshot simulation: keep rate, land drops, colour availability | 1          |
| 3   | Intervals from sample size, and the assumptions panel                  | 2          |
| 4   | Named mulligan policies, recorded with the run                         | 2          |
| 5   | Two-snapshot comparison with the statistical verdict                   | 3, 4       |
| 6   | Compute cap, progress and cancellation                                 | 2          |

Slice 1 alone is worth shipping: a committed seeded shuffler is reusable by I-07's goldfish engine and makes its existing evidence reproducible too.

## Open questions

- Where does the simulation run? The client keeps the server cheap and matches ScrollVault's WebAssembly approach; the server makes a result quotable by URL. A quotable seed argues for the server, which is the differentiator.
- Which statistical test? A two-proportion comparison is enough for keep rates, but land-drop curves across four turns invite multiple-comparison error. Pick one and state it on screen rather than reporting four independent verdicts.
- Is "not distinguishable at this sample size" acceptable product copy, or will it read as the tool failing? It is the honest answer and the reason the feature exists — but it needs wording that reads as rigour rather than as an error.
