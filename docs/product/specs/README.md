# Functional specs

One spec per roadmap initiative. The [roadmap](../roadmap.md) says _what_ an initiative must achieve and _why_; a spec here says what it does in detail, what the market already does, what the code looks like today, and how the work splits into slices an agent or a developer can pick up without making a product decision.

Written on 2026-11-08 from a market sweep of the whole category, not only the named incumbents, and from the code as it stood on `dev` that day.

## How to read one

Every spec follows the same shape, matching the house format already used by [`commander-power-meter.md`](../commander-power-meter.md):

**Overview** · **What the market does** (sourced, dated) · **Current state in this codebase** (verified paths) · **Functional requirements** (numbered, testable) · **Data and API** · **Non-goals** · **Testing strategy** · **Delivery slices** (with dependencies) · **Open questions**

The **Delivery slices** table is the part that matters for automation: each slice is independently reviewable, and the dependency column says which ones cannot start yet. Three scheduled agents pick work from this roadmap every day — the dependency edges are what stop them colliding.

## Committed work

| Spec                                                                                      | Initiative | Status | The one-line reason it exists                                                                                                                             |
| ----------------------------------------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Checkable AI copilot](i02-checkable-ai-copilot.md)                                       | I-02       | Now    | Competitors validate **or** explain; doing both visibly is the cheapest differentiator on the roadmap                                                     |
| [Visual direction](i13-visual-direction.md)                                               | I-13       | Next   | The audit, the measured failures, and the register chosen over the fantasy one                                                                            |
| [Verifiable natural-language search](i14-verifiable-natural-language-search.md)           | I-14       | Next   | Showing the query is already table stakes; deck context and French are not                                                                                |
| [Rule 0 sheets and pod profiles](i15-rule-zero-sheets-and-pod-profiles.md)                | I-15       | Next   | Everyone classifies a deck; nobody records what four people agreed                                                                                        |
| [Decks buildable from a collection](i16-decks-buildable-from-a-collection.md)             | I-16       | Next   | Four products rank by coverage; none excludes copies already committed elsewhere                                                                          |
| [Precon path and tiered upgrades](i17-precon-path-and-tiered-upgrades.md)                 | I-17       | Next   | The market publishes upgrade articles; none is a reversible operation on your list                                                                        |
| [Per-deck radar of new cards](i18-per-deck-radar-of-new-cards.md)                         | I-18       | Later  | Spoiler coverage is universal and entirely set-centric; the per-deck join is open                                                                         |
| [Offline game-night viewing](i19-offline-game-night-viewing.md)                           | I-19       | Next   | Competitors ship offline card databases; the one deck you are about to play is the honest slice                                                           |
| [Collaborative review](i20-collaborative-review.md)                                       | I-20       | Later  | Archidekt gives collaborators direct write access; propose-and-accept exists nowhere                                                                      |
| [Reproducible probability bench](i21-reproducible-probability-bench.md)                   | I-21       | Later  | Several tools simulate hands and two are reproducible (EDHTuner, mtg-mcp-server); none shows an interval or says when a difference is not distinguishable |
| [Commander deckbuilding guide by bracket](i28-commander-deckbuilding-guide-by-bracket.md) | I-28       | Next   | Wizards publishes rules, sites publish advice or numbers; nobody labels the evidence, and nobody in French                                                |

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

