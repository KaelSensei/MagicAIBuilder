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

## Trust, growth and the physical table — added 2026-11-09

Specs written on the evening of 2026-11-09 by separate writers, each from its own dated research. They cover what a public, paying product owes its users, the first run and its measurement, the phone and the store, the Commander variants, the physical cards a player stores, trades and sells, and the chat rooms where pods and creators meet. As above, the research notes are not committed, each spec links every external fact to its own source, and legal points are research, not legal advice. The roadmap gives them [their own part](../roadmap.md#trust-growth-and-the-physical-table). [I-40](i40-installable-app-and-card-scanning.md) asks the owner whether card scanning leaves the non-goal list; until then, "Card scanning stays a non-goal" above stands.

| Spec                                                                                    | Initiative | Status                                                      | The one-line reason it exists                                                                                                                   |
| --------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [Trust, safety and user rights](i38-trust-safety-and-user-rights.md)                    | I-38       | Next; gates public growth and the paid tier                 | No deckbuilder read publishes a DSA contact or a full export, and here a deleted account comes back on the next request                         |
| [First run, activation and measurement](i39-first-run-activation-and-measurement.md)    | I-39       | Next                                                        | A guest's deck is lost at sign-up, and I-30 cannot price what nobody can count; measurement stays first-party                                   |
| [Installable app and card scanning](i40-installable-app-and-card-scanning.md)           | I-40       | Later; slices 1–5 can ship now                              | Installing a web app is cheap; scanning is the main complaint in ManaBox's own reviews, so it waits for a benchmark and the owner               |
| [Store Commander nights](i41-store-commander-nights.md)                                 | I-41       | Later; slices 1–2 can ship now                              | EventLink records attendance and forms no pods; nobody pairs a night by declared and estimated bracket                                          |
| [Commander variants](i42-commander-variants-duel-cedh-pauper.md)                        | I-42       | Next for slices 1–6; Later for other variants               | No format can be chosen, Duel Commander lists land in Commander decks, and no French builder checks Duel Commander legality with a dated list   |
| [Physical collection and pull lists](i43-physical-collection-storage-and-pull-lists.md) | I-43       | Later; slices 1–5 could be promoted                         | Two products pair a deck with its box; none builds a pull list ordered by place or a put-back list                                              |
| [Trade lists within the pod](i44-trade-lists-within-the-pod.md)                         | I-44       | Later; slices 1–7 can ship now                              | No product builds wants from a deck's missing cards and haves from unused copies; nearby matching fails without density, so the pod comes first |
| [Selling spare cards](i45-selling-spare-cards.md)                                       | I-45       | Later; slices 0–3 can ship now                              | Sell tools start from a list the player made; only a deckbuilder knows which copies no deck uses, and the sale stays on the buyer's site        |
| [Discord and chat integrations](i46-discord-and-chat-integrations.md)                   | I-46       | Next for previews (slices 1–3); Later for feeds and the app | A deck link unfurls as a small thumbnail with no artist credit, other pages show no image, and no bot compares a pod's decks side by side       |

## Rules, access and the online table — added 2026-11-10

Seven specs written on 2026-11-10 by separate writers, each from its own dated research. They cover rules answers for a deck's cards, official changes that reach every saved deck, a display that works for colour-blind and low-vision players, exports to the tables where Commander is played online, cards lent within a pod, a feedback loop players can see, and deckbuilding challenges. As above, the research notes are not committed, each spec links every external fact to its own source, and legal points are research, not legal advice. The roadmap gives I-47 to I-50 [their own part](../roadmap.md#rules-access-and-the-online-table) and adds I-51 to I-53 to [Trust, growth and the physical table](../roadmap.md#trust-growth-and-the-physical-table).

| Spec                                                                                | Initiative | Status                                                      | The one-line reason it exists                                                                                                                              |
| ----------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Rules answers for this deck](i47-rules-answers-for-this-deck.md)                   | I-47       | Next for slices 1–7; Later for reviewed notes               | Rulings per card are table stakes; nobody links a card's keywords to versioned rules, and no model may answer, so the product cites, versions and declines |
| [Official changes reach every deck](i48-official-changes-reach-every-deck.md)       | I-48       | Next for slices 1–8, before the next Commander announcement | A saved deck keeps the flags it had when each card was added, and no deckbuilder tells an owner which decks an announcement changed                        |
| [Colour vision and low-vision display](i49-colour-vision-and-low-vision-display.md) | I-49       | Next; never paid                                            | Status colours fail contrast in the light theme and charts rely on hue alone; no deckbuilder says its charts were checked for colour blindness             |
| [Play this deck online](i50-play-this-deck-online.md)                               | I-50       | Next for slices 0–8; Later for webcam aids                  | The shipped MTGO export writes no real card IDs and XMage rejects it; no deckbuilder builds a Tabletop Simulator object or warns what a platform lacks     |
| [Cards lent and borrowed](i51-cards-lent-and-borrowed.md)                           | I-51       | Later; slices 1–6 could be promoted                         | Players track loans on paper slips and binders named after a friend; no deckbuilder lets a loan change what a deck counts as owned                         |
| [A feedback loop players can see](i52-feedback-loop-players-can-see.md)             | I-52       | Next for slices 0–8; Later for the board                    | A player cannot report a bug or see what reached production, and no monitor watches the site                                                               |
| [Monthly deckbuilding challenges](i53-monthly-deckbuilding-challenges.md)           | I-53       | Later; slices 1 and 5–8 could be promoted                   | Archidekt's monthly contest draws about a thousand decks and checks briefs by hand; nobody freezes an entry or publishes its check report                  |

## Discipline

A spec is a plan, not a record. It does not mark anything shipped — the roadmap's `Status` and its scope checkboxes remain the only source of truth for what exists. Competitor rows are claims read from public pages on a stated date, not evidence; revalidate before a row justifies implementation.
