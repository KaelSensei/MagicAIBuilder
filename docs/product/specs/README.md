# Functional specs

One spec per roadmap initiative. The [roadmap](../roadmap.md) says _what_ an initiative must achieve and _why_; a spec here says what it does in detail, what the market already does, what the code looks like today, and how the work splits into slices an agent or a developer can pick up without making a product decision.

Written on 2026-11-08 from a market sweep of the whole category, not only the named incumbents, and from the code as it stood on `dev` that day.

## How to read one

Every spec follows the same shape, matching the house format already used by [`commander-power-meter.md`](../commander-power-meter.md):

**Overview** · **What the market does** (sourced, dated) · **Current state in this codebase** (verified paths) · **Functional requirements** (numbered, testable) · **Data and API** · **Non-goals** · **Testing strategy** · **Delivery slices** (with dependencies) · **Open questions**

The **Delivery slices** table is the part that matters for automation: each slice is independently reviewable, and the dependency column says which ones cannot start yet. Three scheduled agents pick work from this roadmap every day — the dependency edges are what stop them colliding.

## Committed work

| Spec                                                                                      | Initiative | Status | The one-line reason it exists                                                                              |
| ----------------------------------------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| [Checkable AI copilot](i02-checkable-ai-copilot.md)                                       | I-02       | Now    | Competitors validate **or** explain; doing both visibly is the cheapest differentiator on the roadmap      |
| [Visual direction](i13-visual-direction.md)                                               | I-13       | Next   | The audit, the measured failures, and the register chosen over the fantasy one                             |
| [Verifiable natural-language search](i14-verifiable-natural-language-search.md)           | I-14       | Next   | Showing the query is already table stakes; deck context and French are not                                 |
| [Rule 0 sheets and pod profiles](i15-rule-zero-sheets-and-pod-profiles.md)                | I-15       | Next   | Everyone classifies a deck; nobody records what four people agreed                                         |
| [Decks buildable from a collection](i16-decks-buildable-from-a-collection.md)             | I-16       | Next   | Four products rank by coverage; none excludes copies already committed elsewhere                           |
| [Precon path and tiered upgrades](i17-precon-path-and-tiered-upgrades.md)                 | I-17       | Next   | The market publishes upgrade articles; none is a reversible operation on your list                         |
| [Per-deck radar of new cards](i18-per-deck-radar-of-new-cards.md)                         | I-18       | Later  | Spoiler coverage is universal and entirely set-centric; the per-deck join is open                          |
| [Offline game-night viewing](i19-offline-game-night-viewing.md)                           | I-19       | Next   | Competitors ship offline card databases; the one deck you are about to play is the honest slice            |
| [Collaborative review](i20-collaborative-review.md)                                       | I-20       | Later  | Archidekt gives collaborators direct write access; propose-and-accept exists nowhere                       |
| [Reproducible probability bench](i21-reproducible-probability-bench.md)                   | I-21       | Later  | Five tools simulate thousands of hands; none publishes a seed or an interval                               |
| [Commander deckbuilding guide by bracket](i28-commander-deckbuilding-guide-by-bracket.md) | I-28       | Next   | Wizards publishes rules, sites publish advice or numbers; nobody labels the evidence, and nobody in French |

I-28 was added after the sweep above, on the owner's request, from its own dated research. Its content lives in [`../guides/commander-deckbuilding-by-bracket.md`](../guides/commander-deckbuilding-by-bracket.md).

## 2027 horizon

Six initiatives extending the pipeline into 2027, each from a verified gap in the same sweep. They are hypotheses with a stated basis, not commitments: a 2027 initiative is promoted to Next only once its open questions are answered and its dependency has shipped. Their specs are deliberately less detailed than the ones above — committing to interface details eighteen months early produces precision that ages rather than guides.

| Spec                                                                              | Initiative | The gap it answers                                                                                                                 |
| --------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| [Verification as a public surface](i22-verification-as-a-public-surface.md)       | I-22       | Six products generate decks; none publishes a verification contract                                                                |
| [The pod's own surface](i23-the-pods-own-surface.md)                              | I-23       | Three Discord bots answer bracket questions; none carries a pod's declared agreement                                               |
| [Decks a screen reader can play from](i24-decks-a-screen-reader-can-play-from.md) | I-24       | Blind players adapt cards with NFC tags; no deckbuilder emits output shaped to be heard                                            |
| [A third locale, chosen on evidence](i25-a-third-locale.md)                       | I-25       | Every AI deckbuilder found is English-only; nine catalogues sit dormant here                                                       |
| [Collections arriving from elsewhere](i26-collections-arriving-from-elsewhere.md) | I-26       | Scanning is a non-goal, so import is the only honest way a collection gets populated                                               |
| [Learning while building](i27-learning-while-building.md)                         | I-27       | Tools assume the vocabulary; teaching lives in video. Nobody explains a rule when it fires                                         |
| [Cross-site Commander deck index](i29-cross-site-deck-index.md)                   | I-29       | EDHREC aggregates by partnership, and the big deck sites forbid crawling; no one offers card include/exclude search across sources |

I-29 was added on 2026-11-09, after the sweep and at the owner's request, from its own dated research into source terms, EU and French law, and scale. Its research notes are not committed, so the spec links every external fact to its own source.

### What the sweep ruled out for 2027

Recorded so the next pass does not re-derive them:

- **Tournament win rates stay blocked.** EDHTop16, the most promising candidate, publishes commander meta share and entry counts — **no win rates, no match-level results, no public API**. MagicMeta and LucidPuzzle derive their tiers from it. The roadmap's existing block stands.
- **Card scanning** stays a non-goal: ManaBox owns it, it is a native-camera capability, and I-06 defers it behind printing-level ownership regardless.
- **A table companion** — life totals, commander damage, timers — is already served by Discord bots and the official app, and is a different product.
- **Marketplace and checkout** remain excluded. I-06 hands off to sellers; it does not become one.

### Why six

Beyond these, the sweep stopped producing gaps this product is positioned to fill. Further initiatives would be invention, which fills a roadmap without filling a pipeline. Extending 2027 further is the job of another dated sweep, not a longer list.

## What the sweep concluded

Three findings shaped every spec above.

**Generation is commoditised; verification is not.** Six products sell conversational Commander building, several free. One of them documents that its own results vary between runs. What no competitor publishes is which claims were checked against card data and which are model reasoning.

**The collection-to-deck direction is crowded; the ownership detail is not.** SuperBrew, DeckFinder, ManaBuilder, MTG Agents and ManaForge all rank decks by collection coverage. None states that a copy already committed to another of your decks is excluded, and none separates Oracle identity (for legality) from printing identity (for price).

**Reproducibility is absent across the whole category.** Hand simulators, bracket calculators and AI builders all return a number without a seed, an interval or a sample size. For a product positioning itself on checkable output, that is the widest opening found in the sweep.

## Discipline

A spec is a plan, not a record. It does not mark anything shipped — the roadmap's `Status` and its scope checkboxes remain the only source of truth for what exists. Competitor rows are claims read from public pages on a stated date, not evidence; revalidate before a row justifies implementation.