- **Tournament win rates stay blocked, by licence rather than by missing data.** _Corrected 2026-11-09._ This entry said EDHTop16 publishes no win rates, no match-level results and no public API. In fact EDHTop16 computes a win rate (wins divided by wins, losses and draws) and shows each entry's record, and its GraphQL endpoint answers only persisted queries, so it is still not a usable public API ([`llms.txt`](https://edhtop16.com/llms.txt), checked 2026-11-09). The match-level data, with seat order and each table's winner, sits upstream at TopDeck.gg, whose [Developer Terms](https://topdeck.gg/developer-terms), effective 2026-10-27, forbid commercialising API data (§7). MagicMeta and LucidPuzzle derive their tiers from EDHTop16. The roadmap's block stands, now for the right reason; I-09 carries the detail.
- **Card scanning** stays a non-goal: ManaBox owns it, it is a native-camera capability, and I-06 defers it behind printing-level ownership regardless.
- **A table companion** — life totals, commander damage, timers — is already served by Discord bots and the official app, and is a different product. [I-35](i35-pod-game-log.md), added on 2026-11-09, logs a result after the game and is not a table companion.
- **Marketplace and checkout** remain excluded. I-06 hands off to sellers; it does not become one. [I-32](i32-seller-handoff-and-affiliate-carts.md) sends a list to the seller's own cart, and [I-33](i33-marketplace-ladder.md) records the stage at which the owner could decide otherwise.

### Why six

Beyond these, the sweep stopped producing gaps this product is positioned to fill. Further initiatives would be invention, which fills a roadmap without filling a pipeline. Extending 2027 further is the job of another dated sweep, not a longer list.

## What the sweep concluded

Three findings shaped every spec above.

**Generation is commoditised; verification is not.** Six products sell conversational Commander building, several free. One of them documents that its own results vary between runs. What no competitor publishes is which claims were checked against card data and which are model reasoning.

**The collection-to-deck direction is crowded; the ownership detail is not.** SuperBrew, DeckFinder, ManaBuilder, MTG Agents and ManaForge all rank decks by collection coverage. None states that a copy already committed to another of your decks is excluded, and none separates Oracle identity (for legality) from printing identity (for price).

**Reproducibility is absent across the whole category.** Hand simulators, bracket calculators and AI builders all return a number without a seed, an interval or a sample size. For a product positioning itself on checkable output, that is the widest opening found in the sweep. _Corrected 2026-11-09:_ two tools are reproducible. EDHTuner replays the same paired seeds for the same deck, and the open-source mtg-mcp-server takes a `seed`. None found shows an interval with its sample size or says when a difference is not distinguishable, which is the opening that remains for [I-21](i21-reproducible-probability-bench.md) and [I-31](i31-deck-lab.md).

## Business, reference and depth — added 2026-11-09

Eight initiatives from a dated research pass on the owner's goals, stated on 2026-11-09: be one of the deckbuilding references, with more information than EDHREC and an editor more complete than Moxfield; turn the product into a cheap SaaS that pays a decent living; and perhaps become a recognised marketplace. Each goal was tested against traffic estimates, paid tiers, affiliate and data terms, EU and French law, player demand and the code on `dev`, and the [roadmap's Product Direction](../roadmap.md#owner-ambition-and-business-model-2026-11-09) summarises what the research found. The research notes are not committed, so each spec links every external fact to its own source; legal points in them are research, not legal advice. Unlike the 2027 horizon, five of these are Next in whole or in part, so the roadmap gives them [their own section](../roadmap.md#business-reference-and-depth).

| Spec                                                                            | Initiative | Status                                | The one-line reason it exists                                                                                                               |
| ------------------------------------------------------------------------------- | ---------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [Business model and the paid tier](i30-business-model-and-paid-tier.md)         | I-30       | Next, behind a decision gate          | Rivals sell ad removal or AI credits; card data cannot be sold, so only usage and personal tools can, and a lawyer answers first            |
| [Deck Lab](i31-deck-lab.md)                                                     | I-31       | Next                                  | Every simulator uses a hand-written keep rule; none solves the keep table for your list or shows an interval                                |
| [Seller handoff and affiliate carts](i32-seller-handoff-and-affiliate-carts.md) | I-32       | Next                                  | Buy buttons are everywhere; none sends exact printings net of copies owned across decks, priced in your market, with the affiliate labelled |
| [The marketplace ladder](i33-marketplace-ladder.md)                             | I-33       | Parked: owner decision                | Deckbuilders partner with marketplaces and none runs one; the record names the rung that would reverse the non-goal                         |
| [Commander data reports](i34-commander-data-reports.md)                         | I-34       | Next without the index; Later with it | EDHREC publishes popularity; nobody publishes declared against estimated brackets or per-bracket norms with their n, and nobody in French   |
| [Pod game log](i35-pod-game-log.md)                                             | I-35       | Later                                 | Trackers count wins at scale; none ties a result to the deck version played or to what the pod declared                                     |
| [Creator and embed toolkit](i36-creator-and-embed-toolkit.md)                   | I-36       | Later                                 | The social layer here evaluates; creators need one that broadcasts: embeds, link previews, view counts, video in primers                    |
| [Editor depth](i37-editor-depth.md)                                             | I-37       | Next                                  | Archidekt ships editor depth every few months; views, sticky groups, tags, text bulk edit and history are what players compare              |

Two boundaries hold across all eight. Card data, fan content and the evidence a result shows stay free, under the Wizards Fan Content Policy and Scryfall's terms, so a paid tier can sell only usage and personal tools, and only after I-30's legal gate; every other spec names its paid-tier candidate and leaves the decision to I-30. The roadmap's non-goal "full card-trading marketplace" stays in force: I-32 builds the rungs that fit it, and I-33 records the one that would reverse it.

## Discipline

A spec is a plan, not a record. It does not mark anything shipped — the roadmap's `Status` and its scope checkboxes remain the only source of truth for what exists. Competitor rows are claims read from public pages on a stated date, not evidence; revalidate before a row justifies implementation.
