# MagicAIBuilder: Product Roadmap

> **Updated:** 2026-11-10 (after midnight, Paris time)

> **North star:** help a Commander player go from an idea to a legal, explainable, testable and enjoyable deck.

This roadmap is organized by **product initiatives**, not by an arbitrary split between functional and technical work. Every initiative contains the user outcome, the product scope, the engineering enablers, and its definition of done.

---

## Product Direction

MagicAIBuilder is an **AI-first Commander deckbuilding companion**.

It should not try to beat every competitor at their strongest specialty:

- **Moxfield** is the benchmark for a fast deck workflow, sharing and deck presentation.
- **Archidekt** is the benchmark for a visual editor, custom organization, playtesting and collaboration.
- **EDHREC** is the benchmark for aggregate Commander data. Its October–November 2026 redesign made that data easier to filter and explain. It is still a statistical reference, not a personal editor with versioning and playtesting.
- **ManaBox** is the benchmark for mobile collection management, scanning and offline search.
- **DeckCheck** and **Farseek** already sell conversational Commander assistance. A language model is not an empty market.
- **Commander Spellbook** is the benchmark for structured Commander combo discovery.
- **ManaTap, Farseek and mtgcommander.ai** are the benchmark for conversational generation. They shipped it during 2026 with free entry tiers, so the presence of AI is no longer an edge; validated, explainable output is. MTG Master, listed here on 2026-11-08, could not be found on 2026-11-09.

Our opportunity is the workflow between those products:

1. The player states an intention, budget and desired power level.
2. MagicAIBuilder turns it into a legal and coherent deck proposal, or into a Scryfall query the player can read before it runs.
3. Every important choice is explained with card data, sample limits and Commander rules.
4. The player tests the deck with evidence that can be reproduced, sees what is weak, and iterates.
5. The final list is easy to own, print, share, export and buy, with prices labeled as estimates.

**Positioning sentence:**

> Build the deck you mean, understand why it works, test it before game night.

The defensible loop is intention, a legal list, traceable explanations, reproducible tests and an informed purchase. Trust and continuity of that loop matter more than adding another chatbot. Detail is in [`competitive-landscape.md`](./competitive-landscape.md).

### Owner ambition and business model (2026-11-09)

On 2026-11-09 the owner stated these goals:

1. Be one of the deckbuilding references: more information than EDHREC, and software more beautiful and more complete than Moxfield.
2. Turn the product into a SaaS, even a very cheap one, that pays a decent living. The competition is almost free and its premium tiers add little, so paid features have to be worth paying for.
3. Build the largest cross-site index, so that a player can find decks and data from EDHREC, Moxfield, Archidekt and every other viable source from MagicAIBuilder. This is [I-29](#i-29-cross-site-commander-deck-index).
4. Possibly become a marketplace recognised like Cardmarket or TCGplayer.

A dated research pass on the same day tested each goal. Traffic figures below are third-party modelled estimates, not site analytics. Sources are in [`competitive-landscape.md`](./competitive-landscape.md#10-additions-from-the-9-november-2026-pass).

**What the research says**

- **A reference is a habit, not a search ranking.** Semrush estimates September 2026 visits at about 22.7 million for Scryfall, 18.2 million for Moxfield, 15.8 million for EDHREC, 8.3 million for Archidekt, 6.5 million for MTGGoldfish, 1.2 million for TappedOut and 0.25 million for EDHTop16. Similarweb put EDHREC ahead of Moxfield in October 2026, so treat those two as tied. Direct visits are 47–79% of every site's traffic, and each site's top search keywords are its own name. None of them grew mainly through search. EDHREC owns its data supply through Moxfield and Archidekt and shares an owner, Space Cow Media, with Archidekt and Commander Spellbook. Moxfield gained when the cEDH Decklist Database and the PlayEDH Discord stopped accepting TappedOut links in 2020. Creators amplified EDHREC early, and Scryfall became infrastructure through a free API.
- **"More information than EDHREC" has to mean better method, not new categories.** Bracket filters, per-bracket deck ratios and per-commander mulligan splits already exist, mostly built on self-declared brackets and without stated samples. Nothing found publishes declared against estimated brackets, per-bracket norms with their sample size, simulated keep rates by bracket, deck freshness, price by bracket or combo density by bracket, and nothing comparable exists in French. Google's spam policy allows programmatic pages that carry original computed data, and names scaled AI-written, scraped or machine-translated pages as abuse.
- **"More complete than Moxfield" is mostly editor depth and broadcast sharing.** Archidekt shipped visible editor changes in every 2026 development update, and Moxfield previewed an editor redesign to Patreon members on 28 September 2026. MagicAIBuilder is ahead on edit recovery, packages, comparison, export breadth, validated AI, playtest evidence, cross-deck acquisition planning and a public API. It is behind on Stacks, Table and Text views, sticky categories, global and Oracle tags, text bulk edit, foil on deck cards, a mobile toolbar, embeds and view counts. Players now also call out interfaces that look AI-made.
- **Players pay for tools, not for reference data.** Free reference sites sell ad removal for about 2 USD a month through Patreon, which is a donation rather than a product. Subscriptions at about 3–8 USD a month, or 30–50 USD a year, sell AI usage beyond a free allowance, capacity, price intelligence, collection-aware building, personal statistics and early access. Paywalls on how many decks or binders a player may keep draw one-star reviews.
- **"Content free, tools paid" is a legal constraint, not only a market pattern.** The Wizards Fan Content Policy (last updated 2017-11-15) forbids requiring payments, subscriptions or email registration to access fan content, and allows ads, sponsorships and donations. Scryfall's API terms forbid paywalling Scryfall data and require that card data stay reachable anonymously or with a free account. Paid MTG tools sell quotas, storage and computation, and none was found explaining publicly how that fits the policy. It is tolerated practice, not a Wizards ruling, so legal review gates any billing.
- **A cheap plan keeps about two thirds of its price.** A merchant of record such as Paddle or Lemon Squeezy charges 5% + 50¢ per transaction and handles VAT filing. Computed with French VAT at 20%: a 3.99 EUR monthly plan nets about 2.63 EUR and a 29.99 EUR yearly plan about 23 EUR. The copilot's model cost is affordable at that price only with a monthly quota, which does not exist yet (I-02, I-05).
- **Marketplaces court deckbuilders; deckbuilders have not become marketplaces.** Mana Pool reached Archidekt, EDHREC, Moxfield (a buy button since 30 May 2025) and mtgcommander.ai, an AI builder that sends a generated deck to a Mana Pool cart in one click. Affiliate programmes pay a few percent: Mana Pool pays 5% of a referred first sale. Seller data is closing: TCGplayer grants no new API keys and Cardmarket accepts no API applications. Running a marketplace switches on the Digital Services Act, consumer-law seller disclosure, DAC7 reporting, product-safety duties and payment licensing. At a 5% take rate each million euros of sales yields about 50,000 EUR before costs, and Cardmarket had more than 80 staff in February 2026.
- **AI is a liability on r/EDH unless it is checkable and disclosed.** A December 2025 post telling players not to use AI for deck suggestions or rules reached 729 points. Every 2025–2026 r/EDH post with "ChatGPT" in its title sits at zero, new builders advertise that they do not use AI, and "was AI used?" is now a top comment under launches. Lead with verified outcomes, and keep the product useful with the copilot switched off. Whether the "AI-first" wording at the top of this section should stay is the owner's call.

**How the new initiatives answer the goals**

- [I-30](#i-30-business-model-and-the-paid-tier) decides what is paid, at what price and after which legal review, before any billing code (goal 2).
- [I-31](#i-31-deck-lab-analysis-run-on-your-own-list) runs seeded analyses on the player's own list with stated samples and intervals, a candidate paid tool (goals 1 and 2).
- [I-32](#i-32-seller-handoff-affiliate-links-and-buy-this-deck-carts) builds stages 1 to 3 of the marketplace ladder: disclosed affiliate links, a regional price source and buy-this-deck carts on the seller's site (goals 2 and 4).
- [I-33](#i-33-the-marketplace-ladder-decision-record) records the marketplace ambition, the staged path and the stage that would reverse the non-goal, for the owner to decide (goal 4).
- [I-34](#i-34-commander-data-reports-and-indexable-data-pages) publishes the Commander statistics nobody publishes, each with its method and sample size (goal 1).
- [I-35](#i-35-pod-game-log-and-casual-results) attaches a post-game result to a deck version and the pod's declared intent (goal 1).
- [I-36](#i-36-creator-and-embed-toolkit) gives creators embeds, view counts and a deck link worth posting (goals 1 and 3).
- [I-37](#i-37-editor-depth-against-moxfield-and-archidekt) closes the editor gaps against Moxfield and Archidekt, cheapest visible wins first (goal 1).

A further pass on the same evening looked at what a paying, growing product needs around the deckbuilder, at the physical cards on the table, and at the chat rooms where pods meet. It added I-38 to I-46, in [Trust, Growth And The Physical Table](#trust-growth-and-the-physical-table):

- [I-38](#i-38-trust-safety-and-user-rights) builds the legal and safety floor a public platform and a paid tier need: reporting, statements of reasons, blocking, legal pages, deletion and export (goal 2).
- [I-39](#i-39-first-run-activation-and-product-measurement) stops the first run losing players and measures activation and retention in our own database, which is the evidence I-30 needs before a price (goal 2).
- [I-40](#i-40-installable-app-phone-first-use-and-card-scanning) makes the site installable and tests it at phone size, and puts camera scanning behind a benchmark and the owner's decision (goal 1).
- [I-41](#i-41-store-commander-nights-and-organiser-tools) gives stores pods by declared and estimated bracket, with a store plan as an I-30 candidate (goals 1 and 2).
- [I-42](#i-42-commander-variants-duel-commander-cedh-pauper-commander-and-others) makes formats choosable and ships Duel Commander, with dated banned lists (goal 1).
- [I-43](#i-43-physical-collection-storage-places-deck-boxes-and-pull-lists) says where each physical copy is, with pull and put-back lists (goals 1 and 2).
- [I-44](#i-44-trade-lists-within-the-pod-and-nearby-players) and [I-45](#i-45-selling-spare-cards-collection-value-buylists-and-seller-exports) turn the collection into trade lists and seller files, with no money through the product (goals 2 and 4).
- [I-46](#i-46-discord-and-chat-integrations-for-pods-and-creators) makes deck links unfurl well in Discord and other chat apps, then brings deterministic deck commands to Discord without reading the conversation (goal 1).

### Strategic boundaries

- Do not become a generic card database; Scryfall already owns that job.
- Do not copy EDHREC's popularity rankings as if popularity were advice.
- Do not treat inclusion or Lift as a win rate. Lift needs its reference denominator. The top-20 feed is not enough to calculate one.
- Do not call an LLM for deterministic legality, color identity, quantities or bracket rules.
- Do not hide a generated Scryfall query. Natural-language search shows the query, then runs that query.
- Do not expand formats, languages or integrations faster than their tests and data contracts can support.
- Do not add a new external service unless it solves a user-visible problem and has an exit path.
- Do not paywall card data, fan content or the evidence the product shows. A paid tier sells usage and personal tools, and only after the legal review in I-30.

### Competitive functional benchmark — 2026-11-08

The comparison tracks workflows rather than feature counts. Prices, sources and the EDHREC redesign notes live in [`competitive-landscape.md`](./competitive-landscape.md). Two older conclusions are retired. Packages, public comparison, published primers and downloadable playtest logs, which the 2026-09-19 pass still listed as missing, are checked under I-07 and I-08. Conversational Commander building, which the March 2026 landscape called an empty market, is sold by DeckCheck and Farseek.

| Competitor strength                                                                     | MagicAIBuilder today                                                                                                                        | Product response                                                             |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Moxfield: Scryfall syntax, primers, history, tokens, sandbox and presentation           | Syntax filters, primers, snapshots, tokens and playtesting exist. A plain-language description does not yet become a visible Scryfall query | I-14. The search runs the query the player sees. It does not generate a deck |
| Archidekt: visual organization, packages, comparison, collaborators and playtesting     | Packages, comparison, forks and playtest logs exist. A reviewer cannot yet propose a patch the owner accepts                                | I-20, later. Comments and "seeking feedback" stay in I-08                    |
| EDHREC: inclusion, Lift, precon upgrades, combos and salt in the redesigned UI          | Popular-card rows and source labels exist. Lift is not yet separated from inclusion, and there is no dated precon path                      | Extend I-09. Add I-17. Keep Lumen's own visual system                        |
| DeckCheck and Farseek: conversational advice and stock-aware or natural-language search | The copilot explains constrained suggestions. Search is still syntax-first, and new-set relevance is not reviewed per deck                  | I-14 next. I-18 later, and only on demand at first                           |
| ManaBox and Mana For Cards: collection-first discovery and offline reading              | Ownership and acquisition plans reconcile a deck the player already chose. There is no offline reader                                       | I-16 after the I-06 ownership model. I-19 for a voluntary read-only cache    |
| Deckstats and Archidekt: multi-turn hand odds                                           | Goldfish logs and snapshot comparisons exist. They are not a seeded sample of thousands of hands                                            | I-21, later. Leave I-07's logs and manual comparisons in place               |
| TappedOut: inventory, wishlist and a request for feedback                               | Cross-deck acquisition and "seeking feedback" exist. A synchronized acquire state and regional seller handoff remain open                   | Stay inside I-06 and I-08. Do not open a second feedback initiative          |

#### Deliberate non-goals from the benchmark

- Do not build a draft simulator, cube platform, venue directory or full card-trading marketplace in the current roadmap.
- Do not add paid deck promotion, deck-cycling mechanics or engagement loops that rank visibility by spend.
- Do not duplicate Scryfall's card database or pursue every format before the Commander workflow is excellent.
- Do not start offline support with a multi-device editor. I-19 is a read-only cache of one chosen deck.
- Do not start collaboration with live co-editing. I-20 is a patch the owner accepts or rejects.
- Do not add an AI opponent or a full Magic rules engine under I-21.
- Do not calculate a local Lift score from the top-20 EDHREC feed.
- Do not follow the AI-native builders into a tournament manager, a custom-card creator, MTG Arena wildcard optimization or camera scanning. Each is a separate product with its own data and support cost.
- Do not compete on generation volume or free-tier generosity. A wrong deck produced instantly is the failure mode this product exists to avoid.

[I-33](#i-33-the-marketplace-ladder-decision-record) records the owner's 2026-11-09 ambition to run a recognised marketplace and names the stage that would reverse the marketplace non-goal above, which stays in force pending the owner's decision.

Three of the initiatives added on the evening of 2026-11-09 touch this list without changing it. [I-40](#i-40-installable-app-phone-first-use-and-card-scanning) asks the owner whether camera scanning may leave it, under measured conditions; until the owner decides, the scanning non-goal stands. [I-41](#i-41-store-commander-nights-and-organiser-tools) builds neither a tournament manager nor a venue directory. [I-44](#i-44-trade-lists-within-the-pod-and-nearby-players) and [I-45](#i-45-selling-spare-cards-collection-value-buylists-and-seller-exports) stay below the marketplace line: the product never handles a sale, money or a shipment.

Sources are listed in [`competitive-landscape.md`](./competitive-landscape.md). Revalidate a competitor's behavior before implementation. Capabilities change.

---

## Status And Priorities

| Status          | Meaning                                                           |
| --------------- | ----------------------------------------------------------------- |
| **Shipped**     | Available in the product and covered by the current test strategy |
| **In progress** | Partially available or actively being completed                   |
| **Next**        | High-value work for the next delivery batches                     |
| **Later**       | Valuable, but not a near-term commitment                          |
| **Blocked**     | Do not implement until the stated external condition changes      |
| **Parked**      | Deliberately deferred; not a product priority right now           |

Priority is expressed as **Now**, **Next** and **Later**. A priority is not a promise of a release date.

### Backlog snapshot - 2026-10-20

This is a planning count of unchecked top-level roadmap scopes on `dev`, not a count of missing atomic features. Recently shipped slices may sit inside a still-open broader scope; do not close that scope without its full acceptance evidence.

| Scope                                        | Open now | After adding I-13 |
| -------------------------------------------- | -------: | ----------------: |
| User-visible product outcomes                |       23 |                26 |
| Engineering and validation enablers          |       15 |                17 |
| Conditional or deliberately parked decisions |       11 |                11 |
| **Total tracked scopes**                     |   **49** |            **54** |

**2026-10-26 count:** 55 top-level scopes remain unchecked, plus one nested mobile-action scope. Shipped slices inside open scopes do not reduce this count until their full acceptance criteria are met. The 30-50 small-PR estimate for active Now/Next work remains directional; parked and externally blocked work is not included.

The four narrow fixes in #1100 improve save ownership, profile loading, price summaries and meta-source validation. Their parent scopes remain open, so the count and directional iteration estimate are unchanged.

The four focused fixes in #1104 strengthen card-copy limits, failed maybeboard saves, commander acquisition and trend baselines. These also leave their parent scopes open; the 55-scope count and 30-50 active-iteration estimate remain directional rather than four fewer completed initiatives.

Four further slices in #1106 preserve simple split-card names in text imports, round collection acquisition CSV totals, keep Moxfield profile pagination bound to the loaded profile, and order duplicate warnings deterministically. I-10, I-06, I-04 and I-03 remain open until their broader acceptance criteria are met; the planning count and iteration estimate are unchanged.

The #1108 batch rejects invalid collection quantities, makes Game Changer warnings stable and quantity-aware, preserves split-card names before trailing text comments, and recovers from failed public-profile avatars. These are focused improvements within I-06, I-03, I-10 and I-04, not completion of their full acceptance criteria. As of 2026-10-27, 55 top-level scopes plus one nested mobile-action scope remain unchecked, and the active Now/Next estimate remains approximately 30-50 small PR-sized iterations.

The five #1110 slices classify failed companion rules as legality warnings (I-03), localize USD budget caps without converting prices (I-11), retain known acquisition prices across decks (I-06), encode reserved public-profile usernames (I-04), and deduplicate HTML-imported names regardless of case (I-10). The same PR fixes a Sonar reliability finding in duplicate-name sorting. As of 2026-10-28, these refinements still leave 55 top-level scopes plus one nested mobile-action scope open; approximately 30-50 small PR-sized iterations remain for active Now/Next outcomes, excluding 11 parked or conditional scopes.

The #1117 and #1118 slices prevent stale deck-comparison results after a selection change and show exact-printing acquisition needs beside collection deck usage. #1119 reduced the main-branch Sonar measure from 20 code smells to one; #1123 addresses the remaining import-dialog complexity, pending main-branch reanalysis. These are focused improvements within I-08, I-06 and I-05, not evidence that their broader acceptance criteria are complete. The planning estimate remains approximately 30-50 small PR-sized iterations for active Now/Next work, excluding 11 conditional or parked scopes.

I-07's tracked playtest scope is shipped. The largest active gaps remain the deck editor (I-01), collection-to-acquisition flow (I-06), and explainable recommendation evidence (I-09). I-13 adds a visual redesign, not a claim that today's UI is unfinished or that existing functionality must be rewritten.

**2026-11-07 competitive revision:** the refreshed benchmark adds eight open scopes — Lift semantics and a Commander Spellbook endpoint re-check (I-09), Moxfield import brittleness (I-10), Scryfall policy confirmation (I-05), vendor-level cost breakdown and explicit proxy state (I-06), a visible validator verdict (I-02) and dated Game Changers data (I-03). These are responses to confirmed upstream and competitor changes, not new product bets, so they raise the tracked open count rather than reducing it. Three of them protect integrations that already ship — I-09's Lift work, I-10's Moxfield fallback and I-05's Scryfall confirmation — and should be scheduled before new surface area.

**Iteration estimate:** approximately 30-50 small PR-sized iterations for the active Now/Next outcomes **including** I-13, with overlap between visual and functional work. The 11 conditional or parked scopes are excluded. This is an estimate, not a fixed number of turns or a delivery deadline; refine it after a visual audit and each accepted slice.

**2026-11-08:** `main` supports a narrower status correction than the October snapshot. #1263 made the persisted card zone the only source of truth, #1264 finished stable cross-zone drop targets plus the remaining keyboard and touch zone actions, and #1259 with #1265–#1269 shipped Lumen foundations on the landing page, collection, public decks, forms and deck library. #1270 added editor flow and visual-stability coverage, and #1271 bounded a stalled editor session. #1272 and #1273 promoted that set to `main` on 2026-11-06. Three I-01 scopes are checked below. I-01 stays in progress because concurrent recovery and the broader E2E scope are open. I-13 moves from discovery-only to in progress, and its five delivery slices stay open. I-14 through I-21 record the November competitive gaps. The 2026-10-28 count of 55 unchecked top-level scopes was not recounted. The 30–50 iteration estimate still refers to the pre-existing Now and Next work, including the open I-13 validation, and does not include I-14 through I-21.

**2026-11-08, I-28:** a dated research sweep across official Wizards texts, EDHREC, the strategy press, creators, forums, cEDH resources, card data, game logs and mana-base math produced [a sourced guide to building for each bracket](guides/commander-deckbuilding-by-bracket.md). I-28 publishes it in the product. The sweep also found that the deck wizard shows players wrong bracket names and limits in English and French, that the copilot prompt gives bracket 2 one Game Changer instead of zero, and that the bracket model stops at 4. Correcting that copy and prompt is I-28's first slice. I-28 adds eight open scopes and is not included in the 30–50 iteration estimate.

**2026-11-09, I-28, I-07 and I-21:** a second research pass covered mulligan practice, measured mana curves, play style and trends 2019–2026, and added the project's own opening-hand simulation. The results are in [a companion guide](guides/commander-mulligans-curves-and-play-style.md) and the simulator is in [`scripts/research/commander-opening-hands/`](../../scripts/research/commander-opening-hands/README.md). The main finding is that the free first mulligan in multiplayer (CR 103.5c) is worth a third to a half of what mulligans add, but only if the first seven is judged more strictly than the second. The pass also found that the playtest mulligan, listed as shipped under I-07, goes to six cards after the first mulligan and does not let the player choose what to bottom. It captures 37–47% of the value of correct mulligans. That adds two open scopes to I-07, one to I-21 and one to I-28. None of them changes an initiative's status.

**2026-11-09, merges, work in flight and I-30 to I-37:** four PRs merged to `dev` on 2026-11-09.

- #1300 shows the official bracket names and rules in the deck wizard's picker, in English and French, and gives the copilot prompt the official rules. The other catalogs carry the English text until a native review. This is I-28's first slice, so I-28 moves to In progress; slice 2 is open.
- #1301 makes the playtest follow the London mulligan (CR 103.5: draw seven, put the chosen cards on the bottom) and the free first mulligan in Commander, Brawl and Oathbreaker (CR 103.5c), with the E2E spec updated. I-07's "official mulligan" scope is checked.
- #1302 queues concurrent pre-push E2E gates behind a machine-wide lock and clears root-owned reports. It is an I-05 enabler and closes no I-05 scope.
- #1303 bases the playtest's opening-hand advice on the mulligan stage (first seven, free seven), cheap ramp and land count, from the opening-hands guide's keep rules, for Commander only. I-07's stage-aware advice scope is checked.

Further branches are in flight and none has merged. A playtest fix (I-07) deals every copy of a card and starts the commander in a new command zone: on a 36-land list the playtest dealt a 79-card library and hand with 19% lands, so 59.8% of opening hands had 0–1 land and the commander was in the opening hand 8.7% of the time. After the fix the counts are 99 cards, 36.4% lands, 20.3% and 0%. The same fix stops dealing Sideboard and Considering rows. The Moxfield import stops sending `Origin` and `Referer` headers that impersonate moxfield.com (I-10); with honest headers Moxfield refused both probes with HTTP 403 on 2026-11-09, so that change needs the owner's decision recorded under I-10. A catch-up of `docs/project/changelog.md` and `docs/project/progress.md` is in preparation: neither file has changed since 2026-10-28, while 196 commits reached `dev`. Five further fixes for defects found while writing the I-30 to I-37 specs are in flight, none merged, and each is recorded in its initiative: bulk edit that applies only what changed (I-01), public fields only from `GET /api/deck/[id]` (I-08), public rules pages and unknown commander slugs (I-28, I-34), playtest sessions tied to a snapshot (I-07), and AI replies cut off at the token cap (I-02).

A research pass on the owner's goals added eight initiatives, I-30 to I-37, summarised under [Product Direction](#owner-ambition-and-business-model-2026-11-09). They are not included in the 30–50 iteration estimate. The same pass narrowed three existing claims. The copilot's build route checks the generated deck's structure, not its legality (I-02). AI usage has no monthly quota (I-02, I-05). Tournament win rates are blocked by licence terms, not by missing data (I-09). Four questions now wait for the owner:

- Whether to accept paste as the supported Moxfield route or ask Moxfield for API access (I-10).
- Whether to move I-20 earlier. Player demand argues for it; its priority is unchanged here.
- Whether scripted opponent interaction in the playtest, which is not an AI opponent, is in scope (I-07).
- Where to stop on the marketplace ladder (I-33).

**2026-11-09 (evening), merges, audits and I-38 to I-46:** these PRs reached `dev` on 2026-11-09 after the I-30 to I-37 pass was written. #1303 had merged before #1308 and is recorded above.

- #1303 gives stage-aware keep advice for Commander opening hands (I-07, checked above).
- #1305 reports an AI reply cut off at the token cap as a typed truncation instead of a JSON parse error, and raises the suggestion cap from 2,048 to 4,096 tokens (I-02). Recording usage per call is still I-30 slice 1, so the I-02 scope stays open.
- #1306 records merges #1111 to #1302 in the changelog and progress files and recounts the progress metrics (I-05).
- #1307 deals every copy of each main-deck row, stops dealing Sideboard and Considering rows, and starts the commander in a new command zone. I-07's "deal the deck that was built" scope is checked.
- #1308 adds I-30 to I-37, their specs and section 10 of the competitive landscape.
- #1297 restores the previous commander, partner and pairing when a commander save fails (I-01). The parent recovery scope stays open.
- #1304 stops the Moxfield import sending headers that impersonate moxfield.com, reports a 403, a 429 or an HTML page as a typed refusal, and tells the player to paste the list in the Plain Text tab. I-10's brittle-path scope is checked; the owner's decision on the supported route stays open.
- #1309 leaves Ctrl/Cmd+Z to the text field being typed in (I-04). The off switch for single-character shortcuts stays open.
- #1312 serves public decks from `GET /api/deck/[id]` through an explicit field allowlist; the owner's view is unchanged. I-08's public-fields scope is checked. The rate limit (I-05) and the share-link route stay open.
- #1313 serves `/rules/*` to signed-out visitors from one public-path list, marks an empty commander listing `noindex`, and answers a slug no commander name can produce with a 404. I-28's rules-page scope is checked; I-34 slices 1 and 2 stay open.
- #1314 makes bulk edit save only the changed lines, in one transaction through `PATCH /api/decks/[id]/cards`. I-01's bulk-edit scope is checked; the full syntax with printings is I-37's.

Audits run on 2026-11-09 found eight defects. Each is an unchecked scope item in its initiative, with its file paths: a deleted account that comes back on the next request (I-05, I-38); the share-link route returning the whole deck row (I-08, I-38); account deletion that also deletes other players' replies and the reports the user filed (I-38); an undisclosed 1% Sentry Session Replay and undisclosed AI providers (I-38, I-39); a guest deck lost at sign-up, an onboarding dialog on public pages with two wrong lines, a raw `AI request failed (401)` and invented templates (I-39); Duel Commander lists landing in Commander decks with no format picker (I-42); a `camera=()` policy and a missing `'wasm-unsafe-eval'` that block scanning (I-40); and `/api/combos` as an open proxy to Commander Spellbook (I-09). Fixes for the first, the second and the last are in flight, none merged. The I-46 spec adds two preview findings, recorded under I-46: a deck link previews in Discord only as a small thumbnail with no artist credit, which Scryfall requires, and every other page unfurls with no image, because the default `/og-image.svg` is an SVG and Discord does not render SVG.

A further research pass on the owner's goals added I-38 to I-46, in [Trust, Growth And The Physical Table](#trust-growth-and-the-physical-table). I-38, I-39, I-42's slices 1 to 6 and I-46's slices 1 to 3 are Next; the others are Later with cheap early slices. None is in the 30–50 iteration estimate. Eight further questions wait for the owner:

- Does camera scanning leave the non-goal list, under the benchmark, the Scryfall answer and the thresholds of I-40 requirement 6? Three texts say no today: the [2027 sweep](specs/README.md#what-the-sweep-ruled-out-for-2027) says "Card scanning stays a non-goal", the [benchmark non-goals](#deliberate-non-goals-from-the-benchmark) exclude camera scanning, and [I-26](#i-26-collections-arriving-from-elsewhere) calls import "the only honest path". This pass changes none of them; I-40's slices 8 to 12 wait for the answer.
- Should trades between players allow chat (I-44)? It would reverse I-38's non-goal "Private messages, groups or chat", and moderation would then cover private text.
- Should I-43's deck-box path (slices 1 to 5) move to Next? It needs neither I-26 nor I-30.
- Is the first mulligan free in Duel Commander? I-42 assumes not; ask the Duel Commander Rules Committee before I-42 slice 3 ships.
- Who moderates, and how fast (I-38)? A response time belongs in the terms only if it can be kept in holiday weeks.
- Does a paid web plan that posts into Discord through webhooks count as a "paid feature" of the app under Discord's Developer Policy (I-46)? This goes to the lawyer and, in writing, to Discord developer support.
- Should I-23 merge into I-46? The I-46 spec recommends keeping I-23 for account linking, consent and `/pod`.
- Who supports the Discord bot when it is down (I-46, raised in I-23)? The spec proposes a maintenance notice and a hidden install link when errors exceed 5% of commands for seven days, and leaves a support server to the owner.

**2026-11-10, after midnight (Paris time), merges #1315 to #1317 and three audits:** three more PRs reached `dev` after #1314.

- #1315 files every run recorded in the playtest under a snapshot of the deck as saved: the most recent snapshot with the same cards, quantities, zones, commander and partner, or a new `Playtest · <UTC time>` snapshot. Repeated runs on an unchanged deck share one snapshot. I-07's "tie recorded sessions to the deck version" scope is checked.
- #1316 fixes the flaky i18n navigation E2E test: it suppresses the onboarding dialog, clicks one named link and fails when that link is missing. It is an I-05 enabler and closes no scope.
- #1317 keeps one row per command-zone slot, so a replaced or cleared commander or partner no longer comes back on reload. It is a checked sub-item under I-01's recovery scope. Decks saved before the fix can still hold extra commander rows.

Three read-only audits then ran on `dev` at `65e6230` (#1316). None of them ran code. Each finding is an unchecked scope item with its file paths:

- **API security:** 66 route handlers; 3 high, 3 medium and 6 low findings, tagged H1 to L6. The high ones are an open redirect and `javascript:` XSS through the sign-in `callbackUrl`, account pre-hijacking through unverified signup, and shared Scryfall caches that any signed-in user can overwrite, banlist and Game Changers included. They sit in I-05 (H1 to H3, M1 to M3, L2), I-08 (L1, L6), I-09 (L3) and I-38 (L4, L5). The route posture table is in [`api-route-inventory.md`](../engineering/api-route-inventory.md). Fix branches are in flight for H1, H2, H3, L1, L3 and L4, with no PR yet. The same audit found that card notes are never saved on a signed-in deck (I-01).
- **Accessibility:** WCAG 2.2 AA findings from a code read, in six bundles. Dialogs, forms and status messages, and keyboard and focus are under I-04; names and text alternatives, toggle state and page structure are under I-24. The dialog bundle is in flight. No axe tool exists in the repo, and Lighthouse CI scans only `/`, `/fr` and `/auth/signin`. Seven components are never rendered; deleting them is an I-05 item.
- **i18n:** about 180 hard-coded English strings in five bundles, untranslated French keys, `t()` keys that `tsc` does not check, two overlapping parity tests and a lint rule to stop new strings, all under I-11. Two bundles are in flight.

**2026-11-10, merges #1318 to #1325:** eight more PRs reached `dev` after #1317.

- #1318 checks a generated deck against Scryfall card data on the server. Unknown, banned, not-legal and off-identity cards and extra copies are removed, the size is repaired with basic lands, a commander that cannot lead a deck fails the build, and the wizard shows every correction. It is a checked sub-item under I-02's card-data scope; the Game Changer count and repair from a legal candidate pool stay open.
- #1319 stops re-creating a deleted account: a token whose user row is gone now gets 401. It is a checked sub-item under the deletion scopes of I-05 and I-38 slice 2; the delete route still leaves the session cookie.
- #1320 adds an off switch for single-key shortcuts and leaves plain keys to focused controls. I-04's keyboard-shortcut scope is checked; remapping and the shortcut registry stay with I-37 slice 3.
- #1321 stops linking a Google sign-in to an unverified password account. H2 is checked. The sign-up 409, email verification and Google linking from settings wait for an email sender (I-38).
- #1322 lets only the server write the shared Scryfall caches and caps their rows. H3 is checked, and the cache part of M3 is a checked sub-item; the collection limits stay open.
- #1323 localizes the editor's mobile controls. I-11's mobile-controls scope is checked.
- #1324 makes one Commander Spellbook lookup per deck, cached for 6 hours and rate-limited, and shows each combo's prerequisites. Both Spellbook scopes in I-09 are checked. SonarCloud, which is advisory, failed its gate on duplicated lines in a test fixture and two issues in `CombosPanel.tsx`; `chore/sonar-combos-followup` is queued, not yet a PR.
- #1325 serves share links through an explicit field allowlist. The share-link scope is checked in I-08 and I-38.

Fix branches for H1, L1, L3 and L4 are still in flight, with no PR.

---

## Portfolio View

### Now

1. **I-01 Deck Editor workflow**
   Zone persistence and cross-zone targets shipped on 2026-11-06. Finish concurrent save recovery so editing stays predictable.

2. **I-02 AI deck copilot**
   Turn the existing AI suggestions into a constrained, explainable deckbuilding conversation.

3. **I-03 Trustworthy feedback loop**
   Make every warning, score and recommendation understandable and actionable.

4. **I-04 UX stability and visual quality**
   Remove loading stalls, layout shifts, hover jitter and persistent warnings that damage trust.

5. **I-05 Production safety**
   Keep CI, unit tests, Docker E2E, SonarCloud and health monitoring aligned with the staging flow.

### Next

6. **I-06 Collection and purchase planning**
   Connect deck decisions to owned printings, prices and a realistic acquisition plan. This stays ahead of collection-first discovery.

7. **I-07 Playtest and iteration**
   Turn goldfishing into useful evidence for improving a deck version.

8. **I-08 Share, compare and learn**
   Make public decks useful as learning material, not just static lists.

9. **I-09 Meta and evidence**
   Combine EDHREC trends, tournament context and deck-specific reasoning without pretending incomplete data is certainty. Keep inclusion, Lift and AI advice distinct.

10. **I-13 Product visual redesign**
    Continue Lumen. Foundations and several surfaces shipped on 2026-11-06. The validation matrix is still open.

11. **I-14 Verifiable natural-language search**
    Turn an English or French description into a visible, editable Scryfall query, then search with that query.

12. **I-15 Rule 0 sheets and pod profiles**
    Let a pod share intentions and house rules. The sheet does not claim to balance the game.

13. **I-16 Decks buildable from a collection**
    Rank lists and commanders by owned coverage. Depends on I-06. Validate demand before a large build.

14. **I-17 Precon path and tiered upgrades**
    Start from a dated official precon and apply reversible budget bundles. This is a different job from I-02.

15. **I-19 Offline game-night viewing**
    Let a player download one deck, its primer and its tokens for read-only use without a network.

16. **I-28 Commander deckbuilding guide by bracket**
    Teach how to build for each of the five official brackets from sourced, labeled evidence, and check the open deck against the chosen bracket. The first slice, which corrects the bracket names players already see, shipped in #1300.

17. **I-30 Business model and the paid tier**
    Decide what is free and what is paid, at what price and after which written legal answers, before any billing code. Meter and cap AI usage per user first; that part ships whatever the legal answer.

18. **I-31 Deck Lab**
    Run a seeded, replayable analysis on the player's own list: the keep table for the first seven and the free seven, the commander's cast probability by turn, and swaps judged with an interval.

19. **I-32 Seller handoff, affiliate links and buy-this-deck carts**
    Send the acquisition plan's exact printings to a seller's cart, priced in the market the player chooses, with any affiliate link labelled where the player clicks.

20. **I-34 Commander data reports and indexable data pages**
    Publish dated Commander figures nobody else publishes, each with its method and sample size, and keep thin pages away from search engines. Next for the slices that need no deck index; Later for those built on I-29.

21. **I-37 Editor depth against Moxfield and Archidekt**
    Close the editor gaps players compare between sites: views, sticky groups, tags, text bulk edit, history and a mobile toolbar, measured against latency and stability budgets.

22. **I-38 Trust, safety and user rights**
    Build the legal and safety floor: notice and action, statements of reasons, appeals, blocking, legal pages, a deletion that holds and a full export. It gates public growth and I-30's paid tier. Nothing in it is paid.

23. **I-39 First run, activation and product measurement**
    Keep a guest's work at sign-up, replace the onboarding modal with an inline first-run panel, and count activation and retention in our own database with no third-party script.

24. **I-42 Commander variants**
    Next for slices 1 to 6: a format picker, legality computed on the server from dated lists, and Duel Commander at 20 life with its banned-as-commander list. Later for Pauper Commander, Oathbreaker, the Brawl split, cEDH link-outs and Canadian Highlander.

25. **I-46 Discord and chat integrations**
    Next for link previews (slices 1 to 3), which need no bot: full tags, a PNG default image, the artist's credit, oEmbed and a Discord component embed. Later for webhook feeds and the Discord app.

### Later

26. **I-10 Interoperability and integrations**
    Make MagicAIBuilder a good starting point and a good destination for deck data.

27. **I-11 Localization and regional experience**
    Expand beyond English and French only when translations and prices are genuinely supported.

28. **I-12 Local AI**
    Explore local inference only after the cloud copilot has a measurable product fit. Offline reading is I-19.

29. **I-18 Per-deck radar of new cards**
    On demand, explain newly legal cards for one deck and show a diff before any change.

30. **I-20 Collaborative review**
    Let an invited reviewer propose a patch that the owner accepts or rejects. Live co-editing stays out of this slice.

31. **I-21 Reproducible probability bench**
    Compare simulated hands across snapshots with a visible seed, sample size and mulligan policy.

32. **I-35 Pod game log and casual results**
    Log a real game after it ends, tied to the deck version played and the brackets declared and computed, with honest personal statistics and opt-in aggregates.

33. **I-36 Creator and embed toolkit**
    Give creators deck embeds, link previews that show the deck, video in primers and a public read API, with no tracking and no paid reach.

34. **I-40 Installable app, phone-first use and card scanning**
    Later, with a no-regret first part: a manifest, icons, safe areas, install help and phone-sized E2E and Lighthouse runs (slices 1 to 5). Scanning waits for a benchmark, Scryfall's written answer and the owner's decision.

35. **I-41 Store Commander nights and organiser tools**
    Later, with a cheap early part: the pod-pairing policy and an account-free pod planner (slices 1 and 2), which need no schema and store no personal data.

36. **I-43 Physical collection: storage places, deck boxes and pull lists**
    Later. The deck-box path (slices 1 to 5) needs no collection import and can be promoted on its own; that is an owner question.

37. **I-44 Trade lists within the pod and nearby players**
    Later, with a cheap early part: private have and want lists, share links, the balance view and the friends audience (slices 1 to 7), which need no I-38 work.

38. **I-45 Selling spare cards**
    Later, with a no-regret first part: the deck-aware spare list and seller files for Card Kingdom and Cardmarket's tools (slices 0 to 3), which need no price, contract or legal answer.

### Parked

39. **I-33 The marketplace ladder**
    A decision record, not a build plan. It names the stage that would reverse the marketplace non-goal and the evidence each step up needs. The owner decides; nothing is built for a marketplace.

Open work on I-01, I-05 and I-06 stays ahead of I-14 through I-21. I-28's first slice, a copy correction, shipped in #1300; its guide page should land before I-15, whose Rule 0 sheet reuses the same bracket vocabulary. Among the new initiatives, start with I-14 and I-15, validate demand for I-16 and I-17, and specify the I-19 cache in parallel. Keep I-18 on demand until that flow is validated. Take up I-20 and I-21 only if players use the earlier slices.

I-30 to I-37 fit around that order. I-30's slice 0, the written legal answers and the owner's pricing decision, needs no code and can start now. Its slices 1 to 5 (metering, a monthly quota, a model per task, a free-plan entitlement layer and the AI-use disclosure page) ship whatever the legal answer and close I-05's quota gap, so they can start now as production-safety work; no billing code starts before slice 0's answers are committed. I-37's slices 1 to 9 are cheap visual and ergonomic wins with no schema change; run them alongside I-13 so the editor is restyled once. Its change history and finish model (slices 10 and 12) come before its bulk edit, tags and clipboard. I-32's slices 0 to 3 need no commercial relationship and can start; affiliate links wait for the seller's approval and the lawyer. I-31's card classification (slice 2) needs nothing else and can start; the rest depends on I-21 slices 1, 3, 5 and 6, which therefore move ahead of I-21's Later priority. I-34's slices 1 to 7 need no deck index and can start, slice 1 first because it removes today's thin-page exposure; slices 9 to 12 wait for I-29. I-35 and I-36 stay Later. I-33's slices 0, 1 and 4 are owner and outreach work, and nothing for a marketplace is built.

I-38 to I-46 fit around the same order. I-38's slice 2 goes first: #1319 stopped a deleted account coming back, but the session cookie still outlives the deletion; slices 1 to 5 and 12 ship whatever counsel says, and its lawyer questions join I-30's slice 0. I-38 gates public growth and I-30's billing: a paid plan needs terms, a privacy policy and a deletion that cancels first. I-39's slices 1 to 4 need no schema and can start now; its event store (slices 10 to 12) waits for the lawyer questions, and slice 13 is the evidence I-30 waits for. I-42's slices 1 and 2 make the nine existing formats reachable and their banned flags current; slice 3, Duel Commander, waits for the committee's answer on the mulligan. I-46's slice 1 ships alone and fixes what every chat app shows today; slice 2 waits for I-36's deck image, and the Discord app waits for I-38's privacy policy. Among the Later initiatives, the cheap early parts can start without a product decision: I-40 slices 1 to 5, I-41 slices 1 and 2, I-43 slices 1 to 5 if the owner promotes them, I-44 slices 1 to 7 and I-45 slices 0 to 3. Scheduled agents must not pick I-38's slices 13 and 14, I-40's slices 8 to 12, I-41's slices 3 and later, I-43's slices 13 and 14, I-44's slice 12 or later, I-45's slices 11 to 13, or I-46's slice 15 before the decisions, answers or owner actions each spec names.

Impact and effort below are planning labels: medium means several small PRs, large means a cross-cutting project. They are not delivery dates.

### Reviewed on 2026-11-08 and left in place

The November competitive pass did not open a new initiative for work the roadmap already tracks:

- Packages, private and public folders, Markdown primers, attributed forks, public comparison, tokens, playtest logs, snapshots, copilot questions and suggestion diffs are already checked.
- Scanning, regional prices, synchronized buy-later, social notifications, a conditional following feed, import and export fidelity, further locales and local AI stay in I-06, I-08, I-10, I-11 and I-12.
- Inclusion versus Lift versus AI advice, tooltip and tablet behavior, and export fixtures were merged into I-09, I-13 and I-10. A local Lift score stays out of scope until a source exposes the reference denominator.

---

# Initiatives

Detailed functional specs live in [`docs/product/specs/`](specs/README.md): one per initiative, each with a dated market sweep, the current state of the code, and delivery slices with their dependencies.

## I-01: Deck Editor Workflow

**Outcome:** a player can build, reorganize and refine a deck without losing cards, context or intent.

**Status:** In progress
**Priority:** Now

### Already shipped

- Search by name, set, color and advanced filters.
- Main deck, commander, companion, sideboard and considering zones.
- `Partner—Father & son` commanders are recognized, paired only with the same variant, searchable in the second-command slot and preserved by deck APIs (#1084); other new partner variants remain separate scope.
- List and grid presentations.
- Categories, quantities, notes, tags and bulk actions.
- Card printing selection and card hover previews.
- Explicit keyboard-accessible moves from the main deck to Sideboard or Considering, and between secondary zones.
- Snapshots, undo, import/export and color identity validation.
- Superseded failed renames no longer roll back a newer rename, including when both requested the same title (#1100).
- Failed maybeboard additions now remove their optimistic card while preserving any existing main-deck copy of the same printing (#1104).
- Bracket, Game Changers, banlist and deck warnings.

### Remaining scope

- [x] Persist main, sideboard and maybeboard zones as the single database source of truth. The saved card zone wins over the legacy maybeboard mirror, and that mirror is derived from the zone (#1263, promoted to `main` in #1273).
- [x] Preserve zone and quantity when changing a card printing.
- [x] Restore the previous card printing and notify the player when its save fails.
- [x] Complete cross-zone drag and drop with clear drop targets and no layout jump. Zone targets stay mounted and do not resize, and the smallest target under the pointer wins (#1264, promoted to `main` in #1273).
- [ ] Keep optimistic updates, undo and failed-save recovery consistent.
  - [x] Restore the previous commander, partner and pairing type, with an error, when a commander save or clear fails; keep a newer choice, a partner picked meanwhile, and a commander whose deck record was saved (#1297). Other concurrent writes remain open.
  - [x] Keep one row per command-zone slot. `setCommander` and `setPartner` (`src/lib/deck/store.ts`) kept the placed card under its printing id, so no later change could delete its row, and a replaced or cleared commander or partner came back on reload. The store now adopts the saved row id and deletes the rows a change takes off screen (#1317). Decks saved before the fix can still hold extra flagged rows, and the server does not yet enforce one row per slot.
  - [x] Keep the save indicator active until overlapping budget writes finish, even if one fails (#1096). Other concurrent writes remain open.
  - [x] Keep save activity visible while an addition and a removal overlap, regardless of completion order (#1094). Other concurrent mutations remain open.
  - [x] Roll back a rejected searched-card addition and show retry feedback without recreating a deleted deck (#1090). Broader overlapping mutation ownership remains open.
  - [x] Suppress failed zone-move feedback after the card itself has been removed, without changing recovery for cards still in the deck (#1027). Broader concurrent mutation ownership remains open.
  - [x] Suppress failed zone-move feedback after its deck has been removed, without changing recovery for existing decks (#1025). Broader concurrent mutation ownership remains open.
  - [x] Ignore bulk removal identifiers absent from the active deck; entirely stale selections preserve the deck and save activity without requests (#943). Cross-batch ownership remains open.
  - [x] Deduplicate card identifiers within bulk removals to avoid duplicate requests and conflicting recovery for one card (#941). Cross-batch ownership remains open.
  - [x] Group rejected bulk removal feedback into one retry notification after the batch finishes, preserving individual recovery and suppressing feedback for deleted decks (#939). Overlapping removal ownership remains open.
  - [x] Restore rejected bulk removals before their next surviving original card, preserving relative order across out-of-order failures and retaining successful removals (#937). Overlapping removal recovery and aggregate failure feedback remain open.
  - [x] Recover rejected bulk card removals independently with original zone and quantity, retry feedback, successful removals preserved and no recreation of deleted decks (#935). Original ordering, overlapping recovery and aggregate failure feedback remain open; bulk undo behavior is unchanged.
  - [x] Restore the previous displayed manual bracket after a rejected override or return to automatic calculation when the attempted value remains current, with retry feedback; preserve a different newer setting and leave deleted decks absent (#931). General write serialization, repeated identical values and confirmed-baseline recovery remain open.
  - [x] Restore the previous displayed budget after a rejected save or clear when the attempted value remains current, with retry feedback; preserve a different newer budget and leave deleted decks absent (#929). General budget-write serialization, repeated identical values and confirmed-baseline recovery remain open.
  - [x] Restore the previous displayed target bracket after a rejected save when the attempted value remains current, with retry feedback; preserve a different newer target and leave deleted decks absent (#927). General target-write serialization, repeated identical values and confirmed-baseline recovery remain open.
  - [x] Restore the previous displayed deck name after a failed rename when the attempted name is still current, with retry feedback; preserve a different newer name and do not recreate deleted decks (#925). General rename serialization, repeated identical names and confirmed-baseline recovery remain open.
  - [x] Ignore save refresh responses after their deck has been deleted, without recreating the deck or announcing success; rejected deletion still permits refresh (#921). Broader stale-response ownership and concurrent edits remain open.
  - [x] Suppress obsolete success feedback when addition/removal undo completes after its deck was deleted, without recreating the deck (#919). Broader unloading, late-response ownership and mutation concurrency remain open.
  - [x] Discard failed in-flight addition/removal undo retries after their deck has been successfully deleted (#917). Successful late responses, unloading races and broader mutation ownership remain open.
  - [x] Remove a successfully deleted deck's undo entries without blocking other decks; rejected deletion preserves the deck and history (#915). Concurrent deletion and in-flight undo remain open.
  - [x] Prioritize the recorded card ID when undoing additions across same-name printings (#905).
  - [x] Preserve cards and undo actions when legacy name-only matching has multiple candidates (#907). Broader undo concurrency remains open.
  - [x] Preserve undo additions/removals when their original deck is unloaded, asking the player to open it before retrying and issuing no mutation (#901). Broader undo concurrency remains open.
  - [x] Discard obsolete removal undo when the same saved card is already present, without duplicating it or changing zone/quantity (#899). Broader concurrency remains open.
  - [x] Use the original printing ID and returned saved row ID when undo restores a removal, keeping subsequent edits/removals usable (#897). Broader undo concurrency remains open.
  - [x] Remove unsaved restored cards and retain retry actions after failed undo removals, without false success notifications (#895). Concurrent undo and mutation ownership remain open.
  - [x] Restore cards and retry actions when undoing an addition fails, without a false success notification (#893). Broader undo concurrency and ordering remain open.
  - [x] Apply undo additions/removals to their recorded deck after a deck switch, preserving the current selection and unrelated deck (#891). Broader undo failure/concurrency remains open.
  - [x] Preserve the relative card order during rejected removal recovery, keeping concurrent successful removals and their undo entries (#889). Broader concurrency coverage remains open.
  - [x] Restore rejected card removals with their zone and quantity and remove the failed operation's undo entry (#887). Wider remove/undo concurrency remains open.
  - [x] Restore the previously displayed category after a failed category edit when it still matches the attempted value, with a retry notification (#880).
  - [x] Serialize category writes per card and restore the last confirmed category after failed rapid edits (#882). Broader mutation recovery remains open.
  - [x] Serialize card-note saves and restore the last confirmed note after a failed latest edit (#872).
  - [x] Recover individual failed bulk zone moves without rolling back successfully saved cards (#871). Broader mutation recovery remains open.
- [ ] Add Docker-backed E2E coverage for add, move, reload and recovery flows.
  - [x] Verify a rejected searched-card addition disappears, remains absent after reload, and can be retried successfully in Docker-backed Playwright (#1090). Other recovery variants remain open.
  - [x] Verify a rejected Sideboard-to-Considering move retains its card and saved zone after reload in Docker-backed Playwright (#1029). Other add-flow and recovery E2E remain open.
  - [x] Verify a searched card is added to Main, persisted through the API and still present after reload in Docker-backed Playwright (#1031). Other add/recovery variants remain open.
  - [x] Verify a Considering card survives reload, a Main-to-Considering move persists, and a rejected move restores the card (#1270). Pointer-drag coverage and further zone combinations remain open.
- [x] Add keyboard and mobile alternatives for every drag action.
  - [x] Provide card-specific Main → Sideboard/Considering controls in grid and list views (#970).
  - [x] Enable keyboard sorting for categorized deck cards using the reorder handle and standard vertical controls (#997).
  - [x] Change a categorized card from a touch-friendly menu in the grouped list, without drag and drop (#999).
  - [x] Move Sideboard and Considering cards to either legal destination from grid or list view with controls that remain visible on touch devices (#1001).
  - [x] Keep Main-grid moves to Sideboard and Considering, plus card removal, visible and reachable on touch devices (#1003).
  - [x] Change Main-card categories directly in grid view with an accessible touch-friendly selector (#1005).
  - [x] Keep category editing available when the Main list is grouped by mana value or color (#1007).
  - [x] Complete mobile alternatives for the remaining drag-only actions. Search results have a keyboard and touch zone menu, and grid cards keep move, remove and category actions without dragging (#1264, promoted to `main` in #1273).
- [x] Add a compact activity indicator instead of blocking the whole editor during saves.
  - [x] Preserve shared activity between bulk removal and manual bracket saves regardless of which action finishes first (#947). Other action combinations and mutation ownership remain open.
  - [x] Retain save activity until all overlapping bulk removal batches finish (#945). Cross-action activity tracking and overlapping recovery ownership remain open.
  - [x] Keep the indicator active until all overlapping manual bracket saves finish, including rejected requests (#933). Cross-action accounting and server write ordering remain open.
  - [x] Keep the existing compact indicator active across concurrent zone writes and overlapping card-note saves (#870, #874). Activity tracking for other mutation types remains open.
  - [x] Preserve pending quantity, note and zone save activity regardless of which write finishes first (#877, #878). Other mutation types remain outside this coverage.
- [x] Organize decks into user-defined folders, with move, filter and bulk-move actions.
- [x] Save reusable card packages such as mana bases, interaction suites or tribal cores and preview their legal additions before applying them.
- [x] Honor existing named capped-copy exceptions in singleton card packages, counting existing copies and quantities across printings (#850).
- [x] Apply existing format copy limits to non-singleton card packages, combining deck and package quantities across printings (#852).
- [x] Honor Oracle-text multiple-copy exceptions in packages using canonical Scryfall data, never stored author metadata (#854). The existing policy ceiling of 99 copies remains unchanged.
- [x] Limit canonically restricted package cards to one copy, including existing deck quantities; a single restricted card remains allowed (#859).
- [x] Add a required-token and emblem summary derived from the current deck, with export support.
- [ ] Save card notes on a signed-in deck. `patchCardSchema` (`src/lib/validation/card.ts`) has no `notes` field, so zod drops it, and `updateCardNotes` (`src/lib/db/deck-api.ts`) reports success while the server saves nothing. Found by the 2026-11-10 security audit. Once notes save, the fork leak under I-08 (L1) becomes medium, so fix that first.
- [x] Make bulk edit apply only what changed. Saving in `src/components/deck/BulkEditModal.tsx` called `removeAllCards`, cleared the commander, partner and companion, then re-added every line by name, one request per card, and `exportToText` (`src/lib/deck/import.ts`) writes only `quantity name`. Every save therefore reset printings to Scryfall's default, re-derived categories and dropped notes, unchanged lines included. The requests were not one transaction, so a failure after the delete left a partial deck. Shipped in #1314: the save compares the text with the deck line by line (`src/lib/deck/bulk-edit.ts`), unchanged lines keep their rows, printings, categories and notes, and the change set is applied in one transaction by `PATCH /api/decks/[id]/cards`, which answers 409 on a stale row and writes nothing. A printing typed in the text is still not applied. The full diff-and-apply bulk edit, with printing, finish and tags in the line syntax, is [I-37](#i-37-editor-depth-against-moxfield-and-archidekt) slice 16.

**2026-11-09:** the editor-depth gaps found against Moxfield and Archidekt are tracked in [I-37](#i-37-editor-depth-against-moxfield-and-archidekt), not here. They include Stacks, Table and Text views, collapsible and sticky categories, global and Oracle tags, text bulk edit with printing and foil, a cross-deck clipboard, an automatic per-change history, multi-select category assignment and a mobile editing toolbar. I-01 keeps zone integrity, recovery and their E2E coverage. `DeckCard` has no foil, finish or language field (`prisma/schema.prisma`), so a faithful bulk edit or import of those attributes needs a model change first.

### Engineering enablers

- One canonical DeckCard.zone model; compatibility mirrors must not become a second source of truth.
- Fine-grained Zustand selectors so card movements do not refresh the whole editor.
- Serialized writes per deck and idempotent zone updates.
- Tests for hydration, duplicate prevention, failed writes and reload persistence.

### Definition of done

A user can move a card between every legal zone, reload the page, change its printing, undo a move and recover from a failed request without a lost or duplicated card.

---

## I-02: AI Deck Copilot

**Spec:** [`specs/i02-checkable-ai-copilot.md`](specs/i02-checkable-ai-copilot.md)

**Outcome:** a player can describe what they want and receive a legal, budget-aware and explainable plan.

**Status:** In progress
**Priority:** Now

### Already shipped

- Claude/OpenAI provider support.
- Archetype detection and manual override.
- Ten archetype templates.
- Budget constraints, cuts and additions.
- Per-card reasoning, one-click add and ignore actions.
- Server-side secrets, validation, rate limiting and prompt-injection protections.
- Optional player brief covering theme, desired play pattern and dislikes, combined with the existing commander, budget and power target.
- A small regression set for generated deck structure and recommendation evidence; broader usefulness evaluation remains open.

### Next slice

- [x] Conversational brief: commander, theme, play pattern, budget, power target and dislikes.
- [x] Structured plan before card generation: gameplan, win conditions, roles and constraints.
- [x] Explain every suggestion with evidence: role, synergy, curve, color identity, legality and price.
- [x] Offer alternatives by budget, power and play pattern instead of one opaque answer.
- [x] Diff a proposed change against the current deck before applying it.
- [x] Support "why is this card here?" and "what is the weakest card?" questions.
- [x] Add a deterministic post-generation validator; the LLM never decides legality. **Correction 2026-11-09:** for the deck build route this validator checks structure only (see below). Suggestions are checked against Scryfall card data; generated decks are not. **2026-11-10:** #1318 checks generated decks against card data too; see the card-data item below.
- [x] Build a small golden evaluation set for valid cards, useful explanations and regression checks.
- [ ] Expand the golden set from deterministic structural and evidence contracts to provider-backed qualitative evaluations only when a stable review rubric exists.
- [ ] Keep the deterministic validator's verdict visible in the copilot's output instead of only applying it silently. Competing assistants either validate without explaining or explain without validating; the difference is only a differentiator if the player can see which claims were checked against card data and which are the model's reasoning.
- [ ] Check a generated deck against card data on the server before it reaches the player: every card exists, sits inside the commander's colour identity, is legal in Commander, and the Game Changer count fits the chosen bracket. Repair a failing card from a legal candidate pool rather than rejecting the whole build, and show each correction. Until this ships, do not label generated decks as verified.
  - [x] Check each card of a generated deck on the server before it is streamed (`verifyGeneratedDeck` in `src/lib/ai/generated-deck-legality.ts`). Unknown names, banned or not-legal cards, off-identity cards, extra copies and a repeated commander are removed; a short list gets basic lands and a long one loses basics; a commander that is unknown, banned, not legal or not eligible fails the build. The wizard shows each correction before it opens the deck (#1318). The Game Changer count for the chosen bracket and repair from a legal candidate pool remain open, so generated decks are still not labelled verified.
- [ ] Record `stop_reason` and output token usage per AI route, and stop treating a truncated response as a parse failure. Whether the default suggestion task is cut off at its 2,048-token cap is an estimate to verify.
  - Verified on `dev` on 2026-11-09: `src/app/api/ai/suggest/route.ts` passed the reply text to `JSON.parse` without reading `stop_reason`, and `src/app/api/ai/build/route.ts` did the same after stripping code fences. Recording usage per call is [I-30](#i-30-business-model-and-the-paid-tier) slice 1.
  - [x] Report a reply cut off at the token cap as a typed truncation (`ModelOutputTruncatedError` in `src/lib/ai/model-reply.ts`) for Anthropic `stop_reason: "max_tokens"` and OpenAI `finish_reason: "length"`, logged once with the model and cap; the client gets the route's existing error event. The suggestion cap rises from 2,048 to 4,096 tokens (#1305). Token usage per call remains open.
- [ ] Publish a page that says where the product uses a language model and where it does not, and label each AI surface in the product. Every deterministic surface (legality, colour identity, bracket rules, search syntax, playtest) must stay usable with the copilot switched off.

### Findings from the 2026-11-09 pass

Code facts were read on `dev` on 2026-11-09. Figures marked as estimates are calculations from the [2026-11-09 research pass](./competitive-landscape.md#ai-unit-economics), not measurements; a `count_tokens` run or real usage logs should replace them.

- **What the build route checks.** `validateGeneratedDeck` (`src/lib/ai/generated-deck-validation.ts`) checks the response shape, a non-empty commander, no commander or partner repeated in the list, positive integer quantities, singleton with the capped-multiple exceptions, and a total of exactly 99 (98 with a partner). It does not check that cards exist, colour identity, Commander legality, the banlist or Game Changers. The prompt asks the model for all of those, and `src/app/api/ai/build/route.ts` trusts the answer. Any structural issue rejects the whole build with "AI deck build failed", so the provider call is wasted and a retry pays again.
- **What the client does afterwards.** The deck wizard (`src/components/deck/DeckWizard.tsx`) resolves the names through Scryfall's collection endpoint, drops names Scryfall does not return without telling the player, and adds the rest. The deck store marks Game Changers and banned cards from its name lists, and colour-identity problems appear later as the editor's existing warnings. Nothing rejects or repairs an off-identity, banned or excess Game Changer card before it is saved. Suggestions differ: `src/app/api/ai/suggest/route.ts` resolves each suggested card through Scryfall and attaches colour-compatibility and Commander-legality evidence.
- **No monthly quota.** The only limits are per minute and per user: 5 builds and 10 suggestions per 60 seconds, held in an in-memory store that is per instance (`src/lib/rate-limit.ts`). No quota, credit or token metering exists in `src/lib`, `src/app/api` or the Prisma schema. In theory one account could send 216,000 builds in 30 days, about 1,776 USD on today's model (estimate). Metering belongs to I-05.
- **Today's model and prices.** Both routes call `claude-haiku-4-5` with `max_tokens` 4,096 (build) and 2,048 (suggest), with no system prompt and no prompt caching. Anthropic's pricing page, read on 2026-11-09, lists Haiku 4.5 at 1 USD per million input tokens and 5 USD per million output tokens, Haiku 5.5 at 0.10 and 0.50 USD (prompts up to 100,000 tokens), and Sonnet 5.5 at 2 and 10 USD. The Batch API halves both. Haiku 4.5 caches nothing below a 4,096-token prompt, and today's prompts are shorter.
- **Cost per active user (estimate, USD per month).** A build costs about 0.008 USD and a suggestion about 0.012 USD on Haiku 4.5, and output is about 92% of a build's cost. With three suggestions per build:

  | Model      | 5 builds | 20 builds | 100 builds |
  | ---------- | -------: | --------: | ---------: |
  | Haiku 4.5  |     0.22 |      0.88 |       4.39 |
  | Haiku 5.5  |     0.03 |      0.12 |       0.60 |
  | Sonnet 5.5 |     0.60 |      2.39 |      11.94 |

  A 100-build user on Haiku 4.5 costs more than a 3 EUR plan earns. Haiku 5.5 is about seven to eight times cheaper, but it uses about 30% more tokens for the same text, thinks by default, and has no published Magic quality results, so a switch needs a larger `max_tokens`, thinking turned down, refusal handling and a golden-set run first.

- **Possible truncation (to verify).** The default suggestion task asks for 8 additions with up to 3 alternatives each, 4 removals and an analysis. Its estimated output, about 2,200 tokens, sits at or above the 2,048-token cap. The suggest route parses the text as JSON without checking `stop_reason`, so a cut-off answer would fail as a parse error.
- **Cheaper and more trustworthy at once.** The research recommends four techniques, none measured here yet. First, retrieve a legal candidate pool from Scryfall (colour identity, `legal:commander`, Game Changers per bracket, price cap) so off-identity and illegal cards become impossible rather than detected. Second, have the model return numbered picks from that pool instead of full JSON objects, which could cut build output three to five times. Third, repair a failing card from the pool instead of rejecting the build. Fourth, precompute commander-level plans with the Batch API and serve repeats from the database.
- **Market corrections.** The 2026-11-08 [spec](specs/i02-checkable-ai-copilot.md) said Farseek states no deterministic legality validation. Farseek's own blog, updated 2026-10-11, says Commander legality is read from Scryfall and the deck flags cards over the singleton limit. MTG Master, cited as enforcing legality, could not be found on 2026-11-09. ManaTap's Pro tier was £3.99 a month on 2026-11-09, not the "around $12.99" recorded on 2026-11-08.
- **Player hostility to AI.** On r/EDH a December 2025 post, "Do not use AI to make deck suggestions or clarify rules. It's wrong most of the time.", reached 729 points; all fourteen 2025–2026 posts with "ChatGPT" in the title sit at zero; builders now advertise that they do not use AI; and AI-use questions are top comments under launches, including EDHREC's redesign. Only checkable AI output is tolerated there, and the community now asks for disclosure. This is why the visible verdict and the disclosure page above matter more than generation quality.

### Definition of done

For a fixed brief and deck, the copilot produces reproducible structured output that passes deterministic Commander validation, stays within constraints, and explains its recommendations well enough for a player to accept or reject them.

---

## I-03: Trustworthy Deck Feedback

**Outcome:** the player understands what is wrong with a deck and what action would improve it.

**Status:** Shipped foundation, next refinement
**Priority:** Now

### Already shipped

- Commander color identity and format legality.
- The editor rejects a generic Partner replacement for an existing Father & son pair without changing the saved partner (#1086).
- Deck create and update APIs reject the exact same card ID in commander and partner slots (#1088).
- Banlist and Game Changers detection.
- Bracket scoring across six dimensions.
- Mana curve, color distribution and format-specific statistics.
- Exported statistics count card copies, not distinct rows, including type percentages (#838); the existing export scope is unchanged.
- Mana alignment and per-color land recommendations.
- Turn-one playability odds.
- Combo detection through Commander Spellbook.
- Budget, missing-card and deck-size warnings.
- Equal-price most-expensive and cheapest card summaries now resolve ties by card ID, independent of deck order (#1100).
- Pre-add validation now enforces each format's non-basic copy limit, including the fifth-copy boundary in four-copy formats (#1104).
- Explanations and next actions for legality warnings.

### Remaining scope

- [x] Replace long persistent warning blocks with dismissible, grouped and actionable warnings.
- [x] Show the rule or calculation behind legality warnings on demand.
- [x] Separate hard legality errors from strategic suggestions and optional advice.
- [x] Add source and freshness labels to external recommendations.
- [x] Let the player compare analysis before and after a proposed change.
- [ ] Keep warning calculations deterministic and independent from AI output.
  - [x] Break equal-price budget recommendation ties by card ID, independent of deck order (#1096). Other feedback calculations remain open.
  - [x] Order color-identity violation details by card name and ID regardless of deck order (#1094). Broader deterministic inputs remain open.
  - [x] Keep named banned-card, color-identity and Game Changer warnings in a stable order when deck cards are reordered (#1092). Broader deterministic inputs and AI independence remain open.
- [ ] Validate commander and partner mechanics at the deck API boundary, including imported pairs and the same Oracle card across different printings.
  - [x] Reject whitespace-only partner IDs before creating a deck (#1098).
  - [x] Reject a commander and partner that are different printings of the same Oracle card on deck create and update (`sharesOracleIdentity`, #1131). Imported pairs outside these two APIs remain to be verified.
- [ ] Version the Game Changers list and bracket rules as dated data rather than code. The list has held at 53 cards since 2026-02-09 and Wizards still labels the brackets beta, so a resumed update cadence should be a data change with an effective date, not a release.
- [ ] Flag cards whose rules text cannot work with this deck's commander, as a deterministic rules check labelled apart from recommendations. Examples players cite: Arcane Signet and similar mana sources that produce only the commander's colours, under a colourless commander; a card that names a creature type the commander is not, such as Roaming Throne in a Go-Shintai deck, where "Shrine" is not a creature type. Read the condition from Oracle text and the commander's colour identity and type line, never from a model. Players raise this as EDHREC's main failure: ["Remember…take edhrec suggestions with a Grain of salt"](https://www.reddit.com/r/EDH/comments/1rl9bfa/) reached 368 points on r/EDH in March 2026, and replies in that thread name both cards. The same check filters or labels the data-sourced recommendations in I-09.

### Definition of done

A player can answer three questions from the editor: "What is invalid?", "Why is it flagged?" and "What should I do next?"

---

## I-04: UX Stability And Visual Quality

**Outcome:** the product feels as reliable and polished as the tools players already use.

**Status:** Next
**Priority:** Now

### Product work

- [x] Bound collection loading to 15 seconds and show a localized retry rather than an endless spinner or a false empty state; retain cached cards after failed refreshes (#1013).
- [x] Time out stalled acquisition-plan loading after 15 seconds and expose its existing localized retry action without losing close/filter cancellation (#995).
- [ ] Fix profile and deck loading states so no request appears to hang indefinitely.
  - [x] Clear decks from the previous Moxfield profile before loading another one, so a failed reload cannot leave an old deck importable (#1098). Broader profile loading ownership remains open.
  - [x] Ignore superseded Moxfield profile responses after a newer load fails, rather than restoring stale import choices (#1100). Broader profile loading ownership remains open.
  - [x] End the indefinite My Decks skeleton for signed-out visitors after session resolution (#1011). Profile latency and other loading ownership remain open.
  - [x] Show an accessible, responsive editor-shaped skeleton while the initial deck data loads (#1009). Profile latency and other loading ownership remain open.
  - [x] Treat temporary public-deck API, network and invalid-response failures as retryable rather than a false 404; bound the fetch to 15 seconds (#993). Authentication latency and broader loading ownership remain open.
  - [x] Bound public-profile API fetches to 15 seconds and show the existing retryable route error for temporary failures rather than a false 404 (#989). Authentication latency and the underlying profile API remain open.
  - [x] Ignore superseded deck-list responses so an older failure cannot override a successful retry (#984).
  - [x] Warn when a failed refresh leaves cached decks visible, with a localized retry action (#985). Initial loading ownership and profile latency remain open.
  - [x] Distinguish failed deck-list loading from a missing deck on direct builder navigation, with a localized retry action (#974). Initial loading ownership remains open.
  - [x] Show a recoverable error when an individual deck fetch fails on direct builder navigation, then retry that deck without exposing its incomplete listing stub (#976). Broader loading ownership remains open.
  - [x] Report failed manual deck refresh without changing the current deck, and suppress late failure feedback after deletion (#923). Dedicated visual retry states and broader loading ownership remain open.
  - [x] Notify the player when individual deck opening fails instead of logging silently (#911). The direct-builder retry state is covered by #976; manual-refresh retry UX remains open.
  - [x] Bound individual server deck fetches to 15 seconds, keeping the deadline through JSON reading and leaving guest loading local (#909). Broader UI retry and profile latency work remain open.
  - [x] Abort stalled deck-list requests after 15 seconds so the existing error and retry state can appear.
  - [x] Keep the user initialization eight-second deadline active through response-body loading and JSON validation, not only until headers arrive. Database latency and broader profile loading work remain open.
  - [x] Stop a stalled session from leaving the deck library on a skeleton, and keep the last profile when a refresh fails (#1271, promoted to `main` in #1273). Broader profile loading ownership remains open.
- [ ] Use route-level skeletons and cached session/profile data where safe.
  - [x] Show a localized, accessible route-level loading skeleton for public profiles (#987). Cached profile data and other route loading states remain open.
  - [x] Show a localized, accessible route-level loading skeleton for public decks, sharing the visual fallback with public profiles (#991). Cached data and other route loading states remain open.
- [ ] Remove React refresh loops, hover jitter, layout shifts and unstable card previews.
  - [x] Ignore superseded meta-history responses and invalidate pending results on reset, preventing old trend data or errors from resurfacing.
  - [x] Pin the card preview so hover does not move the editor layout, and keep the commander banner box stable while warnings open and close (#1270, #1271). Broader hover and refresh-loop work remains open. The EDHREC follow-up lesson on tooltips and tablet layout is tracked under I-13.
- [x] Make warning panels collapsible and dismissible, with accessible close controls.
- [x] Keep the color identity banner subtle: official mana symbols, restrained background and stable dimensions.
- [x] Make card zoom intentional in "View all cards" contexts, not a global hover effect.
- [x] Explain the empty EDHREC missing-card filter when all popular cards are already in the deck; removing the filter restores the list.
- [x] Keep EDHREC recommendation add actions visible without hover, with a 40 px touch target and keyboard focus outline (#1058).
- [x] Make keyboard shortcuts safe while typing and for assistive technology. `src/hooks/useKeyboardShortcuts.ts` handled Ctrl/Cmd shortcuts before it checked whether the focus was in a text field, so Ctrl+Z in a card note undid the last deck change instead of the typing. `/` and `?` stayed silent in text fields, but no setting turned them off or remapped them, which WCAG 2.1.4 (Level A) requires of single-character shortcuts that work outside a focused control. [I-37](#i-37-editor-depth-against-moxfield-and-archidekt) slice 3 adds the shortcut registry.
  - [x] Leave Ctrl/Cmd+Z to a focused text field, so a card note or the search bar keeps its own undo; checkboxes and other non-text controls keep deck undo (#1309). The off switch and remapping for `/` and `?`, and the shortcut registry, remain open.
  - [x] Add a "Single-key shortcuts" switch to the shortcut list, on by default and kept in `localStorage`, and a "Shortcuts" button in the builder toolbar so the list stays reachable when `?` is off. With the switch off, keys without Ctrl/Cmd do nothing on the page. Plain keys are left to a focused select, combobox, listbox, menu or other key-reading widget, Enter to a focused button or link, and every key to an IME composition (#1320). Remapping and the shortcut registry are I-37 slice 3's. Not checked in a browser or with a screen reader.
- [ ] Preserve the established dark/light design language while improving hierarchy, spacing and responsive behavior.
  - Players now spot and reject interfaces that look AI-made, and they defend shallow access to filters and sorts. I-13 records this as a design constraint from EDHREC's October 2026 redesign backlash.
- [ ] Add visual regression coverage for the Deck Editor, banner, warning panel and card hover states.
  - [x] Keep the commander banner box stable while warnings open and close, and open a fixed card preview without moving the card row (#1270). Screenshot coverage of the warning panel and hover states remains open.
- [ ] **Accessibility bundle 1, dialogs (WCAG 4.1.2, 2.4.3, 2.1.2, 2.4.11).** `src/components/ui/Modal.tsx` has no `role="dialog"`, `aria-modal` or label, no focus trap and no focus restore, and its global Escape listener closes the Export and Proxy dialogs together. `src/components/playtest/PlaytestModal.tsx` and `src/components/collection/AddToCollectionDialog.tsx` leave focus on the page underneath, and the close buttons in `ImportDialog.tsx` and `PrintingSelectorModal.tsx` have no name. Rebuild `Modal` on `@radix-ui/react-dialog`, which seven dialogs already use. Fix branch in flight: `fix/a11y-dialog-focus`.
- [ ] **Accessibility bundle 4, forms and status messages (1.3.1, 3.3.2, 1.3.5, 4.1.3, 2.2.1).** The builder search, the search filters, the import, bulk-edit and export text boxes, the life tracker, snapshots, the wizard and the comment forms are named only by a placeholder or by a caption not tied to the field (`src/components/search/SearchBar.tsx`, `src/components/search/SearchFilters.tsx` and others). The sign-in and sign-up fields have no `autoComplete`. Search results, import feedback and the sign-in and deck-list errors are not announced, and toasts vanish after 3 seconds (`src/hooks/useToast.ts`).
- [ ] **Accessibility bundle 5, keyboard, visible focus and target size (2.1.1, 2.4.7, 1.4.13, 2.5.7, 2.5.8).** Each search result is two nested buttons, and Enter starts a dnd-kit drag (`src/components/card/DraggableCard.tsx`, `src/components/card/CardImage.tsx`). The Duplicate and Delete buttons sit inside the deck card's link (`src/components/deck/HomeDeckCard.tsx`). Card previews open on hover only. Several controls stay invisible or lose their focus ring when focused, and the view toggles and review stars are under 24 px.
- [ ] Scan the builder for accessibility automatically. No axe tool is in the repo (no `jest-axe`, `vitest-axe`, `axe-core` or `@axe-core/playwright`), and Lighthouse CI checks accessibility only on `/`, `/fr` and `/auth/signin`, so the builder is never scanned. Add `@axe-core/playwright` to the Docker E2E gate for the builder, the playtest and the public deck page, and use role queries in unit tests.

**2026-11-10:** a read-only accessibility audit of `dev` at `65e6230` read the code against WCAG 2.2 AA and grouped its findings into six bundles. Bundles 1, 4 and 5 are above. Bundles 2, 3 and 6 decide what a screen reader hears, so they sit under [I-24](#i-24-decks-a-screen-reader-can-play-from). The audit did not repeat known items: single-key shortcuts (above), I-13's contrast work and I-24's mana-cost labels.

### Definition of done

The editor remains visually stable while the user searches, hovers, moves cards, saves and navigates between zones on desktop and mobile.

---

## I-05: Production Safety

**Outcome:** a broken deployment or regression is detected before users depend on it.

**Status:** In progress
**Priority:** Now

### Already shipped

- Vercel deployment, Sentry, health endpoint and structured logging.
- CI quality gates, Dependabot, Lighthouse CI and SonarCloud workflow.
- Unit test suite with broad coverage.
- Staging-first branch policy.

### Remaining scope

Items tagged H1 to L6 come from the read-only API security audit of `dev` at `65e6230` on 2026-11-10, with the audit's severity. The route posture table and the findings that sit in other initiatives are in [`api-route-inventory.md`](../engineering/api-route-inventory.md).

- [ ] Add UptimeRobot or an equivalent monitor for /api/health.
  - `/api/health` is documented for uptime monitors and `docs/engineering/dx-ci-overview.md` lists UptimeRobot, but no configured monitor is recorded. `docs/engineering/infrastructure.md` still points to an "Observability ? Level 1" roadmap section that no longer exists.
- [ ] Run Playwright E2E in Docker as the authoritative integration environment.
  - The `.husky/pre-push` gate (`scripts/e2e-pre-push.sh`) runs the full suite in Docker and takes its verdict from the container exit code. No GitHub workflow runs Playwright yet, although the script and `docs/engineering/quality-gate.md` say CI has its own E2E job.
  - [x] Queue concurrent pre-push gates behind a machine-wide lock, and clear root-owned reports left by a killed run through a container (#1302). Every clone and worktree on the machine shares one `magicaibuilder-e2e` compose project, so two pushes at once replaced each other's containers and both were blocked with no failing test. The script tests run the real script against a fake `docker`. A CI E2E job remains open.
  - [x] Stop the onboarding dialog blocking the i18n navigation test, and make that test fail when its link is missing instead of skipping its only assertion (`e2e/i18n-routing.spec.ts`, #1316). A CI E2E job remains open.
- [ ] Give scheduled agent runs and manual pushes enough room on the VPS. They share one machine with about 7.6 GiB of RAM and 4 vCPUs. On 2026-11-09 they collided twice on the pre-push gate, and background tasks were killed for memory pressure. Decide between scheduling agents outside working sessions, capping concurrent builds and E2E runs, or a larger machine.
- [ ] Meter AI usage per user and enforce a monthly quota before any public launch or paid tier. Today the only AI limits are per minute (5 builds and 10 suggestions per user per 60 seconds) in an in-memory store that is per instance, and no token metering exists. The theoretical worst case for one account is three orders of magnitude above a few-euro plan (I-02). [I-30](#i-30-business-model-and-the-paid-tier) slices 1 and 2 specify the metering and the quota.
- [ ] Rate-limit the public read route `GET /api/deck/[id]`. It serves any public deck to any caller with no key and no limit, and the middleware matcher skips `/api` (`src/middleware.ts`). #1312 limited the fields it returns (I-08); this item stays open until a limit is verified.
- [ ] Keep `docs/project/changelog.md` and `docs/project/progress.md` current after each merge batch, as the project instructions require. Neither changed between 2026-10-28 and 2026-11-09 while 196 commits reached `dev`; a catch-up is in preparation.
  - [x] Record merges #1111 to #1302 and recount the progress metrics (#1306). Later batches are recorded by their own `chore/docs` PRs.
- [ ] End the session when an account is deleted. `DELETE /api/user/profile` (`src/app/api/user/profile/route.ts`) deletes the user but does not sign out, sessions are JWTs valid for 7 days (`src/lib/auth/edge-config.ts`), and until #1319, on the next authenticated request, `resolveAuthenticatedUser` (`src/lib/auth/helpers.ts`) missed the id and re-created the user from the token's email, name and image, so a deleted account came back, empty, from any device still signed in. [I-38](#i-38-trust-safety-and-user-rights) slice 2 owns the tombstone and the regression test.
  - [x] Stop re-creating a deleted account. `requireAuth` now looks up only the user row the token names and answers 401 when it is gone; only the Playwright test bypass still upserts by email (#1319). The delete route still leaves the session cookie, so protected pages keep their signed-in chrome until sign-out.
- [ ] **H1, high:** accept only a same-origin `callbackUrl` at sign-in. After a password sign-in, `src/components/auth/SignInForm.tsx` navigates to the raw query parameter, and the CSP allows inline script (`src/lib/security-headers.ts`). So `?callbackUrl=javascript:…` runs in the app's origin, and an `https://` value redirects off-site. The form also shows any `?error=` text verbatim. Fix branch in flight: the guest-deck branch `fix/guest-deck-survives-sign-up` ([I-39](#i-39-first-run-activation-and-product-measurement) slice 2), no PR yet.
- [x] **H2, high:** stop linking a Google sign-in to an unverified account. `src/lib/auth/config.ts` set `allowDangerousEmailAccountLinking: true`, and `src/app/api/auth/signup/route.ts` creates a password account for any email without verifying it. An attacker who signed up with a victim's address took over the account when the victim first used Google. Signup's 409 also reveals which emails have an account. Shipped in #1321: the Google provider no longer sets the flag, so such a sign-in returns `OAuthAccountNotLinked` with a message to use the email and password. Google-first and already linked accounts are unchanged. The 409, email verification and linking Google from settings wait for an email sender (I-38).
- [x] **H3, high:** write the shared Scryfall caches on the server only. `POST /api/cache/search` and `POST /api/cache/cards` (`src/app/api/cache/*/route.ts`) stored any JSON a signed-in user sent, and `src/lib/scryfall/client.ts` returned it unchecked. One account could therefore forge the banlist and the Game Changer list that every player loads (`src/hooks/useBanlist.ts`, `src/hooks/useGameChangers.ts`). Shipped in #1322: both routes answer `GET` only, fill a miss from Scryfall on the server, check the body's shape and store under `srv1:` keys, so rows that clients wrote are never read again. Fills are limited per IP, per instance (M2).
- [ ] **M1, medium:** validate `POST /api/ai/suggest` with a bounded schema. `src/app/api/ai/suggest/route.ts` puts `bracketWarnings`, `detectedThemes`, `gameChangersList` and `categories` into the prompt with no size limit and no sanitising, so one free account can send very large prompts on the paid provider key. `/api/ai/build` already uses a bounded schema.
- [ ] **M2, medium:** keep rate limits in a shared store and add a per-IP login limit. `src/lib/rate-limit.ts` holds counters in each serverless instance's memory, and the login limit in `src/lib/auth/config.ts` is keyed on the email only, so trying one password across many emails is never limited. The AI quota above, the `GET /api/deck/[id]` limit and I-38's comment limits all need this store.
- [ ] **M3, medium:** bound user writes. The collection schemas (`src/app/api/collection/route.ts`, `src/app/api/collection/[id]/route.ts`) have no length limit and no row cap, and the search cache takes 500 KB per entry under unlimited keys. One account can fill the 512 MB database, and every write then fails. Cap field sizes and rows per user.
  - [x] Cap the shared Scryfall caches: 500 KB per search page, 50 KB per card, 200 unexpired search rows and 2,000 card rows, with expired and client-written rows deleted before each write (`src/lib/cache-limits.ts`, #1322). The collection limits remain open.
- [ ] **L2, low:** test that every API route declares its access. The middleware matcher skips `/api` (`src/middleware.ts`), so the API allowlist in `src/lib/auth/edge-config.ts` is never read, and a new route that forgets its guard is silently public. Add an inventory test that fails when a handler neither calls a guard nor appears in an explicit public list.
- [ ] Delete the components that are never rendered: `TemplatesModal`, `BudgetOptimizationModal`, `PricingShoppingListModal`, `SharePopover`, `DeckDescriptionEditor` and `DeckTagsEditor` in `src/components/deck/`, and `CardNoteInline` in `src/components/card/`. Outside their own files, nothing imports them on `dev` at `576f680`. `TemplatesModal` is the only caller of `GET /api/templates`, which returns two hard-coded fake templates ([I-39](#i-39-first-run-activation-and-product-measurement) slice 3), so both can go together. The hook `src/hooks/useTypewriter.ts` has no consumer either. I-08's primer-length item cites `DeckDescriptionEditor`; re-check it against the editor that is rendered.
- [ ] Keep the gate order explicit: typecheck, lint, unit tests, E2E policy, SonarCloud.
- [ ] Require SonarCloud open issues to be zero before PR creation or merge.
  - The checklist in `docs/engineering/quality-gate.md` requires zero open issues; nothing enforces it automatically yet.
- [ ] Record the E2E Docker strategy and required environment variables.
  - The strategy is documented in the "E2E gate" section of `docs/engineering/quality-gate.md`. The environment variables set in `docker-compose.e2e.yml` (`DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `AUTH_SECRET`, plus the Postgres service settings) are not yet listed there.
- [ ] Upgrade Prisma only after the local Node toolchain is at least 22.12.
- [ ] Confirm Scryfall's current per-endpoint request limits and bulk-data format against Scryfall's own documentation, then align the client limiter. `src/lib/scryfall/client.ts` sends `User-Agent` and `Accept` and serialises calls behind a 100 ms mutex, which honours a 10 req/s sustained ceiling but not a stricter per-endpoint search limit; bulk files are reported to have moved to gzipped JSONL on 2026-07-20. Scryfall blocks automated fetching, so a human must read the policy before the limiter changes.
- [x] Add request latency and failure visibility for profile, deck and Scryfall paths before adopting heavier observability.
  - `GET /api/decks` status and duration shipped in #1034. Profile and Scryfall paths remain open; do not close this item yet.
  - Profile mutation latency on `/api/user/profile` is recorded (#1132). Profile reads and other Scryfall paths remain open.
  - External card search and server-side search-cache outcomes shipped in #1036. Browser search diagnostics are not centralized; profile and other Scryfall paths remain open.

### Blocked or conditional work

- **Prisma 7:** blocked locally by Node 22.11; revisit at Node 22.12+.
- **Cloudflare R2:** only when avatars, deck media or generated artifacts need durable object storage.
- **Advanced observability:** Datadog, Better Uptime, Grafana, OpenTelemetry and PagerDuty stay parked until usage justifies their operational cost.
- **Analytics:** choose one privacy-conscious product analytics tool only after defining the product questions it must answer. [I-39](#i-39-first-run-activation-and-product-measurement) writes those questions, measures them first-party, and lists the cookieless candidates for page analytics.

### Definition of done

A staging PR cannot merge while type safety, tests, E2E policy, SonarCloud or production health checks are silently bypassed.

---

## I-06: Collection And Purchase Planning

**Outcome:** the player knows which cards they own, which printing to use and what the deck will cost to build.

**Status:** Shipped foundation, next refinement
**Priority:** Next

### Already shipped

- Collection tracking and ownership badges.
- Missing-card list, budget checks and shopping list.
- Basic-land defaults, bulk ownership actions and CSV export.
- Card prices and multi-format exports.
- Quantity-aware deck reconciliation that preserves surplus collection copies.
- Shopping-list prioritization, line totals, copied budget summaries and safe CSV escaping.
- Bulk collection additions now count each missing printing once across duplicate deck rows.
- Deck collection summaries allocate owned copies and proxies once per printing, so remaining quantities and costs stay accurate.
- The deck sidebar no longer offers a misleading Reset action that subtracts shared, globally owned cards; ownership changes are made from collection management.
- Deck collection and shopping-list totals now distinguish known-price subtotals from missing copies without a price instead of presenting an incomplete zero-dollar estimate.
- The shopping list stores a proxy-now or buy-later choice per signed-in player, deck and printing on the server (`AcquisitionIntent`, migration `20261102144500_add_acquisition_intents`), so the choice follows the account across devices, without mutating deck or collection ownership; buy-now copy and CSV exclude deferred cards. **Correction 2026-11-09:** this line and the scope below said the choice persisted only in the same browser.
- A private, read-only acquisition-plan API aggregates required copies across owned decks and subtracts collection quantities without changing ownership.
- The collection page now displays that cross-deck acquisition plan on demand, including missing quantities, contributing decks, a known-price subtotal, unpriced-copy disclosure, and refresh/retry states.
- The cross-deck plan exports a generic CSV of missing quantities with Scryfall printing IDs and known prices; owned copies are excluded.
- Collection cards now link to private decks using that exact printing, including the deck zone and quantity, without loading usage for every card up front.
- The collection acquisition plan can focus on one owned deck or all decks, keeping its summary and CSV export scoped to the selected view.
- The printing selector now puts exact owned editions first, shows combined regular and foil quantities, and offers an optional owned-only filter with an empty state (#978); choosing an edition remains an explicit action.
- The acquisition plan now shows a known-price subtotal for each missing printing and marks unpriced printings on their own rows.
- Each missing printing in the acquisition plan now links to the player's contributing decks, so the player can inspect where it is needed.
- Acquisition-plan rows now show the required copy count beside each contributing deck, making shared demand understandable without changing the aggregate purchase quantity (#1054).
- Missing-printing rows now also show already-owned copies, clarifying how much remains to acquire without changing ownership or the plan calculation (#1056).
- Commander-slot cards are included in the cross-deck acquisition plan even when their stored zone is not main; sideboard cards remain excluded (#1104).

### Remaining scope

- [ ] Track the actual owned printing, not only the oracle card.
- [ ] Prefer owned printings during direct add and import flows; the shared printing selector prioritizes owned editions and can filter to owned-only (#978), but automatic import matching remains open.
- [ ] Complete deck/collection reconciliation without mutating ownership accidentally; the unsafe deck-sidebar Reset action has been removed.
- [ ] Add region-aware price providers, starting with a clearly selected market.
- [ ] Support a synchronized "proxy now / buy later" workflow across devices. **Corrected 2026-11-09:** the per-deck choice, proxy now included, has been stored on the server since migration `20261102144500_add_acquisition_intents` (`src/app/api/decks/[id]/acquisition-intent/route.ts`, `src/hooks/useAcquisitionIntent.ts`). Still open: the cross-deck acquisition plan (`src/lib/collection/acquisition-plan.ts`) does not read these choices, and a proxy is a choice on one deck's shopping list, not card state in the collection.
- [ ] Consider mobile scanning only after the web data model supports printing-level ownership.
- [ ] Extend exact-printing usage beyond private decks to saved lists or acquisition plans; deck usage is now visible from the collection.
- [ ] Add explicit, persistent acquire state; the read-only cross-deck plan is now visible in the collection UI.
- [ ] Export or deep-link the acquisition plan to supported regional sellers while preserving printing, condition and finish choices.
- [ ] Break deck and acquisition cost down by vendor, category and price band instead of a single subtotal, once a region-aware provider is selected. Archidekt already offers this breakdown from its deck price overlay.
- [ ] Track proxies as explicit card state rather than only a PDF export and a per-deck shopping-list choice. ManaBox treats proxy and signed copies as first-class collection data, and the synchronized proxy workflow above depends on the same model.

**2026-11-09:** prices come only from Scryfall's `prices.usd` field. No code reads Scryfall's EUR or MTGO ticket prices, and nothing converts currency. Moxfield shows USD, EUR and tix; Archidekt shows per-vendor totals from TCGplayer, Card Kingdom, Cardmarket and Cardhoarder; ManaBox shows four sources with currency conversion. [I-32](#i-32-seller-handoff-affiliate-links-and-buy-this-deck-carts) takes the seller side of the regional-price and seller deep-link items above: disclosed affiliate links, a price source with display rights for a chosen region, multi-vendor prices and buy-this-deck carts on the seller's own site. I-06 keeps ownership, printing identity and the acquisition plan that I-32 hands off. [I-33](#i-33-the-marketplace-ladder-decision-record) records what lies beyond a hand-off, and the marketplace stays a non-goal.

### Definition of done

Importing or editing a deck produces a trustworthy owned, missing and estimated-cost view without conflating card identity with printing identity.

---

## I-07: Playtest And Iteration

**Outcome:** testing a deck teaches the player what to change.

**Status:** Shipped foundation, next refinement
**Priority:** Next

### Already shipped

- Opening hand, London mulligan and goldfishing. **Correction 2026-11-09:** before #1301 the mulligan drew one card fewer with no bottom choice and gave no free first mulligan. #1301 fixed both; see the checked scope below.
- Turn phases, life tracking, undo, battlefield, graveyard and exile.
- Session recording, result history, mulligan data and opponent-strength labels.
- Player-authored evidence notes and explicit self-reported methodology.
- Snapshot-linked sessions, a deterministic comparison engine, a private comparison API and an in-product snapshot evidence comparison with cohort-size disclosure and early-signal guidance.
- Recorded sessions now persist deterministic cards-seen and additional-draw evidence from the goldfish engine for later version analysis.
- Opening-hand evidence now distinguishes land balance from immediate castability, exposing missing mana colors and dead hands before the mulligan decision.
- Playtest results can link a separate proposed deck change to the player-authored evidence note, keeping observation and next experiment distinct in history.
- AI deck suggestions can use the latest private, user-owned playtest observations as bounded anecdotal context, scoped server-side by deck and account.

### Remaining scope

- [x] Present playtest comparison between deck snapshots in the product UI.
- [x] Surface missing-color and dead-opening-hand evidence alongside persisted mulligan and draw-progression signals.
- [x] Let the player attach a short evidence note to a result.
- [x] Associate a note with a proposed deck change.
- [x] Feed playtest evidence into AI prompts only as user-owned context, never as unexplained training data.
- [x] Keep the solitaire limitation explicit: recorded results are self-reported and are not tournament win rates.
- [x] Record a chronological, editable action log for zone moves, draws, casts, mana production, counters and life changes.
  - [x] Let players cancel an action-log edit with Escape without saving its draft (#1043).
  - [x] Filter visible actions and turn evidence by turn without truncating copied or downloaded logs (#1045).
  - [x] Filter visible actions by phase within the selected turn while keeping full-session exports (#1050).
- [x] Summarize playtest logs into turn-by-turn draw, mana and cards-seen evidence, then export the human-readable log and structured data.
  - [x] Let players copy the human-readable action log directly, with success and clipboard-error feedback (#1040).
- [x] Let players add required tokens, counters, dice and card copies during a goldfish session without mutating the decklist.
- [x] Follow the official mulligan in the playtest. The first mulligan is free in multiplayer and Brawl games (CR 103.5c) and not in duels, and a London mulligan draws seven and lets the player choose the cards to put on the bottom. See the [opening-hands guide](guides/commander-mulligans-curves-and-play-style.md#implications-for-magicaibuilder). Shipped in #1301: the playtest draws seven on every mulligan, the player picks the cards to bottom and their order, and Commander, Brawl and Oathbreaker get the free first mulligan; the E2E spec checks the free seven and the bottom choice.
  - Follow-ups from #1301: a per-session "multiplayer game" choice, since the rule is set by format and a 1v1 Commander or Oathbreaker game should not get the free mulligan; and disabling the record-result bar while a bottom choice is pending, because a result recorded then counts the cards still to bottom as extra cards seen.
- [x] Base opening-hand advice on the mulligan stage (first seven, free seven, six), the deck's cheap ramp and its land count, instead of fixed land thresholds (#1303).
  - Shipped in #1303: `keep-rules.ts` holds the guide's keep table as data, classes a hand by lands and ramp at mana value 2 or less, treats margins within 2% as judgment calls, and says when the guide has no computed rule. Commander only; other formats keep the land-balance hint.
- [x] Deal the deck that was built. The playtest dealt each deck row once whatever its quantity, shuffled the commander into the library, and dealt Sideboard and Considering rows. Measured on a 36-land Commander list: a 79-card library and hand with 19% lands, 59.8% of opening hands with 0–1 land, and the commander in the opening hand 8.7% of the time. Shipped in #1307: 99 cards, 36.4% lands, 20.3% and 0%. The fix deals each copy, adds a command zone that the commander starts in (CR 903.6) and returns to (CR 903.9a), and stops counting a cast commander as a card seen. Sessions recorded before the fix were dealt from the wrong library, so a comparison that mixes sessions from before and after it compares two different libraries.
- [x] Tie recorded sessions to the deck version played. `src/components/playtest/RecordResultBar.tsx` never sent a `snapshotId`, and `PlaytestComparisonPanel.tsx` skipped sessions without one, so the in-product snapshot comparison checked above never received a session recorded in the playtest. Shipped in #1315: `POST /api/decks/[id]/playtest-sessions` files a run without a `snapshotId` under the most recent snapshot that holds the deck as saved, or creates a `Playtest · <UTC time>` snapshot, in one transaction. Repeated runs on an unchanged deck share one snapshot, and the history panel no longer crashes on a session with a snapshot. [I-35](#i-35-pod-game-log-and-casual-results) slice 2 needs the same card-list hash to freeze the version of a real game.
- [ ] Add playtest hotkeys and a cheat sheet: draw, shuffle, next turn and moves to graveyard, exile and battlefield. Moxfield documents D, S, N, G, E and B, and Archidekt lists its keys with Shift+/. Today only the life tracker and the action log read the keyboard (`src/components/playtest`).
- [ ] Select several battlefield cards at once and act on them together, as Archidekt does with drag and Ctrl-click.
- [ ] Offer a popout view that hides the hand, for streaming and screen sharing. Archidekt offers one.
- [ ] Save a playtest and resume it later. Closing the playtest discards the game today.
- [ ] Let a player force chosen cards into the opening hand to test new cards. BlueprintMTG ships this as "New Card Trial", and a Moxfield feedback request asks for it.
- [ ] **Owner decision:** scripted opponent interaction. Archidekt's interaction simulator (about September 2026) rolls configurable removal, counterspells and attacks against the board after a chosen turn, with archetype presets and a log, and never acts on its own. BlueprintMTG's "Resistance Mode" bots cast scripted interaction during playtests, and its two r/EDH launch posts reached 742 and 585 points in July and August 2026. Playgroup.gg offers "phantom opponents" for solo playtesting, built from its tracked games. These are scripted or random events, not an AI opponent and not a rules engine. The roadmap's non-goal "Do not add an AI opponent or a full Magic rules engine under I-21" therefore does not clearly cover them. The owner should confirm whether scripted interaction is in scope for I-07 or I-21.

### Definition of done

A player can test two versions of a deck and see evidence that helps choose between them.

---

## I-08: Share, Compare And Learn

**Outcome:** public decks help players learn and improve while owners keep control of their work.

**Status:** Shipped foundation, next refinement
**Priority:** Next

### Already shipped

- Public profiles and public/private decks.
- Shareable read-only deck pages.
- Community discovery by commander.
- Ratings, reviews, votes, follows and threaded comments.
- Deck duplication and snapshots.
- Side-by-side comparison for two owned decks, including card and summary differences.

### Remaining scope

- [x] Extend side-by-side comparison from owned decks to public decks.
- [x] Fork a public deck with clear attribution and a clean ownership boundary.
- [x] Show "why this deck differs" using curve, budget and color identity.
- [x] Extend the comparison explanation with card-role differences.
- [x] Persist authenticated, deduplicated abuse reports for public decks without exposing moderation data publicly.
- [x] Provide a restricted moderation review queue API with auditable decisions.
- [x] Add the public-deck report action and moderator review interface before opening broader social features.
- [ ] Build a lightweight following feed only if discovery data shows repeated use.
- [x] Keep private decks and share tokens out of search indexes.
- [x] Provide a structured primer template covering game plan, mulligans, win conditions, key interactions and budget alternatives.
- [x] Render published primers with safe Markdown headings, lists and navigation.
- [x] Add explicit sequencing guidance to the structured primer template.
- [x] Let an owner mark a public deck as "seeking feedback" and ask a focused question instead of only exposing a generic comment box.
- [ ] Add in-product notifications for replies, mentions, follows and changes to explicitly watched decks, with per-event controls.
- [x] Persist private folders for saved public decks without claiming ownership or exposing decks that later become private.
- [x] Add folder management to the community UI.
- [ ] Decide whether decks from followed builders should share the saved-deck folder model.
- [x] Persist reusable community card packages with stable author attribution and private-by-default publishing controls.
- [x] Preview package additions against deck color identity, singleton and ban rules.
- [x] Apply a reviewed package diff without silently replacing existing cards.
- [x] Apply only individually ready package rows, even when a blocked row shares the same printing identifier (#861).
- [x] Reserve package copy capacity only for ready rows, so rejected rows do not prevent later valid additions within the existing limits (#863).
- [x] Return only public fields from `GET /api/deck/[id]`. For a public deck, `src/app/api/deck/[id]/route.ts` returned every `Deck` and `DeckCard` column except `shareToken` to any caller, signed in or not, including `folderId`, `budget`, `manualBracket`, `shareEnabled`, the owner's `userId` and each card's `notes`. Shipped in #1312: every viewer but the owner gets the fields of `PUBLIC_DECK_SELECT` (`src/lib/deck/public-deck-select.ts`), the visibility rule sits in the query, and the response types derive from the allowlist; the owner's view is unchanged. [I-36](#i-36-creator-and-embed-toolkit) slice 1 makes one public projection the rule for every public surface. The missing rate limit is an I-05 item.
- [x] Return only the fields the share view needs from `GET /api/share/[token]`. `src/app/api/share/[token]/route.ts` loaded the deck with `include: { cards: true }` and stripped only `shareToken`, so a link holder received `userId`, `budget`, `manualBracket`, `folderId`, each card's `notes` and every column added later. Shipped in #1325: the route reads `SHARED_DECK_SELECT` (`src/lib/deck/shared-deck-select.ts`), which lists only what the share page renders, and the share types derive from it. A private deck is still readable at its token. "Fork this deck" on a private deck's share page still fails, because the fork route requires a public deck. [I-38](#i-38-trust-safety-and-user-rights) records the same defect.
- [ ] Remove or bind the social image route. `src/app/api/og/route.tsx` renders a 1200×630 image from free-text `title`, `commander` and `colors` query parameters for any caller, and no page or test references it, so anyone can print arbitrary text under the product's name. [I-36](#i-36-creator-and-embed-toolkit) slice 2 replaces it with an image built only from stored deck data.
- [ ] Decide the primer's length limit together with its template. The server caps `Deck.description`, which holds the primer, at 2,000 characters (`src/lib/validation/deck.ts`, mirrored by `maxLength` in `src/components/deck/DeckDescriptionEditor.tsx`). The six-section template's own headings and prompts use 382 of them in English and 463 in French. I-37's split primer editor and I-36's video sections assume longer primers.
- [ ] **L1, low (security audit, 2026-11-10):** build a fork from the public fields only. `src/app/api/decks/[id]/fork/route.ts` loads the whole public deck, and `src/lib/deck/fork.ts` copies `budget`, `manualBracket` and every card's `notes` into the new deck and the 201 response, past `PUBLIC_DECK_SELECT`. Notes cannot be saved today (I-01); once they can, this becomes medium. Fix branch in flight: `fix/api-small-hardening`, no PR yet.
- [ ] **L6, low (security audit, 2026-11-10):** bound the commander discovery query. `src/app/api/community/commanders/[slug]/decks/route.ts` loads every public deck for the slug with all its votes and ratings, then keeps 50 in memory, with no rate limit and no cache. Aggregate the scores in SQL with `LIMIT 50`, and add `s-maxage`.

**2026-11-09:** MagicAIBuilder's social layer is evaluative: stars, votes, reviews, feedback questions and attributed forks. Moxfield's is broadcast: unique view counts, likes, a follow feed and embeddable decks, and TappedOut sells a blog widget. Creators value broadcast features, because a view count and an embed make a deck link worth posting. No embed route exists under `src/app` and the schema has no view counter. Embeds, public view counts, `[[Card]]` links in primers and video in primers are tracked in [I-36](#i-36-creator-and-embed-toolkit); notifications stay in this initiative. Archidekt's deck help requests (July 2026) add an expiry, a browse page and notifications to what "seeking feedback" does here.

**2026-11-09 (evening):** the deck reports and moderation queue checked above stay shipped. [I-38](#i-38-trust-safety-and-user-rights) now owns moderation beyond decks: reports on comments, reviews, profiles, packages and share links, signed-out notices, hide and restore actions, statements of reasons, appeals and blocking. Today a moderator can only mark a deck report reviewed or dismissed.

### Definition of done

A user can discover, inspect, compare and safely fork a deck without leaking private data or losing attribution.

---

## I-09: Meta And Evidence

**Outcome:** recommendations combine community patterns and competitive evidence without hiding uncertainty.

**Status:** Shipped foundation, next refinement
**Priority:** Next

### Already shipped

- EDHREC popular-card recommendations in the builder.
- Tournament deck imports and commander meta context.
- Player, event, date, placement and event-level context.
- Meta snapshots over time.
- Commander Spellbook combo data.
- Recommendation source and freshness disclosure.
- Each AI card suggestion now labels its generated rationale as AI-suggested, separately from any Scryfall verification (#1052).
- EDHREC recommendation rows disclose validated per-card sample counts when the source provides them.
- EDHREC feed contract checks reject malformed card lists so a source change does not overwrite reliable cached recommendations with a false empty result.
- EDHREC popular-card recommendations now rank distinct cards by observed inclusion across source categories before applying the top-20 limit; category order no longer hides more widely played cards.
- Meta trend comparisons now withhold reports when either endpoint snapshot is empty, rather than treating missing source data as a rise from zero or fall to zero. Non-empty snapshot bounds remain unchanged; broader trend disclosure work remains open.
- Meta trend cutoffs now use the same retained first entry per card name as measured shifts, so discarded duplicate values cannot distort entry and exit bounds.
- Stored EDHREC snapshots with inclusion outside the valid fraction range are excluded from trend history instead of producing impossible shifts (#1096).
- Empty historical snapshots no longer suppress an otherwise valid trend with a later non-empty baseline; an empty current snapshot still withholds the trend (#1104).
- MTGTop8 forms missing EDH archetypes now fail explicitly rather than silently falling back to a card-search contract (#1100).

### Remaining scope

- [ ] Complete source, timestamp and sample-window disclosure across every external recommendation surface; EDHREC sample counts are shown where available, but the source does not provide a trustworthy sampling date range.
- [ ] Separate "popular" (inclusion), "contextual association" (EDHREC Lift: inclusion in this context divided by inclusion in the reference set of potential decks), "tournament observed" and "AI suggested". Lift is centered on 1. It is not a win rate and it is not a causal claim. Show the cohort and denominator when the source provides them, and say when they are missing. Do not calculate a local Lift figure from the top-20 feed: that figure needs the reference denominator, a compatible source and an access contract first. See the 8 November 2026 notes in [`competitive-landscape.md`](./competitive-landscape.md).
- [ ] Add source-health telemetry and contract tests for every scraper or external feed; EDHREC card-list shape now has focused regression coverage.
  - [x] Reject malformed MTGTop8 search results so a false empty feed cannot overwrite a valid tournament cache (#1094). Other source-health coverage remains open.
- [ ] Add trend views that respect EDHREC top-20 truncation bounds.
  - [x] Avoid inferring a rise or fall bound from a snapshot with fewer than 20 distinct cards (#1098). Broader trend-view disclosure remains open.
- [ ] Revisit richer tournament statistics only under terms that allow this product to show them. Match-level cEDH data exists at TopDeck.gg; its terms are the block (see below).
- [ ] Adopt EDHREC's Lift semantics explicitly wherever a co-occurrence number is shown or ranked. Lift is a ratio centred on 1 — inclusion in context divided by inclusion at large — and replaced Synergy on `/commanders`, `/combos` and `/tags` on 2026-10-01. Label it as Lift with its definition available on demand; do not relabel it as a synergy percentage or sort it as one.
- [x] Re-check the Commander Spellbook integration against the per-deck and per-card combo endpoints added in v0.84.0 (2026-10-20), and cache identical card-list lookups so a much-viewed public deck cannot repeatedly hit the service. Show the prerequisites Spellbook lists with each combo, not only a card count: players' most-upvoted 2026 complaint about combo data is a "two-card" combo that needs a third card ([407 points, August 2026](https://www.reddit.com/r/EDH/comments/1vrt8ww/); [262 points, November 2025](https://www.reddit.com/r/EDH/comments/1oxuhqy/)). Shipped in #1324: one `find-my-combos` call per deck, a 6-hour cache keyed on the normalized card list, and each combo's other pieces, conditions, mana and Spellbook link in `CombosPanel`. The cache is per server instance, and only the first page of results is read.
- [x] Stop `/api/combos` acting as an open proxy to Commander Spellbook. `src/app/api/combos/route.ts` forwarded any `cards` value to `backend.commanderspellbook.com` for any caller, with no cache and no rate limit, and `fetchCombosForDeck` in `src/lib/combos/spellbook.ts` called it once per distinct card, about 100 lookups per deck view, cached only in the browser's memory. Shipped in #1324: `POST /api/combos` takes a bounded deck list, allows 30 lookups a minute per address and 60 Spellbook calls a minute per instance, and serves repeats from its cache. The limits are per instance (M2).
- [ ] **L3, low (security audit, 2026-11-10):** honour `?refresh` on `GET /api/meta/[commanderSlug]` only when it means true, and only for a signed-in user. `z.coerce.boolean()` in `src/app/api/meta/[commanderSlug]/route.ts` reads `refresh=false` as true, so any anonymous caller can skip the 24-hour cache and make the server scrape EDHREC and MTGTop8 again. Fix branch in flight: `fix/api-small-hardening`, no PR yet.
- [ ] Label data-sourced cuts apart from the copilot's AI cuts. EDHREC Recs scores adds and cuts for a pasted list (cut scores came back on 2026-10-22), and Archidekt shows EDHREC's recommended cuts in its editor since March 2026. Apply I-03's rules-aware check to data-sourced recommendations, so a popular card that cannot work with this commander is filtered or labelled.

### Blocked

- **Goldfish import:** blocked by its Cloudflare managed challenge; do not ship a parser that cannot work reliably.
- **Tournament win rate:** blocked by licence terms, not by missing data. MTGTop8 standings alone do not yield a win rate. Match-level cEDH data does exist: TopDeck.gg's API v2 returns each table's players in seat order and its winner. EDHTop16 computes a win rate (wins divided by wins, losses and draws) and shows each entry's record from TopDeck.gg data. Its GraphQL endpoint accepts only persisted queries, so it is not a usable public API (checked 2026-11-09). TopDeck.gg's [Developer Terms](https://topdeck.gg/developer-terms), effective 2026-10-27, forbid selling, licensing or otherwise commercializing API data (§7), and allow displaying public event data with a visible credit and link (§8.3, §6.1). Whether a paid product showing derived win rates counts as commercializing is unclear; a written clarification from TopDeck.gg is the cheapest unblocker. Reusing EDHTop16, cedhtools or cedhstats outputs likely inherits the same restriction. Casual pod logs ([I-35](#i-35-pod-game-log-and-casual-results)) are a different population and do not unblock this item.

### Definition of done

A recommendation is never presented as universal truth: the user can see where it came from, how fresh it is and what its limitations are.

---

## I-10: Interoperability And Integrations

**Outcome:** users can bring existing decks in, work on them here, and take the result wherever they play.

**Status:** Shipped foundation
**Priority:** Later

### Already shipped

- Imports from Moxfield, Archidekt, TappedOut, MTGTop8, MTGDecks and EDHREC.
- Plain-text exports mark every card-note line with an explicit comment prefix, so multiline notes and reserved section names cannot introduce cards or change zones during reimport. Notes remain readable in the export; note rehydration remains separate scope.
- Text URL imports recognize partner and Main, Sideboard and Considering headers when the source provides them.
- Downloaded text lists also recognize colon-terminated section headings, including counted and commented headings, without losing commander, partner or secondary zones (#844).
- Downloaded text lists recognize `Main Deck` after a secondary-zone heading, returning following cards to the playable main deck (#1082).
- Downloaded text lists treat a bare or commented `99` heading as the main deck, so cards after a Sideboard section return to the correct zone (#1078).
- Downloaded text lists accept uppercase X quantity markers alongside lowercase x without losing command or secondary zones (#867).
- Downloaded text lists accept lowercase and mixed-case trailing edition codes without including them in card names (#869); exact-printing restoration remains open.
- Exports for Moxfield, MTG Arena, MTGO, TappedOut, Archidekt, ManaBox, MTGGoldfish, EDHREC and plain text.
- Goldfish and EDHREC plain-list exports keep Sideboard and Considering cards out of the playable main deck.
- Archidekt exports now count and list only main-zone cards as Mainboard, preserving commander, partner and category tags. Dedicated secondary-zone Archidekt export remains open.
- Arena text exports preserve the selected companion in a dedicated section and include its sideboard copy only when absent, without changing the stored deck. Companion metadata and secondary-zone quantities are covered by local-parser round-trip tests; live Arena client import remains unverified.
- The Moxfield text exporter now retains companion, Sideboard and Considering headings instead of flattening zones. Our text parser round trip preserves roles and quantities; live Moxfield comment-header compatibility remains unverified, so external fidelity is still open.
- Versioned read-only external API under /api/v1.
- The URL import preview now discloses Scryfall-unresolved card names before confirmation, alongside names ignored by the source; front-face names of double-faced cards still resolve.
- Pasted plain-text imports now disclose unresolved names after import instead of implying complete success; resolved cards remain in the deck (#1023).
- Pasted decklists accept uppercase `X` quantity markers without changing card names, commander roles or secondary zones (#1080).
- Pasted lists show commander, zone copy counts and card rows before any deck mutation (#1063). The preview now checks names with Scryfall and discloses unresolved cards before confirmation (#1065); editing or closing the dialog invalidates the validation result.
- Pasted-list previews show both the commander and parsed partner or Background before confirmation, matching what the import will set (#1076).
- When no pasted card resolves, the preview keeps the missing-name warning visible but disables confirmation instead of reporting a successful zero-card import (#1074). Partially resolved lists remain importable.
- Pasted-list previews now disclose repeated card lines and commanders repeated in the main deck before confirmation (#1067), using the same canonical-name duplicate check as URL imports. The player can edit the pasted list; no automatic duplicate removal changes quantities.
- Each pasted-list preview row now labels its destination as Main, Sideboard or Maybeboard before confirmation (#1069). English and French labels are active; this is a visibility improvement, not a change to zone persistence or external round-trip fidelity.
- Missing-name warnings in the URL import preview are grouped across equivalent case, whitespace and apostrophe spellings, preserving the first spelling without merging imported rows or quantities (#848).
- Import duplicate warnings also recognize front-face and full names resolving to the same canonical Scryfall name (#865), preserving first imported spelling, rows, quantities and zones.
- Pasted decklists preserve Unicode names, accept commented or colon-terminated section headings, and recognize uppercase set codes without collector numbers. Scryfall lookup also handles copied smart apostrophes.
- URL imports accept supported addresses without a scheme and preserve zones from count-labelled headings. EDHREC average imports keep distinct cards across categories; previews warn about normalized duplicate lines and commanders repeated in the main list.

### Remaining scope

- [ ] Treat import/export formats as versioned contracts with fixtures.
  - [x] Quote carriage returns in deck CSV fields so card names and metadata stay within their cells (#846); spreadsheet-client import remains unverified.
  - [x] Retain printing-specific Scryfall IDs and application categories in simple and full deck CSV exports (#842). Missing printing IDs remain blank; CSV reimport and external category mapping remain open.
  - [x] Include a trailing Zone column in simple and full deck CSV exports, preserving main, sideboard and maybeboard values without changing existing column positions (#840). CSV reimport and command-zone rows remain separate scope.
- [x] Add an import preview that shows zones, commanders, missing cards and duplicate decisions.
- [x] Show both parsed commanders in a pasted-list preview when a partner or Background is present (#1076).
- [x] Validate pasted-list names before confirmation and show unresolved cards in its preview (#1065).
- [x] Prevent confirming a pasted-list preview when none of its cards resolves (#1074).
- [x] Show duplicate decisions in pasted-list previews using the URL preview's matching policy (#1067).
- [x] Preserve partner, companion, sideboard and Considering cards when a deck is exported, bulk-edited and reimported as plain text.
- [x] Export MTGO sideboard quantities as sideboard cards without including Considering cards in the playable list.
- [x] Keep MTGO XML valid and card names intact when names contain XML-reserved characters.
- [ ] Improve round-trip fidelity for categories, printings, companions and sideboards across external formats. EDHREC's October and November 2026 fixes for clipboard-to-Archidekt commander assignment and the Archidekt export link are a reminder to keep these fixtures current. They do not add a new integration.
  - [x] Preserve commander, quantities and secondary zones in downloaded plain-text lists using CR, CRLF or LF line endings (#836).
  - Import parsing and preview are more resilient, but exact printing and category round trips remain open; preserving a localized name does not guarantee that Scryfall resolves that language.
- [ ] Offer opt-in integrations only when authentication, rate limits and ownership are clear.
- [ ] Prefer a stable public API over brittle scraping whenever a partner provides one.
- [x] Treat the Moxfield URL import as a brittle path rather than a stable contract. Moxfield has no public API, now answers programmatic requests behind Cloudflare, and requires authentication headers on its internal endpoints; other tools have moved to paste and CSV as the supported route. Detect the blocked case explicitly and tell the player to paste the list instead of reporting a generic import failure.
  - Shipped in #1304: `fetchMoxfieldJson` (`src/lib/import/moxfield-client.ts`) is the only code that calls Moxfield, and it sends no `Origin` or `Referer` set to moxfield.com. A 403, a 429 or an HTML page becomes a typed refusal (HTTP 422, `moxfield_refused`), logged once as a warning and never retried, and the URL tab and the profile panel tell the player to paste the list in the Plain Text tab; the profile panel hides Retry for a refusal. Moxfield already broke third-party imports once in June 2026 by changing how deck data could be pulled ([EDHcheck, 2026-06-14](https://edhcheck.com/updates/light-mode-and-deck-builder/)).
- [ ] **Owner decision: the supported Moxfield route.** With honest headers, Moxfield answered both of the app's probes on 2026-11-09 with a Cloudflare block page (HTTP 403), so with the fix above Moxfield URL import fails for as long as Moxfield refuses honest requests. The options are to accept paste import as the supported Moxfield route, or to ask Moxfield for API access. No request has been sent to Moxfield. The source policy planned in [I-29](#i-29-cross-site-commander-deck-index) forbids headers that impersonate a source, so restoring the old headers is not an option.

**2026-11-09:** deck embeds for other websites are tracked in [I-36](#i-36-creator-and-embed-toolkit). A "play this deck" link to an online table such as Playgroup.gg or TableCommander would be an export contract here. Neither exists today.

### Definition of done

A deck can make a round trip through supported tools without silently changing commander, zone, quantity or ownership meaning.

---

## I-11: Localization And Regional Experience

**Outcome:** users can understand the interface and card data in a language and market they actually use.

**Status:** English and French shipped
**Priority:** Later

### Already shipped

- English and French UI routing.
- Locale switcher and catalog parity guard.
- Localized card names, type lines, rules text and card images where Scryfall provides them.
- Localized deck rows, tooltips, playtest zones and proxies.
- Playtest action-log turn and phase labels and human-readable exports follow the active English or French locale; player-authored descriptions and JSON data remain unchanged (#1042).
- AI suggestion evidence formats Scryfall USD prices for the active locale without relabeling them as local-market quotes (#980).
- AI suggestion evidence displays known card roles in the active locale, with a readable fallback for unknown provider categories (#1038).
- AI suggestion impact formats average mana value and known USD price for the active locale without implying a currency conversion (#1015).
- Deck creation wizard budget choices use the active English or French catalog, retaining their USD-denominated limits (#1017).
- Deck creation color choices announce localized names to assistive technology and use localized tooltips, while retaining the same mana symbols (#1019).
- Deck creation strategy and bracket descriptions use the active English or French catalog, preserving the underlying strategy and bracket values (#1021).
- Public deck card counts use the active English or French locale with singular and plural forms; the shared deck-count label is consistent across public and share views (#982).

### Remaining scope

- [ ] Finish and review one additional locale end to end before activating it.
- [ ] Keep dormant catalogs out of routing until human review is complete.
- [ ] Complete locale-aware currency formatting without implying that USD data is a local-market quote.
- [ ] Test dates, numbers, pluralization, mana symbols and card text together.
- [ ] Localize page metadata and complete hreflang. `generateMetadata` in `src/app/[locale]/deck/[id]/page.tsx` and `src/app/[locale]/commanders/[slug]/decks/page.tsx` writes English titles and descriptions in both locales. Sitemap entries (`entryFor` in `src/lib/seo/sitemap.ts`) carry `en` and `fr` alternates but no `x-default`, which the pages themselves declare through `buildAlternates`. [I-34](#i-34-commander-data-reports-and-indexable-data-pages) slice 1 adds `x-default` to the sitemap and requires localized metadata on every page it adds or touches.
- [x] Localize the editor's mobile controls. Below `lg`, the builder's tab labels "Search", "Deck" and "Stats" are hard-coded English in `src/app/[locale]/builder/[deckId]/page.tsx`, as are the search colour filter's tooltips, "White" to "Colorless". [I-37](#i-37-editor-depth-against-moxfield-and-archidekt) slice 7 replaces the tabs with a toolbar whose labels come from the message catalogues; I-13 owns its visual layer. Shipped in #1323: the tab bar and colour picker moved into `BuilderMobileTabBar` and `BuilderColorSearchPicker`, and they, the filters toggle, the title bar's action labels and the AI badge read `builder.*` keys, translated in French. Not checked in a browser.
- [ ] Translate the hard-coded English that the 2026-11-10 audit found on `dev` at `65e6230`: about 180 user-visible strings in five bundles. Several components hard-code a string that already has a catalog key.
  - [ ] Bundle 1, deck views and public pages: about 38 strings in 12 files, such as the "AI" badges, "Fork" and "Save" on a public deck (`src/components/profile/PublicDeckActions.tsx` has no `useTranslations`), the default name "New Deck", and an average rating shown as "4.5" in French. Fix branch in flight: `fix/i18n-public-deck-views`.
  - [ ] Bundle 2, builder, card, playtest and collection panels: about 45 strings in 20 files, such as the card flip and add labels, the playtest counter buttons, recommendation freshness and the companion rule text built in `src/lib/deck/companion.ts`. Averages and percentages are formatted with `toFixed` and `` `${n}%` `` instead of the locale.
  - [ ] Bundle 3, import, export and rules browsing: about 30 strings in 8 files: the Moxfield profile panel, proxy export, the set autocomplete hint, rules pagination and the rules effective date. Fix branch in flight: `fix/i18n-import-export-rules`.
  - [ ] Bundle 4, API and thrown errors shown verbatim: sign-up, the sign-in `?error=` codes, API keys, meta, URL import, Scryfall, snapshots, deck creation, AI build progress and AI suggestions. Each route should return a stable `code` that the client maps to `t()`, as `/api/import/url` already does for a Moxfield refusal.
  - [ ] Bundle 5, deck-store toasts: 34 strings in `src/lib/deck/store.ts` and `src/lib/deck/commander-save-recovery.ts`. Let `useToastStore().add()` take a `{ key, values }` descriptor that `ToastContainer` translates, so the store stays free of React and locale.
- [ ] Translate the French keys still equal to English: the whole `deck.ratings.*` block (about 19 keys), `profile.followers`, `followingCount`, `signInToFollow`, `followFailed`, `badgeCommunityBuilder` and `badgeHighlyRated`, plus `deck.comparison.secondDeck` and `deck.stats.removal`. In all, 136 of 1,385 French values equal English, most of them legitimately (Foil, CSV).
- [ ] Type-check `t()` keys. next-intl has no `AppConfig` `Messages` augmentation in the repo, so a misspelt key is not a `tsc` error.
- [ ] Merge the two catalog parity tests. `src/i18n/catalog.test.ts` repeats for French the key-parity check that `src/i18n/messages.test.ts` runs for all ten locales, and neither compares values.
- [ ] Stop new hard-coded strings with lint: `react/jsx-no-literals` with an allowlist of about 36 punctuation and brand strings, plus a targeted `no-restricted-syntax` rule for literal `aria-label`, `title`, `placeholder` and `alt` text. The first comes from `eslint-plugin-react`, already installed through `eslint-config-next`, and the second is core ESLint, so no dependency is added. Land them with the last of bundles 1 to 3, so `pnpm lint` stays at zero warnings. Lint cannot see strings in `src/lib`; bundles 4 and 5 fix those at the source.

### Definition of done

A locale is activated only when its navigation, warnings, dates, prices and card surfaces are translated and tested as one experience.

---

## I-12: Local AI

**Outcome:** explore private or offline deck assistance without compromising the core product.

**Status:** Experimental / parked
**Priority:** Later

### Guardrails

- [ ] Define a real user need first: privacy, offline use, cost or latency.
- [ ] Benchmark local models against the golden evaluation set from I-02.
- [ ] Keep deterministic card data and legality services outside the model.
- [ ] Make model choice and data retention explicit.
- [ ] Do not add local inference infrastructure before cloud AI usage and quality are measured.

### Definition of done

A local model is only promoted if it matches the required quality for a clearly defined workflow at an acceptable cost and latency.

---

## I-13: Product Visual Redesign

**Spec:** [`specs/i13-visual-direction.md`](specs/i13-visual-direction.md)

**Outcome:** a player can find, build, understand and share a Commander deck in an interface that feels coherent, distinctive and calm even when card data is dense.

**Status:** In progress
**Priority:** Next

Lumen foundations and several surfaces shipped and were promoted to `main` on 2026-11-06 (#1272, #1273). That promotion is not acceptance of the definition of done. The five delivery slices below stay open.

### Already shipped

- Lumen light and dark foundations: shared tokens, radii, soft shadows, an explicit theme choice, and a header that can follow the system (#1259).
- The landing page uses the shared Lumen type, accent, pills and raised cards in both themes (#1265).
- The collection page uses the shared field, button and card primitives, with the acquisition plan beside the card list on wide screens (#1266).
- Public decks and discovery show card imagery, category chips and a name filter on the loaded list, with restyled detail panels (#1267). Source-aware recommendation evidence is unchanged.
- Import, export, collection, review, comment and settings forms use the shared field and button primitives (#1268).
- Deck library controls use Lumen pills and fields, deck actions stay available to the keyboard, and the loaded list filters by deck or commander name (#1269).

No separate design-reference document was added with these slices. Screenshot regression, tablet layout and the full accessibility and performance matrix remain open.

### Inspiration and boundaries

- Take inspiration from Moxfield's efficient deck workflow and presentation, and from EDHREC's October–November 2026 redesign and follow-up: visible card context, legible evidence, purposeful filters, configurable views, tooltips that leave the art usable, image loading that keeps already seen images, and layouts that hold up on tablet widths. Sources: [redesign](https://edhrec.com/articles/changelog-edhrec-redesign), [follow-up](https://edhrec.com/articles/changelog-redesign-follow-up), [performance](https://edhrec.com/articles/changelog-big-performance-upgrades).
- Do not copy either product's layout, artwork, branding or interaction details. Keep MagicAIBuilder's explainable AI, legality, playtest and ownership workflows recognizable.
- Keep source attribution and statistical uncertainty readable. A prettier recommendation must not look more certain than its data supports.
- Treat narrow and tablet web widths as part of responsive quality. A native mobile application is not in scope.
- **Design constraint (2026-11-09): do not look AI-made, and do not bury power-user flows.** EDHREC's October 2026 redesign drew a backlash on r/EDH: under ["New EDHREC Design"](https://www.reddit.com/r/EDH/comments/1x7v653/) the top replies were "I think its trash and is worse for building decks" (394 points) and "vibe coded crap" (233). Under the r/magicTCG announcement, an AI-use question was the top reply (311) and "How do I switch back to the old one?" reached 116 ([thread](https://www.reddit.com/r/magicTCG/comments/1x56apg/)). Commenters under BlueprintMTG's launch listed rounded icon and box edges, hollow coloured icons, the header and the font as tells of an LLM-generated site ([thread](https://www.reddit.com/r/EDH/comments/1vzwh0m/)). Treat the click depth of filters, sorts and grouping as a regression metric, and review each Lumen surface for generic AI-template styling before acceptance.
- The cheapest visible wins against Archidekt found on 2026-11-09 are a Stacks view, collapsible and sticky category headers, a static card panel with printing and category controls, a mobile editing toolbar and statistics that focus the cards behind a chart. They are tracked in [I-37](#i-37-editor-depth-against-moxfield-and-archidekt); this initiative owns their visual layer. "Faster than Moxfield" is the bar players notice first and no reviewer has measured it, so the performance validation below should include a timed comparison with a Moxfield deck page of the same size.

### Delivery slices

- [ ] Audit the current dark/light surfaces and agree a visual direction, typography, spacing, color, elevation, motion and component tokens in a reusable design reference. Lumen tokens are implemented (#1259); the written reference and the audit it records are still open.
- [ ] Refine navigation and the deck library so search, deck state, commander identity and next actions are immediately scannable. Library controls, keyboard-visible actions and a loaded-list name filter shipped in #1269. Commander identity and next-action hierarchy remain open.
- [ ] Refine the deck editor's dense workspace: card views, commander context, actions, warnings and analytics, without hiding existing workflows or introducing layout jumps.
- [ ] Refine public decks, discovery and recommendations around card imagery, source-aware evidence, clear filters and consistent detail panels. Imagery, category chips, a name filter and restyled panels shipped in #1267. Source-aware evidence and recommendation filters remain open.
- [ ] Validate the redesigned journeys at narrow, tablet and wide web widths, with keyboard and screen-reader access, light/dark contrast, visual regression coverage and measured loading/interaction performance. Include tooltips that do not cover the card, and image loading that keeps already seen images available. Run code validation on the VPS. #1270 covers banner and preview stability in the editor and does not close this slice.

### Definition of done

The deck-library-to-editor-to-share journey is visually coherent and remains at least as usable as before; accessibility, responsive, performance and regression checks pass, and each redesigned slice has QA acceptance evidence before promotion.

---

## I-14: Verifiable Natural-Language Search

**Spec:** [`specs/i14-verifiable-natural-language-search.md`](specs/i14-verifiable-natural-language-search.md)

**Outcome:** a player can describe a card function in English or French, read the Scryfall query that search will run, edit it, and get the cards that query returns.

**Status:** Next
**Priority:** Next
**Impact / effort:** High / medium

This is search, not a new deck generator. DeckCheck Smart Search and Farseek are the references. I-02 still owns constrained deck plans.

### Scope

- [ ] Translate an English or French description into one Scryfall query the player can read before any search runs.
- [ ] Let the player edit that query, and run the edited text.
- [ ] Return only cards the executed Scryfall query produces. Invent no card names.
- [ ] Preserve the active format, color-identity and legality context on the generated query and on the edited query.
- [ ] Cover both languages with regression tests, and offer an explicit return to syntax-only search.
- [ ] Leave the current deck unchanged. This flow does not add or cut cards.
- [ ] Show a card's Scryfall Tagger function tags in the builder as clickable search facets, and offer "find similar cards" as a visible, editable `otag:` query built from those tags. No model is involved. Before building, confirm how a card's tag list can be read under Scryfall's terms: `otag:` works in Scryfall search, but whether tag lists are exposed in the API or bulk data was not verified.

**Demand evidence (2026-11-09):** search by function rather than popularity is a loud, recurring request on r/EDH, and no initiative named Tagger before this. ["Scryfall cheat sheet or: How I Learned to Stop Using EDHRec"](https://www.reddit.com/r/EDH/comments/1k0ih2q/) reached 909 points (April 2025), ["PSA: Check the scryfall tagger"](https://www.reddit.com/r/EDH/comments/1lc7cu9/) 425 (June 2025) and ["PSA: Viewing Scryfall Tags to Find Similar Cards"](https://www.reddit.com/r/EDH/comments/1wxxui2/) 246 (October 2026). A browser extension, MoxTags, adds Scryfall tags to Moxfield, and Archidekt has applied Oracle tags as categories since July 2026. Players reject AI search tools that hide their query; under OffMeta, a commenter asked for each part of the generated query to be shown as an editable assumption ([January 2026](https://www.reddit.com/r/EDH/comments/1q8czkc/)), which is this initiative's design.

### Definition of done

For a fixed description and deck context, the player sees one Scryfall query, can change it, and receives only cards that query returns, with the legality context unchanged.

---

## I-15: Rule 0 Sheets And Pod Profiles

**Spec:** [`specs/i15-rule-zero-sheets-and-pod-profiles.md`](specs/i15-rule-zero-sheets-and-pod-profiles.md)

**Outcome:** a playgroup can share intentions and house rules before a game, and can tell those preferences apart from official rules.

**Status:** Next
**Priority:** Next
**Impact / effort:** High / medium

CommanderSalt, DeckCheck DTI and EDHREC salt are the references for describing how a deck feels. None of them is a matchmaking authority.

### Scope

- [ ] Record intentions, combos, extra turns, resource denial, proxies and house rules on a per-deck or per-pod sheet.
- [ ] Keep the profile private by default, and share it only with an explicit consent action.
- [ ] Compare up to four decks on the same sheet.
- [ ] Keep preference and salt-style scores separate from official rules, bracket and ban data.
- [ ] State on the sheet that it does not guarantee a balanced game.

### Definition of done

Four players can compare consented profiles and see house preferences distinguished from official rules.

---

## I-16: Decks Buildable From A Collection

**Spec:** [`specs/i16-decks-buildable-from-a-collection.md`](specs/i16-decks-buildable-from-a-collection.md)

**Outcome:** a player can start from owned cards and see which commanders or lists those cards can build, including free copies and the cost of what is missing.

**Status:** Next
**Priority:** Next
**Impact / effort:** High / medium to large
**Depends on:** I-06 printing-level ownership. Do not rank lists against oracle identity alone while cost still depends on the printing.

MTGGoldfish SuperBrew and Mana For Cards Discover are the references. This initiative ranks candidates from the collection. I-06 still reconciles a deck the player has already chosen. Validate demand before a large build.

### Scope

- [ ] Rank candidate lists or commanders by how much of the collection they cover.
- [ ] Use Oracle identity for color identity and legality, and printing identity for price.
- [ ] Offer a free-cards mode that treats copies already allocated to other decks as unavailable.
- [ ] Show where each candidate list came from, and mark unknown prices on their own.
- [ ] Leave collection ownership and the open deck unchanged while ranking.

### Definition of done

A collection produces a ranked, sourced view of buildable lists that shows free copies and unknown prices, without changing ownership.

---

## I-17: Precon Path And Tiered Upgrades

**Spec:** [`specs/i17-precon-path-and-tiered-upgrades.md`](specs/i17-precon-path-and-tiered-upgrades.md)

**Outcome:** a player can open a dated official precon, see the diff from that list, and apply a reversible budget bundle on a separate working copy.

**Status:** Next
**Priority:** Next
**Impact / effort:** High / medium

EDHREC precon upgrades, DeckCheck and Farseek are the references. Generic budget suggestions stay in I-02.

### Scope

- [ ] Keep a versioned catalog of official precon lists, each with a dated source.
- [ ] Show the diff from the sealed list, and keep the commander until the player changes it.
- [ ] Offer editorial swap bundles by budget band, separate from I-02 suggestions.
- [ ] Apply each bundle to a distinct working copy, and make the bundle reversible.
- [ ] Label every price as an estimate, not a guaranteed quote.

### Definition of done

A player can open a dated precon, preview a budget bundle, apply it to a working copy, and reverse it without altering the source list.

---

## I-18: Per-Deck Radar Of New Cards

**Spec:** [`specs/i18-per-deck-radar-of-new-cards.md`](specs/i18-per-deck-radar-of-new-cards.md)

**Outcome:** a player can ask which newly released, legal cards matter for one deck, read a sourced reason, and adopt a card only from a visible diff.

**Status:** Later
**Priority:** Later
**Impact / effort:** High / medium to large

DeckCheck Deckhand reports and EDHREC set pages are the references. The first slice is on demand. I-08 already owns social notifications, and this radar does not add them until the on-demand flow has been validated.

### Scope

- [ ] On request, filter a dated set corpus to cards that are legal in that deck.
- [ ] Explain each candidate from a named source, one deck at a time.
- [ ] Show a diff before a card is added. Never change the deck automatically.
- [ ] Deduplicate candidates and cap the compute spent on one request.
- [ ] Add notifications only as a later opt-in, after the on-demand flow is validated.

### Definition of done

A player can request a sourced, legal shortlist for one deck and accept or ignore each card from a visible diff.

---

## I-19: Offline Game-Night Viewing

**Spec:** [`specs/i19-offline-game-night-viewing.md`](specs/i19-offline-game-night-viewing.md)

**Outcome:** a player can choose one deck and read that deck, its primer and its tokens without a network.

**Status:** Next
**Priority:** Next
**Impact / effort:** High / large

ManaBox offline search is the reference. This slice is a voluntary read-only cache. A multi-device offline editor is out of scope. Local inference stays in I-12.

### Scope

- [ ] Let the player download one deck, including its primer and required tokens.
- [ ] Open that download read-only while offline.
- [ ] Show the date of the cached copy.
- [ ] Purge the private cache on sign-out, so one account's deck is not left for the next account on the device.
- [ ] Cover airplane-mode reading in tests.

### Definition of done

After an explicit download, the chosen deck, primer and tokens remain readable offline and are removed from the device when that account signs out.

---

## I-20: Collaborative Review

**Spec:** [`specs/i20-collaborative-review.md`](specs/i20-collaborative-review.md)

**Outcome:** an owner can invite someone to propose a deck patch, then accept or reject that patch without handing over the deck.

**Status:** Later
**Priority:** Later
**Impact / effort:** Medium / large

Archidekt collaborators are the reference. Comments, "seeking feedback" and forks stay in I-08. Live co-editing is a later product, not this initiative.

**Demand evidence (2026-11-09), for the owner:** the two most-upvoted launches of a new deckbuilder on r/EDH in 2026 led with this job. BlueprintMTG's posts reached 742 points in July and 585 in August 2026, built around feedback links whose suggestions the owner accepts or rejects, and around the observation that "many of the deck feedback requests in the subreddit just don't get any responses" ([July](https://www.reddit.com/r/EDH/comments/1uqynon/), [August](https://www.reddit.com/r/EDH/comments/1vzwh0m/)). MainTable shipped owner-approved suggestions on 2 November 2026. The evidence argues for moving I-20 earlier. Its priority is unchanged here; that is the owner's decision.

### Scope

- [ ] Invite a collaborator with a revocable role that can propose a patch and cannot publish it.
- [ ] Let the owner accept or reject the patch, and keep an attribution log.
- [ ] Preserve version history so a patch does not silently overwrite the deck.
- [ ] Keep the owner's private collection inaccessible to the collaborator.
- [ ] Leave real-time co-editing out of this initiative.

### Definition of done

A collaborator can propose a change, the owner can accept or reject it, and the deck history shows who proposed what.

---

## I-21: Reproducible Probability Bench

**Spec:** [`specs/i21-reproducible-probability-bench.md`](specs/i21-reproducible-probability-bench.md)

**Outcome:** a player can compare thousands of simulated hands between two deck snapshots under an explicit mulligan policy, and can rerun the same comparison.

**Status:** Later
**Priority:** Later
**Impact / effort:** High / large

Deckstats hand analysis and Archidekt odds are the references. I-07 still owns recorded goldfish logs and manual snapshot comparisons. This bench does not replace them.

**Market correction (2026-11-09):** the [spec](specs/i21-reproducible-probability-bench.md#what-the-market-does) said no tool publishes a seed or compares two lists. Both claims were wrong. EDHTuner runs paired solo games on the same shuffle seeds with and without a swap, requires a recommendation to clear a statistical bar and a practical one, gives the same result for the same deck and shares a link that replays the analysis ([methodology](https://edhtuner.com/methodology)). The open-source `mtg-mcp-server` simulates opening hands with the free mulligan and a `seed` option ([listing](https://glama.ai/mcp/servers/Cladios34/mtg-mcp-server/tools/simulate_opening_hands)). DeckFlow already simulates castability on the player's list with the free mulligan and the London bottom ([analyzer](https://www.deckflow.gg/manabase)). No tool found shows a confidence interval with its sample size, or a "not distinguishable at this sample size" verdict with the sample that would be needed. Those remain this initiative's differentiators. Every simulator found also uses a hand-written keep rule. A rule solved for the player's own list is an analysis of a single list, which belongs to [I-31](#i-31-deck-lab-analysis-run-on-your-own-list).

### Scope

- [ ] Simulate a visible sample of hands for two snapshots and report color availability and land drops on turns 2 through 5.
- [ ] Apply an explicit mulligan policy, and show the seed, sample size, intervals and assumptions.
- [ ] Model the multiplayer free mulligan and the London bottom choice in every policy, and offer the per-bracket keep rules of the [opening-hands guide](guides/commander-mulligans-curves-and-play-style.md) as named policies.
- [ ] Include a statistical comparison of the two samples.
- [ ] Stay short of an AI opponent and a full Magic rules engine.
- [ ] Leave I-07's action logs and player-authored snapshot comparisons unchanged.

### Engineering enablers

- The same seed and sample size reproduce the reported intervals.
- Tests cover the statistical summary, not only a single shuffled hand.

### Definition of done

Two snapshots can be compared from a recorded seed and sample size, and a rerun with the same inputs reproduces the reported intervals.

---

## I-28: Commander Deckbuilding Guide By Bracket

**Spec:** [`specs/i28-commander-deckbuilding-guide-by-bracket.md`](specs/i28-commander-deckbuilding-guide-by-bracket.md)
**Content:** [`guides/commander-deckbuilding-by-bracket.md`](guides/commander-deckbuilding-by-bracket.md) and its companion [`guides/commander-mulligans-curves-and-play-style.md`](guides/commander-mulligans-curves-and-play-style.md)

**Outcome:** a player who picks a target bracket can learn what a deck at that bracket contains, how its games unfold and how to tell when a deck belongs elsewhere, then check their own list against it.

**Status:** In progress
**Priority:** Next
**Impact / effort:** High / medium

Wizards publishes the rules but no deckbuilding guidance. EDHREC, CoolStuffInc and Card Kingdom publish guidance without evidence labels, and data sites publish numbers without explanation. No French step-by-step guide was found. I-27 explains a rule when a warning fires and explicitly leaves strategy out; this initiative owns the strategy, labeled as official, measured or community advice.

### Scope

- [x] Correct the bracket names and descriptions players see in the deck wizard, and the bracket rules given to the copilot: bracket 2 is Core with zero Game Changers, bracket 3 Upgraded, bracket 4 Optimized, and cEDH is bracket 5. Use the official French names with the "bracket" alias. Shipped in #1300: the wizard's picker shows the official English names, the French "Catégorie N — Nom (bracket N)" form, and each bracket's Game Changer limit and turn floor. The copilot prompt reads one set of bracket rules for brackets 1 to 5, and the build route's duplicate bracket table is gone. The dormant catalogs carry the English text, held equal to English by a test until a native review.
- [ ] Extend the bracket definitions to bracket 5 and to the official restrictions on mass land denial, extra turns and two-card combos, and remove the tutor restriction Wizards dropped on 2025-10-21. Still open after #1300: `BRACKET_DEFINITIONS` (`src/lib/constants/brackets.ts`) names bracket 1 "Casual", sets `allowsTutors: false` for it and stops at bracket 4; the wizard's picker offers brackets 1 to 4; and `src/lib/deck/bracket.ts` still forces any two-card infinite to bracket 4, with the warning `deck.bracket.infiniteCombos` labelled "(RC rule)" in every locale.
- [ ] Publish a static, indexable guide page with one section per bracket, from the researched document, with every claim labeled Official, Data or Community and linked to a dated source.
- [x] Make the rules pages reachable signed out. `/rules/game-changers` and `/rules/comprehensive` were in neither public-path list (`PUBLIC_PATH_PREFIXES` in `src/middleware.ts`, `PUBLIC_API_AND_PAGE_PATHS` in `src/lib/auth/edge-config.ts`), although the header and the landing page link to them, so visitors and crawlers were sent to sign-in. Shipped in #1313: the public page paths, `/rules` included, live once in `src/lib/auth/public-paths.ts`, which both the middleware and the `authorized` callback read. [I-34](#i-34-commander-data-reports-and-indexable-data-pages) slice 2 adds their alternates and localized metadata, and keeps the verbatim Comprehensive Rules `noindex`.
- [ ] Render the guide's official rules from the same definitions the bracket analysis uses, so the two cannot disagree.
- [ ] Link the bracket badge and the wizard's bracket step to the matching section without losing deck state.
- [ ] Check the open deck against a chosen bracket, separating official limits it breaks from composition ranges it falls outside, without calling the model or blocking a save.
- [ ] Teach opening hands per bracket and play style: the free mulligan, keep rules built on cheap ramp, and the land plateau for the deck's curve. Report the open deck's own keep profile under the multiplayer rules.
- [ ] Ship reviewed English and French content; hide sections not reviewed in a locale.
- [ ] Show the rules state the guide reflects, and open a review whenever Wizards changes brackets, Game Changers or the banned list.

### Engineering enablers

- A test fails when a guide claim has no label or no dated source.
- A test fails when the guide's official rules diverge from the bracket definitions.

### Definition of done

A player can open the section for their target bracket from the deck, read sourced guidance in English or French, and see which official limits and composition ranges their list meets, with the guide and the bracket analysis stating the same rules.

---

# 2027 Horizon

The initiatives above carry the work already committed. The six below extend the pipeline into 2027. Each comes from a **verified gap** in the 2026-11-08 market sweep, not from a brainstorm, and each names the evidence that produced it.

Read them as hypotheses with a stated basis, not as commitments. A 2027 initiative is promoted to Next only when its spec's open questions are answered and its dependency has shipped.

**I-29 was added on 2026-11-09**, after the sweep and at the owner's request, from its own dated research. It is the seventh initiative in this horizon. I-30 to I-37, added the same day from a research pass on the owner's goals, are not part of this horizon: four of them are Next and one is Next in part, so they sit in their own section, [Business, Reference And Depth](#business-reference-and-depth), after the list of what the sweep ruled out. I-38 to I-46, added that evening, follow in [Trust, Growth And The Physical Table](#trust-growth-and-the-physical-table).

**Why six and not twenty.** Beyond these, the sweep stopped producing gaps the product is positioned to fill. Adding further initiatives would mean inventing them, which fills a roadmap without filling a pipeline. The honest way to extend 2027 further is another dated sweep, not a longer list. The 2026-11-09 pass on the owner's goals was such a sweep, and it produced I-30 to I-37.

---

## I-22: Verification As A Public Surface

**Spec:** [`specs/i22-verification-as-a-public-surface.md`](specs/i22-verification-as-a-public-surface.md)

**Outcome:** another tool, a Discord bot or a tournament organiser can submit a decklist and receive the same deterministic verdict a player sees in the product, with its rules and its data dates.

**Status:** Later
**Priority:** Later — 2027
**Impact / effort:** High / medium
**Depends on:** I-02's claim typing. Do not expose a verdict whose provenance is not yet modelled internally.

The sweep found six products generating decks and none publishing what was checked. The product's validator is its differentiator, and a differentiator nobody can call is a feature; a differentiator other tools depend on is a position. A read-only `/api/v1` already exists, so the surface is an extension rather than a new system.

### Scope

- [ ] Accept a decklist and a format, and return the deterministic verdict: legality, colour identity, singleton, banlist, Game Changers, bracket inputs.
- [ ] Return the rule and the data date behind every judgement, never a bare boolean.
- [ ] Version the contract, and keep an older version answering while a newer one exists.
- [ ] Rate-limit and authenticate per consumer, with a documented quota.
- [ ] Publish no recommendation through this surface. Verification only.
- [ ] State in every verdict that no language model produced it, and link the AI-use disclosure page planned in I-02. On r/EDH undisclosed AI is now a reason to dismiss a tool (I-02's 2026-11-09 findings), so a verdict that is visibly model-free is the form of the product that community accepts.

### Definition of done

A third party submits a list and receives a versioned, dated, rule-level verdict that matches what the product shows its own players for the same list.

---

## I-23: The Pod's Own Surface

**Spec:** [`specs/i23-the-pods-own-surface.md`](specs/i23-the-pods-own-surface.md)

**Outcome:** a playgroup can ask for a deck's bracket, Game Changers and Rule 0 sheet inside the Discord server where it already argues about them, without anyone opening a browser.

**Status:** Later
**Priority:** Later — 2027
**Impact / effort:** Medium / medium
**Depends on:** I-15 pod sheets, and I-22 if the surface is built on the public contract rather than a private one.

Otterly MTG, Mana Grove's `/bracket` command and several Commander companion bots already live in these servers, which is the evidence the demand is real. None of them carries a pod's declared Rule 0 agreement — that is I-15's artifact, and Discord is where the conversation it supports actually happens.

### Scope

- [ ] A command returning a deck's bracket and Game Changers with their data dates.
- [ ] A command rendering a consented Rule 0 sheet; never an unconsented one.
- [ ] Explicit, revocable linking between a Discord account and a product account.
- [ ] No deck mutation from the bot. Read and report only.
- [ ] State the same uncertainty the product states. A bot reply is not permitted to sound more certain than the web surface.

### Definition of done

A pod reads a consented sheet and a dated bracket in its own server, and nothing the bot can do changes a deck.

**2026-11-09 (evening):** [I-46](#i-46-discord-and-chat-integrations-for-pods-and-creators) builds the Discord app these commands would run in and answers the first scope item for public decks without account linking. I-23 keeps linking, consented sheets and `/pod`; whether to merge the two is an owner question in the status note.

---

## I-24: Decks A Screen Reader Can Play From

**Spec:** [`specs/i24-decks-a-screen-reader-can-play-from.md`](specs/i24-decks-a-screen-reader-can-play-from.md)

**Outcome:** a blind or low-vision player can read a complete deck — names, costs, full Oracle text, zones and tokens — through assistive technology, and take that reading to a table.

**Status:** Later
**Priority:** Later — 2027
**Impact / effort:** Medium / medium

Blind players reach Magic today through community work: NFC tags on sleeves read by a phone, and a fan-made screen-reader mod for Arena. Braille failed because it thickens cards and marked cards are a disqualification risk. No deckbuilding site in the sweep publishes an assistive-technology-first output. The product already generates text exports and proxy PDFs, so the distance is short and the position is uncontested.

### Scope

- [ ] An export shaped for screen readers: structured headings per zone, full Oracle text, costs spelled out rather than symbol-only.
- [ ] Mana symbols carry text alternatives everywhere, including in the deck view.
- [ ] Make the deck view operable end to end by keyboard and screen reader, and assert it in tests rather than claiming it.
- [ ] Do not ship an audio player or a reader of our own. Serve the assistive technology the player already uses.
- [ ] Involve at least one assistive-technology user before calling any slice done.
- [ ] **Accessibility bundle 2, names and text alternatives (WCAG 1.1.1, 4.1.2, 2.4.6, 3.1.2).** On mobile the logo link has no name (`src/components/layout/Header.tsx`). The buttons that remove a commander, partner or companion are read as "times" (`src/components/deck/ColorIdentityBanner.tsx`, `src/components/deck/MainZoneContent.tsx`). The Game Changer and Banned markers are hidden from screen readers (`src/components/card/CardListItem.tsx`), ⚡ is read as "high voltage", and the read-only star rating is not announced (`src/components/community/StarRating.tsx`). Some names stay English on `/fr`, such as "Fork deck" and the playtest counter buttons.
- [ ] **Accessibility bundle 3, toggle, disclosure and popup state (4.1.2, 2.1.1, 1.3.1).** Segmented controls in ten files show their selected state only by colour, with no `aria-pressed`, and disclosures in eight files have no `aria-expanded`. The header, user and locale menus, the playtest hand menu and the set autocomplete lack popup state, arrow keys or Escape with focus return. `@radix-ui/react-tabs` and Radix DropdownMenu are installed but unused.
- [ ] **Accessibility bundle 6, page structure, obscured focus and reduced motion (1.3.1, 2.4.1, 2.4.11, 2.3.3).** No page has a skip link (`src/app/[locale]/layout.tsx`). The builder and share pages have no `<main>`. The builder's only `<h1>` sits inside the rename button, and its stats panels have no headings. On mobile the builder's tab bar hides focused controls at the bottom of each panel. Framer Motion ignores `prefers-reduced-motion`. Moving the `<h1>` changes `e2e/accessibility.authed.spec.ts`, which finds it through its parent.

**2026-11-10:** bundles 2, 3 and 6 above come from the accessibility audit recorded under [I-04](#i-04-ux-stability-and-visual-quality). They fix today's app and need not wait for this initiative's 2027 slot; the screen-reader export and deck view build on them.

### Definition of done

A deck's complete contents are reachable by screen reader and by keyboard, and an export exists that an assistive-technology user can read away from the site.

---

## I-25: A Third Locale, Chosen On Evidence

**Spec:** [`specs/i25-a-third-locale.md`](specs/i25-a-third-locale.md)

**Outcome:** a third language is activated with its navigation, warnings, dates, prices and card surfaces translated and tested as one experience.

**Status:** Later
**Priority:** Later — 2027
**Impact / effort:** Medium / medium
**Depends on:** I-11's activation rule, which already forbids routing a dormant catalogue.

Nine catalogues are dormant. Every AI deckbuilder found in the sweep is English-only, which makes a non-English market the least contested expansion available — but the choice must come from evidence rather than from catalogue convenience. Scryfall already supplies localised card data for the candidates.

### Scope

- [ ] Choose the locale from stated evidence: player population, Scryfall card-data coverage, and whether prices in that market are representable without implying a quote.
- [ ] Complete and human-review the catalogue before routing it.
- [ ] Test dates, numbers, pluralisation, mana symbols and card text together, as I-11 requires.
- [ ] State what is not localised — card data Scryfall does not carry in that language — rather than falling back silently.

### Definition of done

One additional locale is routed, reviewed and covered end to end, and the surfaces it cannot localise say so.

---

## I-26: Collections Arriving From Elsewhere

**Spec:** [`specs/i26-collections-arriving-from-elsewhere.md`](specs/i26-collections-arriving-from-elsewhere.md)

**Outcome:** a player can bring a collection out of the app that already holds it, at printing level, without retyping it.

**Status:** Later
**Priority:** Later — 2027
**Impact / effort:** High / medium
**Depends on:** I-06 printing-level ownership. Importing at Oracle level would discard exactly the information that makes I-16 and I-06 trustworthy.

Collections already live in ManaBox, Moxfield, Deckbox and in spreadsheets, and ManaBox is the scanner most paper players use. The sweep found collection-to-deck ranking in five products; the precondition for all of it is getting the collection in. The product's own non-goals exclude building a scanner, which makes import the only honest path to a populated collection.

### Scope

- [ ] Import from the CSV exports of the major collection apps, mapping to printing identity.
- [ ] Preview before writing: matched rows, unmatched rows, and duplicates, with the same disclosure discipline the deck import preview already uses.
- [ ] Never silently merge. An ambiguous printing is reported, not guessed.
- [ ] Record the source and date of an import, so a collection's provenance is readable later.
- [ ] Support re-import as reconciliation rather than duplication.

### Definition of done

A collection exported from another app lands at printing level with its unmatched rows disclosed, and a second import reconciles instead of duplicating.

---

## I-27: Learning While Building

**Spec:** [`specs/i27-learning-while-building.md`](specs/i27-learning-while-building.md)

**Outcome:** a new Commander player can understand _why_ the product flags something, in the moment, without leaving the deck.

**Status:** Later
**Priority:** Later — 2027
**Impact / effort:** Medium / medium

The beginner audience is the largest in Commander and the one the category serves worst: tier lists and optimisers assume the vocabulary. The repository already carries `mtg-rules` and `mtg-learn` skills and a comprehensive rules reference, and I-03 already explains warnings. This initiative connects assets the project already owns rather than acquiring new ones.

### Scope

- [ ] Attach a short, sourced explanation to each warning class — colour identity, singleton, bracket inputs, companion rules — reachable in one action from the warning.
- [ ] Link to the comprehensive rules reference where a rule is quoted, with its rules version.
- [ ] Keep explanations deterministic and authored. Do not generate rules text with the model.
- [ ] Never block or gate a build behind a lesson.

### Definition of done

Every warning class the product raises can be explained in place, from an authored, sourced note, without leaving the deck.

---

## I-29: Cross-Site Commander Deck Index

**Spec:** [`specs/i29-cross-site-deck-index.md`](specs/i29-cross-site-deck-index.md)

**Outcome:** from MagicAIBuilder, a player can find Commander decks and data wherever they live: in the index when a source allows it, and by a direct link into Moxfield, Archidekt, EDHREC and the others when it does not.

**Status:** Later — proposed 2026-11-09
**Priority:** Later — 2027
**Impact / effort:** High / large

EDHREC's 10.5 million decks come from partnerships with Moxfield and Archidekt, not from crawling, and the three largest sources block or forbid automated collection. The index therefore starts from sources that allow it: Scryfall, MTGJSON precons, the cEDH Decklist Database, Commander Spellbook once its data license is confirmed, and MagicAIBuilder's own public decks. Every other site is reached by a link that copies nothing, and partnerships are the only route to scale. Before any partnership, it offers the search the incumbents lack: include and exclude cards with and/or, freshness, near-copies collapsed, declared against estimated bracket, and "decks like mine". The research also found that the shipped Moxfield import sends `Origin` and `Referer` headers set to `moxfield.com`. I-10 owns that code, and the [spec](specs/i29-cross-site-deck-index.md#open-questions) asks for a decision before the source policy is published. #1304 removed those headers on 2026-11-09, which settles the Moxfield half of that question; the EDHREC half is open.

Two initiatives added on 2026-11-09 consume this index. [I-34](#i-34-commander-data-reports-and-indexable-data-pages) computes its data reports and indexable data pages from the indexed decks, under the same source labels, sample sizes and withholding thresholds. [I-36](#i-36-creator-and-embed-toolkit) exposes the index and its decks to creators and other tools through embeds and the public API. Until a partnership lands, the corpus is small. Any statistic computed from deck populations needs its sample size disclosed, and simulated statistics are the only ones not limited by corpus size.

### Scope

- [ ] Publish a source policy before the first ingest. It forbids circumvention, accounts and headers impersonating a source; it respects robots.txt and text-and-data-mining opt-outs; it never indexes private decks or stores text written elsewhere; and it gives a takedown and opt-out path.
- [ ] Build the card dictionary and dated prices from Scryfall bulk data, keyed by Oracle ID.
- [ ] Search MagicAIBuilder's public decks by commander, color identity, cards included and excluded with and/or, bracket, budget and freshness, signed out.
- [ ] Link out to Moxfield, Archidekt, EDHREC and the other researched sites from verified URL templates, without fetching or storing their content.
- [ ] Add licensed sources (the cEDH Decklist Database, MTGJSON precons through I-17), each with its notice and a link back.
- [ ] Collapse exact copies, precon copies and near-duplicates, and offer "decks like mine" with a diff against the cohort.
- [ ] Publish statistics only from indexed decks, labeled by source, sample size and corpus version.
- [ ] Open partner-fed sources (Moxfield; Space Cow Media for EDHREC, Archidekt and Commander Spellbook; TopDeck.gg) only under a signed agreement.

### Engineering enablers

- A test fails when an ingest run proceeds after a 403, a challenge or an opt-out signal.
- Measure the card index at 1 million and 10 million synthetic decks before choosing between PostgreSQL GIN and a roaring-bitmap index.

### Definition of done

A player can search every deck MagicAIBuilder may lawfully hold, see where each one comes from, and reach the same search on every other site in one link. A public page states each source, what is stored, and how to remove it.

---

### What the sweep ruled out for 2027

Recording these saves the next pass from re-deriving them:

- **Tournament win rates remain blocked, by licence rather than by missing data.** _Corrected 2026-11-09._ The 2026-11-08 sweep said EDHTop16 publishes meta share and entry counts but no win rates, no match-level results and no public API. In fact EDHTop16 computes a win rate (wins divided by wins, losses and draws) and shows each entry's win, loss and draw record. Its GraphQL endpoint answers only persisted queries, so it is still not a usable public API ([EDHTop16 `llms.txt`](https://edhtop16.com/llms.txt), checked 2026-11-09). The match-level data, with seat order and the winner of each table, sits upstream at TopDeck.gg ([API docs](https://topdeck.gg/docs/tournaments-v2)). TopDeck.gg's [Developer Terms](https://topdeck.gg/developer-terms), effective 2026-10-27, forbid selling, licensing or otherwise commercializing API data (§7), and allow displaying public event data with attribution (§8.3, §6.1). MagicMeta and LucidPuzzle derive their tiers from EDHTop16. The block stands, and the reason is now recorded correctly; I-09 carries the detail.
- **Card scanning** stays a non-goal: ManaBox owns it, it is a native-camera capability, and I-06's own scope defers it behind printing-level ownership.
- **A table companion** — life totals, commander damage, turn timers — is served by Discord bots and the official app, and is a different product from a deckbuilder. I-19 covers the only table need the product should meet. [I-35](#i-35-pod-game-log-and-casual-results), added on 2026-11-09, is a post-game result log attached to decks, not a table companion.
- **Marketplace, our own cart and checkout** remain excluded by the existing non-goals. I-06 hands off to sellers; it does not become one. [I-32](#i-32-seller-handoff-affiliate-links-and-buy-this-deck-carts) sends a list to a seller's own cart, and [I-33](#i-33-the-marketplace-ladder-decision-record) records the stage at which the owner could decide otherwise.

---

# Business, Reference And Depth

The eight initiatives below were added on 2026-11-09 from a dated research pass on the owner's goals, summarised under [Product Direction](#owner-ambition-and-business-model-2026-11-09). Unlike the 2027 horizon above, they mix priorities: I-30, I-31, I-32 and I-37 are Next, I-34 is Next for the slices that need no deck index, I-35 and I-36 are Later, and I-33 is a decision record parked for the owner. Each has a spec. The research notes are not committed, so every spec links its own sources. Legal points in them are research, not legal advice.

Two rules hold across all eight. Card data, fan content and the evidence the product shows stay free, under the [Wizards Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy) and [Scryfall's API terms](https://scryfall.com/docs/api): a paid tier sells usage and personal tools, and only after I-30's legal gate. Each initiative names its paid-tier candidate and leaves the decision to I-30. The marketplace non-goal stays in force: I-32 builds the rungs that fit it, and I-33 names the one that would reverse it.

---

## I-30: Business Model And The Paid Tier

**Spec:** [`specs/i30-business-model-and-paid-tier.md`](specs/i30-business-model-and-paid-tier.md)

**Outcome:** the owner knows what is free, what is paid, at what price and after which written legal answers, and no player's model calls can cost more than the plan that pays for them.

**Status:** Next — proposed 2026-11-09
**Priority:** Next, behind a decision gate: slice 0 (written legal answers and the owner's pricing decision) comes before any billing code
**Impact / effort:** High / large
**Depends on:** a French IP/IT and consumer lawyer and an accountant for slice 0; I-02's golden set before the model change in slice 3.

The owner wants a cheap SaaS that pays a decent living while the competition is almost free. Free reference sites sell ad removal for about 2 USD a month through Patreon ([Archidekt](https://archidekt.com/faq), [EDHREC](https://edhrec.com/terms)), which is a donation, not a product. Subscriptions at 3–8 USD a month or 30–50 USD a year sell AI usage, price tooling and personal history ([DeckCheck](https://deckcheck.co/get-more), [ManaTap](https://www.manatap.ai/pricing), [Untapped.gg](https://mtga.untapped.gg/premium)), and paywalls on how many decks or binders a player keeps draw one-star reviews. The Fan Content Policy forbids requiring payment to access fan content and Scryfall forbids paywalling its data, so the line is **content free, tools paid**, and a lawyer confirms it before anyone is charged. No billing, entitlement or monthly quota exists today; the only AI limits are per minute, in a per-instance memory store (`src/lib/rate-limit.ts`). The spec's computed case: on stated assumptions, a living wage needs about 1,200–1,800 paying subscribers and 30,000–60,000 active accounts, and is never reached if the free AI allowance is generous and the model stays on today's price.

**Never paid:** card data and images, search, deck pages, building, importing, exporting and sharing, guides, data reports, the bracket check, the index, the evidence behind any result, and how many decks, folders, collection cards or snapshots a player keeps. **Candidates**, each decided when its initiative ships: AI above a free allowance (I-02), the price watch (I-32), automatic deck watch (I-18), history across snapshots (I-07, I-21), collection-scale tools (I-06, I-16), Deck Lab variants (I-31), game-log trends (I-35), creator analytics (I-36), longer editor history (I-37) and early access.

### Scope

- [ ] Slice 0, no code: commit written answers from a lawyer and an accountant to the spec's legal questions, then the owner's choice of provider, legal structure, price hypothesis (€3.99 a month or €29.99 a year first), withdrawal flow, and whether to ask Wizards for a licence.
- [ ] Meter every model call through one module: an `AiUsage` row with tokens, `stop_reason`, outcome and a cost from a dated price table. A truncated reply is never parsed as a success (slice 1).
- [ ] Enforce a monthly allowance per user and route, atomic in PostgreSQL across instances, show what remains before an AI action, and set a global monthly spend ceiling. Calls that fail on our side consume nothing (slice 2). This closes I-05's quota scope.
- [ ] Move builds and suggestions to the cheapest adequate model once I-02's golden set passes on it (slice 3).
- [ ] An entitlement layer with a single free plan, enforced on the server, that asks for capabilities rather than plan names (slice 4).
- [ ] Publish the AI-use disclosure page from I-02's scope (slice 5) and, after slice 0, a public page that explains the free and paid line (slice 6).
- [ ] After slice 0: billing in test mode through the chosen provider, webhooks, cancellation online, account deletion that cancels first, and the French withdrawal, renewal-reminder and termination flows (slices 7–8).
- [ ] First paid entitlements, a larger AI allowance and early access, then one entitlement per initiative as it ships (slices 9 and 11).
- [ ] An owner-only metrics page computed from our own database: active accounts, conversion, churn, AI cost per user and net revenue (slice 10).
- [ ] If slice 0 says no: a supporter page with nothing gated, labelled sponsorships, affiliate income through I-32, and one AI allowance for everyone (slice 12).

### Engineering enablers

- A test fails when any file outside the metered module calls a model endpoint.
- Concurrent calls at `limit − 1` let exactly one through, and the period rolls over in UTC.
- A guard test lists the only modules allowed to check an entitlement, and every always-free surface renders signed out.
- Expiry or downgrade deletes nothing. Webhooks are signature-verified, stored once and applied idempotently.

### Definition of done

Every model call is metered and capped per month; the free and paid line is public and was answered in writing by a lawyer before the first charge; card data, deck pages and evidence stay free signed out; and a player can subscribe, cancel online and withdraw as French law requires.

---

## I-31: Deck Lab: Analysis Run On Your Own List

**Spec:** [`specs/i31-deck-lab.md`](specs/i31-deck-lab.md)

**Outcome:** a player opens their own Commander list and gets a seeded, replayable analysis: the best keep rule for the first seven and the free seven, the chance the commander is cast by each turn, per-turn mana and colours, and swaps judged with an interval.

**Status:** Next — proposed 2026-11-09
**Priority:** Next
**Impact / effort:** High / large
**Depends on:** I-21 slices 1 (seeded shuffler), 3 (intervals), 5 (two-sample verdict) and 6 (worker runtime), which therefore move ahead of I-21's Later priority. Norms placement needs I-29's computed statistics and I-28 slice 2.

The [opening-hands guide](guides/commander-mulligans-curves-and-play-style.md) solved keep rules for eight archetypal shells and named "a keep table for the user's own list" as the most useful product output. Castability on the player's list is already free at [DeckFlow](https://www.deckflow.gg/manabase) and [Fetch](https://www.fetch-mtg.com/analyse), and [EDHTuner](https://edhtuner.com/methodology) runs paired, replayable swap tests for free. Among the roughly twenty tools checked, none solves the keep table for a given list, gives the commander's cast probability by turn, shows per-turn percentiles of mana and colours, re-solves the mulligan for each variant, or shows an interval and says when a difference is not distinguishable at the sample size. The research model in [`scripts/research/commander-opening-hands/`](../../scripts/research/commander-opening-hands/README.md) ran 36,000–65,000 games a second on one core of the development VPS; it has no colours, and nothing in `src/` imports it.

### Scope

- [ ] Port the research model into `src/lib/deck-lab/`, with parity tests against `model.mjs` and the guide's exact hypergeometric figures (slice 1).
- [ ] Classify each card for the simulation by a deterministic rule the player can see and override per deck. No language model (slice 2).
- [ ] Run in web workers with progress and cancel, and add a colour model: pips matched to sources each turn, fetch lands, MDFCs and filter rocks (slices 3–4).
- [ ] Report a cross-fitted keep table per mulligan stage, P(commander cast by turn), per-turn mana and colour percentiles, colour sources, castability per card and land drops, each with a 95% interval and its sample size (slice 5).
- [ ] A Deck Lab page that runs signed out on a visible or pasted list, with classification review and a limits panel that is always visible (slice 6).
- [ ] Recorded runs and a replay link that names the engine version (slice 7).
- [ ] Variants on common random numbers with the policy re-solved, Holm-corrected verdicts, and "not distinguishable at this sample size" with the sample that would be needed (slice 8).
- [ ] Server runs, history across snapshots, and percentile placement within bracket × colour identity with n and withheld cells (slices 9–11).
- [ ] Give I-07's playtest advice and I-28's opening-hand check the deck's own keep table when a run matches the list (slice 13).

### Engineering enablers

- The same run key gives a byte-identical result in a browser worker and in Node, with one worker or four. This is the initiative's acceptance test.
- The hot path draws integers from I-21's seeded generator and avoids `Math.random`, `exp`, `log` and `pow`; the interactive playtest keeps `src/lib/crypto-random.ts`.
- A mono-coloured deck gives the colourless model's result at the same seed.
- `DeckCard` stores no mana production, and `src/lib/deck/mana-alignment.ts` says Scryfall's `produced_mana` "is not stored anywhere", so classification reads Oracle text until that field is stored.

**Paid-tier angle:** rated unproven in I-30, because free tools already offer castability, swaps and replay. The default run, the replay link, a land ±1 pair and norms placement stay free. Candidates are custom swaps and more than two variants a run, large server-side samples, and full run history across snapshots (slice 12, blocked on I-30's decision).

### Definition of done

A player runs Deck Lab on their own list without an account and gets a keep table and commander and mana development, each figure with its interval, seed, sample size and engine version; a replay link reproduces the run byte for byte; and a variant's verdict says when the difference is not distinguishable.

---

## I-32: Seller Handoff, Affiliate Links And Buy-This-Deck Carts

**Spec:** [`specs/i32-seller-handoff-and-affiliate-carts.md`](specs/i32-seller-handoff-and-affiliate-carts.md)

**Outcome:** a player sends the exact printings still missing across their decks, net of owned copies, to a seller's cart or wants list, priced for the market they chose, with any affiliate link labelled where they click.

**Status:** Next — proposed 2026-11-09
**Priority:** Next
**Impact / effort:** High / medium
**Depends on:** I-06's acquisition plan, which ships. Affiliate activation waits for each seller's approval and the lawyer's answer on disclosure; free-copies and budget-tier carts wait for I-16 slice 4 and I-17 slice 6.

I-06 stops one step short of buying: the plan lists missing printings with undated USD estimates, and the player rebuilds the cart by hand from a CSV. A buy button is no longer rare. Moxfield has opened Mana Pool's mass entry since 30 May 2025 ([announcement](https://manapool.com/library/platform/2025/05/30/moxfield-manapool-integration.html)), and the AI builder mtgcommander.ai sends a generated list to a Mana Pool cart in one click ([Mana Pool](https://manapool.com/mass-entry-info)). What sets this initiative apart is what goes into the cart: exact printings, owned copies removed across several decks, budget tiers, a chosen market priced in its own currency, and a labelled affiliate. The income is small: Mana Pool pays 5% of a referred first sale ([affiliates](https://manapool.com/affiliates)). TCGplayer and Cardmarket grant no new API access, so listing-level prices and a cross-seller "cheapest split" are out of reach. This is stages 1 to 3 of the [I-33](#i-33-the-marketplace-ladder-decision-record) ladder: MagicAIBuilder never takes payment, never holds a cart and never lists a seller's stock.

### Scope

- [ ] A seller registry reviewed in pull requests, with no affiliate code active, and a public disclosure page linked from the footer (slice 0).
- [ ] Copy-and-open handoffs for Mana Pool, TCGplayer, Cardmarket and Card Kingdom that state what the seller keeps, what must be picked again, and which lines could not be mapped (slice 1).
- [ ] Dated Scryfall prices in USD and EUR, per finish, with source, date and a stale label after 24 hours, from one job shared with I-29 (slice 2).
- [ ] An explicit EU or US market choice, never inferred from the locale and never converted, with totals by deck, category and price band (slice 3). This is I-06's region-aware provider and per-vendor breakdown, limited to the one source we may display.
- [ ] Finish, minimum condition and exact-or-any printing on each plan line, and a flag on lines owned in another printing (slices 4–5).
- [ ] Mana Pool's prefilled link with our affiliate code, a visible label beside every affiliate control, and a setting that removes our codes (slice 6, blocked on approval and the lawyer). Further sellers follow one per pull request (slice 7).
- [ ] Count handoffs, monthly buyers and wrong-cart reports with no user, deck or IP column, for I-30 and I-33 (slice 8).
- [ ] Free-copies and budget-tier handoffs, the CardTrader token flow behind a security review, and a price watch on the player's own plan (slices 9–12).

### Engineering enablers

- Randomizing commission fields never changes seller order, and no ordering code reads them.
- Generated URLs never contain a user ID, deck ID, username or email, and no page loads a third-party affiliate script.
- A golden fixture per seller covers double-faced, split, foil-only, etched, Secret Lair and unmappable cards.
- A handoff leaves `CollectionCard` and `AcquisitionIntent` unchanged.

**Paid-tier angle:** prices, the market choice, the plan and every handoff stay free, by Scryfall's paywall clause and because affiliate income depends on click volume. The candidate is a price watch on the player's own plan, with that plan's price history (I-30), blocked on the lawyer's answer about Scryfall data.

### Definition of done

From the acquisition plan, a player picks a market and a seller and reaches that seller's cart or wants list with every line mapped or listed as unmapped, prices dated in the market's currency, and any affiliate relationship labelled at the click and listed on the disclosure page.

---

## I-33: The Marketplace Ladder (decision record)

**Spec:** [`specs/i33-marketplace-ladder.md`](specs/i33-marketplace-ladder.md)

**Outcome:** the owner can decide from measured evidence and a legal review whether MagicAIBuilder should ever hold buyers' money, and every rung below that decision is useful on its own.

**Status:** Parked — owner decision
**Priority:** Parked. A decision record, not a build plan: nothing for stages 5 and 6 is scheduled.
**Impact / effort:** High / decision and outreach work only until stage 5
**Depends on:** I-32 for stages 1 to 3 and their measurements; I-30 for the revenue comparison.

On 2026-11-09 the owner named a marketplace "recognised like Cardmarket or TCGplayer" as a possible goal. The research found that deckbuilders partner with marketplaces and that none of the major ones runs its own: EDHREC, Moxfield, Archidekt and mtgcommander.ai hand off to [Mana Pool](https://manapool.com/mass-entry-info), Card Kingdom or TCGplayer. Mana Pool built supply from store inventory integrations and demand from those deckbuilders. A marketplace switches on Digital Services Act duties, seller-status disclosure, DAC7 reporting, product-safety duties and payment licensing, so buyers' funds must sit with a licensed provider such as [Stripe Connect](https://stripe.com/fr/connect/pricing). At a 5% take, each million euros of sales grosses about €50,000 and keeps about €24,600 to €44,600 after payment costs, roughly one support salary, while Cardmarket had more than 80 staff in February 2026. The roadmap's non-goal "full card-trading marketplace" stays in force.

| Stage | What it is                                                                 | Home                                | Non-goal     |
| ----- | -------------------------------------------------------------------------- | ----------------------------------- | ------------ |
| 1     | Disclosed affiliate links                                                  | I-32                                | Fits         |
| 2     | Region-aware prices from a source with display rights                      | I-32                                | Fits         |
| 3     | Buy-this-deck carts on the seller's own site                               | I-32                                | Fits         |
| 4     | Cart split and price alerts, where a feed's terms allow                    | A future spec                       | Fits         |
| 5     | Pilot marketplace: professional sellers, funds held by a licensed provider | A build spec after the owner's "go" | **Reversed** |
| 6     | Open player-to-player marketplace with a delivery guarantee                | After a stage-5 review              | Reversed     |

[I-44](#i-44-trade-lists-within-the-pod-and-nearby-players)'s trade lists and [I-45](#i-45-selling-spare-cards-collection-value-buylists-and-seller-exports)'s seller exports add no stage: they sit beside stages 1 to 4, and no money passes through the product.

### Scope

- [ ] The owner confirms or edits the proposed gate thresholds and metric definitions as the first decision-log entry, before any measuring starts (slice 0).
- [ ] Specify the gate metrics with I-32: handoffs, network-reported attributed sales, monthly active buyers and wrong-printing reports (slice 1).
- [ ] Ask Cardmarket, Mana Pool and CardTrader for listing-level feeds and display rights, and record the answers (slice 4).
- [ ] Measure stage 1 for six months with quarterly review entries, then choose the first market (slices 2–3).
- [ ] Compare affiliate, take-rate and subscription income on measured numbers, then commission a legal review of stage 5 (slices 5–6).
- [ ] Log the owner's stage-5 go or no-go. A "go" lands in the same pull request as the roadmap change that reverses the non-goal (slice 9).

### Boundaries

- No advice reads affiliate, commission or seller data at any stage; a budget the player sets is the only price input to advice.
- No in-house wallet, escrow or store credit, and no paid placement of sellers, decks or cards.
- The proposed stage-5 entry gate includes €1M of attributed yearly sales for six months, 1,000 monthly active buyers, sellers' letters of intent covering 80% of sampled plan lines, a dated legal review and a signed payment-provider contract.

**Paid-tier angle:** stage-4 price alerts are the only rung with a plausible paid feature, and only on a feed whose terms allow it. Affiliate and take-rate income are alternatives to charging players, never a charge on card data.

### Definition of done

The decision log holds dated gate reviews whose figures a second person can recompute, and the owner's stage-5 decision is recorded with its evidence, whether it is go, hold or no.

---

## I-34: Commander Data Reports And Indexable Data Pages

**Spec:** [`specs/i34-commander-data-reports.md`](specs/i34-commander-data-reports.md)

**Outcome:** players, creators and search engines can cite dated Commander figures that nobody else publishes, each with its method, sample size and a way to reproduce it, in English and French, and no thin page is offered to search engines.

**Status:** Next — proposed 2026-11-09
**Priority:** Next for slices 1–7, which need no deck index; Later for slices 9–12, built on [I-29](#i-29-cross-site-commander-deck-index). Slice 8 waits for the owner.
**Impact / effort:** High / medium without the index, large with it
**Depends on:** I-29 slices 8 and 11 for any figure computed from deck populations; I-28 slices 4 and 6 for guide links and the French guides; the owner's domain and analytics decisions for measurement.

"More information than EDHREC" cannot mean copying its rankings: popularity is not advice, and Lift needs its denominator ([strategic boundaries](#strategic-boundaries)). The data products that get cited share a recurring dated release, a stated method with denominators, and open data or community participation, as EDHREC's [salt vote](https://edhrec.com/articles/salt-vote-results-2026) and [year-end report](https://edhrec.com/articles/a-statistical-look-at-almost-a-year-in-commander-2025), EDHTop16's conversion rate and 17lands' game-level datasets do. The research found nobody publishing declared against estimated brackets, per-bracket norms with their sample size, simulated keep rates by bracket, deck freshness, price by bracket or combo density by bracket, and none of it in French. None of the large sites grew mainly through search, and Google's [spam policy](https://developers.google.com/search/docs/essentials/spam-policies) names scaled AI-written, scraped or machine-translated pages as abuse, so reports are written to be cited first and to rank second.

### Scope

- [ ] One index policy (`index`, `noindex` or absent) that page metadata and the sitemap both call; commander discovery pages below threshold and profiles with no public deck become `noindex` and leave the sitemap; sitemap entries gain `x-default`; a test keeps the two public-path lists equal (slice 1).
  - Before #1313, `/commanders/[slug]/decks` answered HTTP 200 with its empty state, a canonical and no `noindex` for any slug, including one that names no card (`src/app/[locale]/commanders/[slug]/decks/page.tsx`). The sitemap still lists a commander as soon as one public deck names it.
  - [x] An empty commander listing is `noindex` with no canonical or alternates, a slug no commander name can produce answers the 404 page without calling the API, a failed discovery request goes to the retryable error page, the sitemap drops such slugs, and the two public-path lists became one module, `src/lib/auth/public-paths.ts` (#1313). The shared index policy, `noindex` profiles with no public deck and `x-default` in the sitemap remain open.
- [ ] Make `/rules/game-changers` public with alternates and localized metadata, and `/rules/comprehensive` public but `noindex`, since it reproduces Wizards' text (slice 2). #1313 made both public; their alternates, localized metadata and the Comprehensive Rules `noindex` remain open.
- [ ] A versioned methods page with one anchor per metric, a citation line and a corpus section (slice 3).
- [ ] A report framework with permanent URLs, dated errata, `Dataset` markup, and CSV and JSON downloads with checksums (slice 4).
- [ ] "Commander Opening Hands", first edition, from the seeded simulation and reproducible from its seeds and commit, then five bracket pages with opening-hand norms linked to the I-28 guide (slices 5–6).
- [ ] French review of the methods page, the report and the bracket pages; an unreviewed French page stays `noindex` (slice 7).
- [ ] Commander × bracket and card × bracket pages from I-29's statistics, then "State of the Brackets" and precon drift (slices 9–12, Later).

### Engineering enablers

- No AI client is imported on a report or data-page route, and every sentence on a data page comes from a reviewed template.
- Rendering a figure without its sample size, date, method version or methods link fails a test.
- A report table regenerated from its recorded seeds, sample sizes and commit is byte-identical.
- No page kind is disallowed in robots.txt, so crawlers can read its `noindex`.

**Paid-tier angle:** reports, data pages, methods and downloads stay free, with no account and no early access for payers. The candidate is personal: placing the player's own decks within the published norms, which belongs to I-31 and is priced in I-30, and never shows a norm the free pages do not.

### Definition of done

A first dated report and five bracket pages are public signed out, in English and in reviewed French, each figure with its label, sample size, date and methods anchor; a rerun from the recorded inputs reproduces them; and every public page kind is indexed or `noindex` by one tested policy.

---

## I-35: Pod Game Log And Casual Results

**Spec:** [`specs/i35-pod-game-log.md`](specs/i35-pod-game-log.md)

**Outcome:** a player logs a real game in under a minute after it ends, tied to the deck version played and to what the pod declared, and reads honest personal statistics; players who opt in feed casual aggregates nobody publishes.

**Status:** Later — proposed 2026-11-09
**Priority:** Later
**Impact / effort:** Medium / medium
**Depends on:** nothing for the private log (slices 1–4); I-15 for pods and declared brackets; I-21 slice 5 for version verdicts; I-34's data pages and a legal answer before any aggregate is published.

Casual results are already tracked at scale by life-counter apps. [Playgroup.gg](https://playgroup.gg/about) reports more than 770,000 games and publishes a robust first-seat advantage: 29.1% of single-winner four-player games against a fair 25% ([turn order](https://playgroup.gg/commander/turn-order)). No tracker found ties a result to the exact deck version played, or publishes outcomes by declared against computed bracket. MagicAIBuilder holds deck snapshots today, and the I-15 Rule 0 sheet once it ships. Two risks shape the design: a reader's letter describes tracked win rates turning a casual group to "targeted play" ([Commander's Herald](https://commandersherald.com/am-i-the-bolas-stat-tracking-in-a-casual-game/)), and the GDPR household exemption does not cover a platform that stores a non-user's name ([Recital 18](https://gdpr-info.eu/recitals/no-18/)). This is a post-game log, not the table companion the 2027 sweep ruled out, and casual logs do not unblock tournament win rates (I-09).

### Scope

- [ ] "Log a game" from the deck page: date, pod size, seat order, the logger's seat and deck, the outcome, and optional turn, mulligans, how it ended and fun (slice 1).
- [ ] Freeze the deck version played, by card-list hash or a new game snapshot (slice 2). The same helper can tie I-07's recorded sessions to a snapshot.
- [ ] Edit, delete, JSON and CSV export, and seats turned into labels when an account is deleted (slice 3).
- [ ] Personal figures per deck: wins against the fair share for the pod size, 95% Wilson intervals, a game list instead of a percentage under 10 games, goldfish sessions kept apart (slice 4).
- [ ] Declared and computed brackets frozen with the scorer version, and mismatch and pod spread with nothing imputed (slice 5).
- [ ] Logging from an I-15 pod, with linked players who confirm or detach their seat (slice 6).
- [ ] Opt-in contribution and a weekly aggregate job that publishes a cell only at 40 games from 10 accounts and 5 pods, none supplying more than a third (slices 8–9).

### Engineering enablers

- No seat column accepts a name, and the API refuses one: opponents are linked accounts or per-game labels such as "Seat 3, Atraxa, Praetors' Voice".
- A logged game does not change when a sheet is edited, a share is revoked or the bracket scorer changes.
- Every results screen reads "Self-reported casual games. Not tournament results, not a random sample." in English and French.

**Paid-tier angle:** logging, history, export, deletion, per-deck figures over 12 months and every published aggregate stay free. Candidates are trends across deck versions, the mismatch view across all of a player's decks, and whole-history analysis; I-30 rates them weak, because Playgroup and Lifetap give statistics away.

### Definition of done

A player logs a game in under a minute, sees it against the deck version and the brackets declared and computed, can export or delete it, and no stored record names a person who has no account.

---

## I-36: Creator And Embed Toolkit

**Spec:** [`specs/i36-creator-and-embed-toolkit.md`](specs/i36-creator-and-embed-toolkit.md)

**Outcome:** a creator embeds a deck with one snippet, a deck link previews as the deck in Discord and on social sites, primers carry card links and timestamped video, and a developer reads public decks through a documented, attributed API.

**Status:** Later — proposed 2026-11-09
**Priority:** Later
**Impact / effort:** Medium / medium
**Depends on:** one public projection of a deck (slice 1) before any surface; legal answers before the view counter and the API terms.

Reference sites grew because other people linked to them. Creators amplified EDHREC early ([EDHREC](https://edhrec.com/articles/edhrec-founder-don-miner-to-speak-at-mv-con-2025)), community gatekeepers' link rules helped Moxfield displace TappedOut in 2020 ([TappedOut forum](https://tappedout.net/mtg-forum/tappedout/is-tappedout-dying)), and free APIs made Scryfall and Commander Spellbook infrastructure. Players also choose on presentation: "Moxfield for play-testing because it's easier to frame in OBS for Spelltable" ([r/EDH](https://www.reddit.com/r/EDH/comments/1wv8mf7/)). MagicAIBuilder's social layer is evaluative; the broadcast layer does not exist. There is no embed route under `src/app`, every route sends `frame-ancestors 'none'` (`src/lib/security-headers.ts`), the schema has no view counter, and the unused `/api/og` prints whatever text it is given. No reviewed site documents video sections in primers.

### Scope

- [ ] One public projection of a deck, used by the deck page and by `/api/deck/[id]` for every caller but the owner, with a field snapshot test (slice 1). See I-08.
- [ ] A deck image built only from stored data at `/og/deck/{id}`, Open Graph and Twitter tags on the deck page, a PNG default, and the free-text `/api/og` removed (slice 2).
- [ ] An embed route rendered on the server, themed and localized, framable only under `/embed/*`, with no cookie, storage or third-party script and a per-deck switch (slice 3); optional legality, declared-bracket and dated-price badges, and an overlay layout for OBS (slices 4–5).
- [ ] `[[Card]]` links in primers, unique heading anchors, and click-to-load YouTube (privacy-enhanced mode) and Twitch video blocks with timestamped sections (slices 6–8).
- [ ] Fork counts and attribution on every surface, and a creator page with a bio, links and pinned decks (slices 9–10).
- [ ] A `public:read` API scope with two attributed endpoints and a limiter shared across instances, behind a terms page reviewed by a lawyer (slice 11).
- [ ] A cookie-free view counter with daily-salted de-duplication and an owner toggle; views rank nothing (slice 12).

### Engineering enablers

- A test enumerates route families: only `/embed/*` allows framing, and `frame-src` names exactly the two video hosts.
- A snapshot test fails if `notes`, `folderId`, `budget`, `shareEnabled`, `manualBracket` or `userId` appears in any public response.
- No table stores an IP address or a user agent.

**Paid-tier angle:** everything a viewer, a reader or a developer within the quota needs stays free. The candidate is creator analytics on the author's own decks: views per day, embed loads per host site, forks over time and an export (slice 13, after I-30's decision). Placement, reach and featuring are never sold.

### Definition of done

A creator embeds a public deck that loads without tracking, links back, and turns unavailable within a minute of the deck going private; a pasted deck link previews the deck; and a primer plays its video from a timestamped section.

---

## I-37: Editor Depth Against Moxfield And Archidekt

**Spec:** [`specs/i37-editor-depth.md`](specs/i37-editor-depth.md)

**Outcome:** a player edits a deck with the views, groups, tags, text bulk edit, history and mobile toolbar they expect from Moxfield and Archidekt, and the editor stays measurably fast and stable while they do.

**Status:** Next — proposed 2026-11-09
**Priority:** Next
**Impact / effort:** High / large
**Depends on:** I-13 spec slice 1 for the visual slices. I-01 keeps zones and failed-save recovery, which every slice here reuses.

The owner wants an editor "more beautiful and more complete than Moxfield". Archidekt shipped visible editor changes in January, March, May and July 2026: collapsible and sticky categories ([January](https://archidekt.com/news/19248512)), a static card panel, a mobile bottom toolbar ([May](https://archidekt.com/news/22633051)) and Oracle tags as categories. Moxfield previewed a redesign to Patreon members on 28 September 2026 ([r/Moxfield](https://www.reddit.com/r/Moxfield/comments/1wsnch7/)). MagicAIBuilder's editor has two views, one closed set of 16 categories, deck-level tags only, selection only in Sideboard and Considering, an in-memory undo and no change history. Players choose between the incumbents on speed and readability, and punish redesigns that bury filters and sorts ([r/EDH](https://www.reddit.com/r/EDH/comments/1x7v653/)), so "beautiful" is measured here: on a 100-card fixture, Interaction to Next Paint of 200 ms or less, layout shift of 0.1 or less, and no task taking more clicks than before.

### Scope

- [ ] A measurement baseline: a 100-card fixture, a latency and layout-shift harness, click-depth counts, and screenshots at three widths and three theme states (slice 1).
- [ ] Persisted view and density, collapsible headings with collapse-all, and sticky headings (slice 2).
- [ ] A shortcut registry that generates the help modal, an off switch for single-character keys, and native undo inside text fields (slice 3). See I-04. The off switch (#1320) and native undo (#1309) shipped under I-04; the registry and remapping remain.
- [ ] A card panel that follows pointer, focus and selection, with element toggles and a text-only render; grouped Grid and a Stacks view (slices 4–5).
- [ ] An in-deck filter bar, and statistics that filter the deck when clicked (slice 6).
- [ ] A mobile bottom toolbar with localized labels, Layout and More drawers and quick add, replacing today's three English-only tabs (slice 7). See I-11.
- [ ] Text and Table views, and main-deck multi-select with bulk category, zone and removal (slices 8–9).
- [ ] A change record written in each mutation's transaction, automatic snapshots before restores and bulk edits, a history view, revert and redo (slices 10–11).
- [ ] Finish, language, date added and Oracle identity on deck cards (slice 12). `DeckCard` has none of them today (`prisma/schema.prisma`), and I-06, I-10 and I-32 depend on them.
- [ ] Custom categories, deck and global tags, card-panel controls, bulk edit as one diff-and-apply transaction, a cross-deck clipboard and Scryfall function tags (slices 13–18). The I-01 bulk-edit fix, #1314, stopped the data loss first.
- [ ] Read-only Stacks and Text on public pages, the validation pass with a side-by-side review, and a split primer editor (slices 19–21).

### Engineering enablers

- Every slice meets I-13's acceptance thresholds and the 24 px minimum target size (WCAG 2.5.8).
- A mutation route writes exactly one change record inside its transaction, and none on failure.
- For every clickable statistic, the filtered count equals the figure.
- A person checks moxfield.com in a normal browser before any slice whose only reference is Moxfield. No automated runs against competitor sites.

**Paid-tier angle:** every view, category, tag, filter, bulk edit, the clipboard and shortcuts stay free, as they are at Moxfield and Archidekt, and no slice limits decks, tags or clipboard size. Candidates are history kept beyond a free window, early access to new views, and presentation themes for public decks.

### Definition of done

On the 100-card fixture, a player switches among five views, collapses groups, tags and filters cards, bulk-edits as text without losing printings or notes, and reverts a change from history, on desktop and at 390 px, within the latency and stability budgets.

---

# Trust, Growth And The Physical Table

I-38 to I-46 were added on the evening of 2026-11-09, from dated research that each spec links, because its notes are not committed. They cover what a public, paying product owes its users (I-38), how a new player reaches a first deck and how that is counted (I-39), the phone and the store (I-40, I-41), the Commander variants (I-42), the physical cards a player stores, trades and sells (I-43 to I-45), and the chat rooms where pods and creators meet (I-46). I-38 and I-39 are Next, I-42 is Next for slices 1 to 6 and I-46 for slices 1 to 3, and the others are Later with cheap early slices named. The rules of the previous part hold: card data, fan content and evidence stay free, each initiative names its paid-tier candidate and leaves the decision to I-30, legal points are research and not legal advice, and none of them holds money, cards or shipments.

---

## I-38: Trust, Safety And User Rights

**Spec:** [`specs/i38-trust-safety-and-user-rights.md`](specs/i38-trust-safety-and-user-rights.md)

**Outcome:** a player can report anything public, learn why something was hidden and contest it, block another player, read who runs the site and how their data is used, download everything tied to their account and delete it for good.

**Status:** Next — proposed 2026-11-09
**Priority:** Next. A launch gate for I-30's paid tier (its slice 7 changes account deletion, and a paid plan needs terms and a privacy policy) and for any public growth
**Impact / effort:** High / large
**Depends on:** the owner's identity fields for the legal notice; counsel's written answers, added to I-30's slice 0, for the final wording of the terms and privacy policy and before the email sender and the retention job.

MagicAIBuilder shows public decks, primers, comments, reviews, profiles, packages and share links at its users' request, so in EU terms it is an online platform ([DSA Art. 3](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065)). As a micro enterprise it escapes most of the platform section, but every host owes points of contact, terms that describe moderation, a notice-and-action mechanism, a statement of reasons for each restriction and reports of threats to life to the police (Arts. 11–18). France adds the LCEN legal notice and Arcom as supervisor since May 2024, and the GDPR adds access, portability and erasure within a month. Today a public deck can be reported and a moderator can mark the report reviewed. Nothing else exists: no legal page, no export, no deletion button, no block and no statement of reasons. No deckbuilder read publishes a DSA contact, a notice form or a statement of reasons, and none documents a full account export. TappedOut sold the removal of comments from one's own decks in 2013; here every safety and rights control is free.

### Scope

- [ ] Slice 0, no code: counsel's written answers to the spec's lawyer questions, added to I-30's slice 0.
- [ ] A legal notice and a DSA contact page in French and English, linked from every footer (slice 1).
- [ ] End the session when an account is deleted, with a 7-day tombstone and a regression test that replays a still-valid JWT (slice 2, first). Today `DELETE /api/user/profile` (`src/app/api/user/profile/route.ts`) does not sign out. Until #1319, `resolveAuthenticatedUser` (`src/lib/auth/helpers.ts`) re-created the deleted user from the token's email on the next request. I-05 records the same defect.
  - [x] Stop re-creating the deleted user, and replay a still-valid JWT in a regression test (`src/app/api/user/profile/account-lifecycle.test.ts`): after `DELETE`, the same token gets 401 and no user is created (#1319). The session cookie is not yet ended; the PR suggests the deletion UI call `signOut()` (slice 5). It also argues that spec 6.2's tombstone is no longer needed, since nothing re-creates a user per request.
- [ ] Apply the deletion cascade of the spec's table 6.4 (slice 3). Today `DeckComment.parent` cascades (`prisma/schema.prisma`), so deleting an account deletes every reply other players wrote under its comments, and `DeckReport` cascades from its reporter, so the reports the user filed disappear with their decisions. Replies must survive under a cleared comment, forks must show a neutral label, and reports and decisions must stay, anonymised.
- [ ] A full JSON export with a versioned schema and a guard test, then a Settings → Account page that downloads it and deletes the account after re-authentication (slices 4–5).
- [ ] A privacy policy rendered from the retention constants and listing every processor, and terms with moderation rules and a minimum age, accepted and recorded at signup (slices 6–7). Today `src/instrumentation-client.ts` records Sentry Session Replay for 1% of all sessions and every session with an error, and prompts go to Anthropic with OpenAI as fallback (`src/app/api/ai/build/route.ts`, `src/app/api/ai/suggest/route.ts`); none of this is disclosed, because no privacy page exists. [I-39](#i-39-first-run-activation-and-product-measurement) slice 4 sets random-session replay to zero.
- [x] Return only the fields the share view needs from `GET /api/share/[token]`. `src/app/api/share/[token]/route.ts` returned the whole deck row minus the token, `userId`, `budget` and `manualBracket` included. Shipped in #1325 through the `SHARED_DECK_SELECT` allowlist; I-08 records the same item.
- [ ] A generic `Report` for every public item with a signed-out notice form and an acknowledgement, then hide, restore and posting restrictions filtered from every public surface (slices 8–9).
- [ ] Statements of reasons to the author and the notifier, a police-referral action and appeals within six months (slices 10–11).
- [ ] Block, a per-deck comment switch, and rate limits on comments and reviews (slice 12).
  - [ ] **L5, low (security audit, 2026-11-10):** no community write calls `checkRateLimit` today: comments, ratings, votes, follows and card packages (`src/app/api/community/`). Per-user limits need the shared store of I-05's M2 first.
- [ ] **L4, low (security audit, 2026-11-10):** stop a repeated report reopening a closed deck report. `src/app/api/community/decks/[id]/reports/route.ts` upserts with `status: "pending"`, so a reporter can send a dismissed report back to the queue after every decision. Fix branch in flight: `fix/api-small-hardening`, no PR yet.
- [ ] After slice 0: a transactional email sender with an exit path, a daily retention job with a dry run, and email copies of statements of reasons (slices 13–15).

### Engineering enablers

- A deletion test seeds a user with every relation and asserts each row of the cascade table; a request with the deleted user's valid JWT returns 401 and creates no user.
- A guard test fails when a Prisma model with a `userId` is neither exported nor listed as excluded.
- A hidden item is absent from the public deck page, the profile, community lists, the share link and `/api/v1`, and its author still sees it.
- Each retention period lives in one constant that the job and the privacy policy both read.

**Paid-tier angle:** none. Export, deletion, reporting, blocking, comment controls and appeals are free on every plan, and expiry or downgrade never limits them, extending I-30 requirement 1.2. Its value to I-30 is trust: a cheap subscription is easier to sell when leaving is easy and documented.

### Definition of done

A deleted account stays deleted on every device after its owner could download all of it, and other players' replies survive; every public item can be reported signed in or out, and every restriction reaches its author with a statement of reasons and a route to appeal; the legal notice, DSA contact, terms and privacy policy are public, versioned and name every processor.

---

## I-39: First Run, Activation And Product Measurement

**Spec:** [`specs/i39-first-run-activation-and-measurement.md`](specs/i39-first-run-activation-and-measurement.md)

**Outcome:** a visitor reaches a useful deck without an account and keeps it on signing up, and the owner counts activation and retention from the product's own database, with no third-party tracker.

**Status:** Next — proposed 2026-11-09
**Priority:** Next
**Impact / effort:** High / medium
**Depends on:** I-38's privacy policy and the lawyer questions of slice 0 before the event store; I-17 slice 2 for official precon samples; I-30 slice 1 for AI usage; I-05's tool decision before any page analytics.

I-30 needs evidence before a price, and today none of it can be counted: there is no event store, no activation definition and no retention view. The first run also loses players the product already won: a modal covers the landing page, and a guest who builds a deck and then signs up lands on an empty deck list. The readable references, EDHREC, Archidekt and ManaBox, let a visitor start without an account, and the [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy) forbids requiring "email registration to access your Fan Content". The CNIL exempts audience measurement from consent only under strict conditions and names no product, and PostHog Cloud EU's own documentation asks for consent. So measurement stays first-party, written by the app's own routes, with an allowlist of seven events and an opt-out. No conversion, activation or retention figure for any MTG tool was found.

### Scope

- [ ] Stop the onboarding modal opening on public pages and correct its two wrong lines (slice 1). Today `OnboardingWizard` (`src/components/onboarding/OnboardingWizard.tsx`) mounts on every `[locale]` page through `src/app/[locale]/providers.tsx`, the landing and public deck pages included, and `src/messages/en/onboarding.json` points to a "New Deck" button the landing navbar lacks and to an AI wizard a guest cannot open.
- [ ] Keep a guest's deck at sign-up (slices 2 and 6). Today `SignUpForm` (`src/components/auth/SignUpForm.tsx`) ignores `callbackUrl` and sends both sign-up routes to `/decks`, and nothing copies the guest deck from the browser into the account, so the new account starts empty. Slice 2 honours a same-origin `callbackUrl` and says honestly that the deck stays in the browser; slice 6 offers to save the guest deck and clears the local copy only after the server confirms.
- [ ] Tell a guest that AI suggestions need an account (slice 2). Today `useAISuggestions` (`src/hooks/useAISuggestions.ts`) shows the raw `AI request failed (401)` in the guest builder.
- [ ] Delete `GET /api/templates` or make it return real rows only (slice 3). Today `src/app/api/templates/route.ts` returns two hard-coded templates for any commander, with invented authors ("CommunityBuilder", "TopPlayer") and upvote counts.
- [ ] Set Sentry's random-session replay to zero, keep error replays with explicit masking, and keep tokens, usernames and query strings out of URLs sent to third parties (slice 4). Today `src/instrumentation-client.ts` sets `replaysSessionSampleRate: 0.01`, and neither the replay nor the AI providers are disclosed; I-38 slice 6 discloses them.
- [ ] An inline first-run panel and empty states that offer import and a sample deck, landing starts that work signed out, interim sample decks and a first-build checklist computed from the deck's state (slices 5, 7–9).
- [ ] A first-party event store: seven allowlisted events, one activity row per account per day, guest counters with no identifier, an opt-out that deletes past rows, and a 25-month fold into cohort aggregates (slice 10).
- [ ] Instrumentation, then an owner-only activation view with n and 95% intervals (slices 11–12).
- [ ] I-30's evidence: 30-day active accounts, AI calls per active account, use of each paid candidate's free version, and one opt-in survey (slice 13).
- [ ] An experiment protocol: a dated file per experiment, a sample size fixed in advance, and significance read only at the planned end (slice 14).

### Engineering enablers

- A schema test rejects any event property that is free text, an email-shaped value, a URL or an unknown key; no measurement row or log line holds an email, name, IP address, user agent, card list or URL.
- No third-party analytics script, pixel or SDK loads, and `script-src` gains no host.
- A config test asserts that `replaysSessionSampleRate` is 0 and that masking is explicit.
- A denominator under 30 renders as a count, not a rate.

**Paid-tier angle:** nothing here is paid. Its use to I-30 is evidence: it turns I-30's audience and cost assumptions into counts before a price is set. Interest in a future paid feature is asked through a labelled survey, never through a control for a feature that does not exist.

### Definition of done

A fresh visitor builds, checks, playtests and exports with no modal and no account and keeps the deck on signing up, and the owner reads weekly activation and retention, with n and intervals, from rows that hold nothing personal beyond an account id.

---

## I-40: Installable App, Phone-First Use And Card Scanning

**Spec:** [`specs/i40-installable-app-and-card-scanning.md`](specs/i40-installable-app-and-card-scanning.md)

**Outcome:** a player installs MagicAIBuilder to the home screen and uses its main journeys at phone size, tested on every push; camera scanning enters the product only if a published benchmark, Scryfall's written answer and the owner's decision allow it.

**Status:** Later — proposed 2026-11-09
**Priority:** Later, with a no-regret first part (installability and phone journeys, slices 1 to 5) that can ship now
**Impact / effort:** Medium / medium for slices 1–5; large for scanning
**Depends on:** nothing for slices 1–5. Scanning needs I-06 printing-level ownership, I-26 slice 3's staged commit, the benchmark and Scryfall's answer (slices 6–7), and the owner's go decision.

Players build and check decks on their phones, at the table and at the store. Today the site has no manifest, no home-screen icon and no phone-sized test, and a security header blocks the camera on every page. Installing as a web app is cheap: Safari 26 opens every home-screen site as a web app, and Chrome needs a manifest but no service worker. Scanning is different. In our count of the 250 most recent US App Store reviews per app, 57 of ManaBox's 82 reviews at three stars or fewer mention scanning, and Dragon Shield and TCGplayer draw the same complaints: sleeved and foil cards, the wrong printing, slow confirmation. No published accuracy figure for a browser-based Magic scanner was found. Single scans are mostly free elsewhere; what is sold is quantity or bulk.

### Scope

- [ ] A manifest with PNG, maskable and apple-touch icons, theme colours from the Lumen tokens, `viewportFit: "cover"`, `appleWebApp` and localized shortcuts, reachable without a session and guarded by a test (slice 1).
- [ ] Safe-area insets on the builder's bottom bar and the header, an in-app way back on journey screens, and external links that open outside the app window (slice 2).
- [ ] An install help page in English and French, with no automatic prompt (slice 3).
- [ ] Mobile WebKit and mobile Chromium Playwright projects running `@phone` journeys in the Docker gate, a Lighthouse mobile run, and a real-device checklist for staging (slices 4–5).
- [ ] Allow the camera and WebAssembly on the scan route only (part of slice 9). Today `src/lib/security-headers.ts` sends `Permissions-Policy: camera=()` on every route, and `src/lib/security-headers.test.ts` asserts it, so `getUserMedia` fails; the production CSP has no `'wasm-unsafe-eval'`, so in-browser recognition would load in development and fail in production. Every other route keeps `camera=()`.
- [ ] A recognition benchmark under `scripts/research/` on at least 300 photos of real cards, Scryfall's written answer on an index derived from its images, and the owner's recorded go or no-go (slices 6–7). No scanning code enters `src/` before all three.
- [ ] After a go: an index built from Scryfall bulk data, a signed-in scan route that stages rows through I-26 with "camera scan" provenance and never picks a printing silently, then bulk mode and server help (slices 8–12).

### Engineering enablers

- Every icon the manifest names exists at its stated size, read from the PNG header.
- The security-header test denies the camera on every route except the scan route.
- On the scan route, request interception shows that no image leaves the device unless the player accepted server help for that batch.

**Paid-tier angle:** installability, the phone journeys and single on-device scans stay free and unlimited; single scans cost the server nothing. Bulk mode and server help are I-30 candidates because they save time or cost money to run. Whether a paid tool fits the Fan Content Policy and Scryfall's no-paywall rule is I-30's legal question.

### Definition of done

The app installs on iOS and Android, and the phone journeys pass in mobile WebKit and Chromium on every push and on two real devices before promotion. For scanning, either the owner's go decision and a published benchmark exist, or scanning stays a recorded non-goal.

---

## I-41: Store Commander Nights And Organiser Tools

**Spec:** [`specs/i41-store-commander-nights.md`](specs/i41-store-commander-nights.md)

**Outcome:** an organiser opens a casual Commander night, checks players in by QR code with or without an account, and forms pods of three to five by declared and estimated bracket. Players never pay, and a guest leaves only a nickname that is deleted within a day.

**Status:** Later — proposed 2026-11-09
**Priority:** Later, with a cheap early part: the pairing policy and an account-free pod planner (slices 1 and 2) need no schema and store no personal data
**Impact / effort:** Medium / medium
**Depends on:** stores' demand, measured on the planner and asked of two stores, one French, before slice 3; I-15 for declarations and pod sheets; I-35 slice 6 for logging; I-36 slice 1 for public decks; I-38 slices 6 and 8; I-30 for the store plan.

Wizards EventLink records who came and forms no pods: for Commander "no pairings or match results are required", and Player List Only events "do not generate pairings". Pod pairing was requested in 2021, and Wizards answered that each community defines a Commander event differently. Stores pair by hand, in WhatsApp, with a browser extension, or pay TopDeck.gg $12 a month for pods, check-in and a store page. DeckCheck checks store lists against a bracket for free but forms no pods. No tool found pairs a night's pods by declared and estimated bracket. MagicAIBuilder already holds the deck and a deterministic bracket estimate. EventLink deletes a guest's name after 24 hours, and this initiative applies the same rule. It builds neither a tournament manager nor a venue directory, and it owns the store pairing that I-15 leaves out.

### Scope

- [ ] `formPods`, a pure function with allowed pod sizes, a maximum bracket spread, dedicated brackets, play-together groups and a deterministic tie-break, tested against a brute-force optimum (slice 1).
- [ ] An account-free pod planner that prints pods and sends no label over the network (slice 2).
- [ ] Stores with owner and staff roles, a "not verified" label and `noindex` until verified; nights with a check-in window, capacity, house rules and a rotating QR token (slices 3–4).
- [ ] Account check-in that freezes the deck version, the declared bracket and the estimate with its method, and guest check-in with a display name only, the GDPR Art. 13 notice and a purge 24 hours after the night (slices 5–6). `Deck.targetBracket` is never read as a declaration.
- [ ] An organiser screen with rounds, manual moves, latecomers, a waiting list and a "talk before the game" prompt at a gap of two brackets, then a public night page through I-36's public projection; a night creates no share link (slices 7–8).
- [ ] Consented I-15 sheets per pod, logging a game through I-35, and store verification with reports through I-38 (slices 9–11).
- [ ] Store-private history and a pod-health report, then store-plan entitlements after I-30's decision (slices 12–13).

### Engineering enablers

- The same input gives the same pods, and total spread equals a brute-force optimum on fixtures of up to 12 entries.
- Past the purge time no response holds a guest's name, and a guest request carrying an email is refused.
- The public check-in endpoint is rate-limited per night and per network address across instances, not by today's per-instance memory store.

**Paid-tier angle:** players never pay: check-in, pods, sheets, logging, the planner and a store page stay free. Candidates are store tools over the store's own nights: recurring templates, history across nights, a pod-health report, extra staff seats, branded posters and a CSV export without guest names. The spec estimates €8 to €12 a month, anchored on TopDeck.gg's $12, the only public comparable found; I-30 decides.

### Definition of done

At a night, every checked-in player sits in a pod of an allowed size within the night's bracket spread or waits with a stated reason, the public page shows declared brackets only, and no guest name survives 24 hours after the night ends.

---

## I-42: Commander Variants: Duel Commander, cEDH, Pauper Commander And Others

**Spec:** [`specs/i42-commander-variants-duel-cedh-pauper.md`](specs/i42-commander-variants-duel-cedh-pauper.md)

**Outcome:** a player chooses a deck's format, sees each legality verdict with its named, dated list, and builds and playtests a Duel Commander deck at 20 life with no free mulligan and no banned-as-commander card in the command zone.

**Status:** Next — proposed 2026-11-09
**Priority:** Next for the format picker, legality and Duel Commander (slices 1 to 6); Later for the other variants
**Impact / effort:** High / medium
**Depends on:** the Duel Commander Rules Committee's answer on the mulligan before slice 3 ships; I-28 slice 2 for bracket 5 and the cEDH link-outs.

The roadmap lists nine formats as a completed foundation, but no screen lets a player choose one, and Duel Commander data already reaches Commander decks. Duel Commander is a 1v1 variant at 20 life, with its own committee and a banned list of 80 cards in the deck and 27 as commander only, last updated 2026-07-27. MTGTop8's 20 latest Duel Commander events came from ten countries and online play, France included. Scryfall already encodes most variants, but it uses `restricted` for "banned as commander" in `duel` and for one copy in Vintage. The committee's former site, mtgdc.info, now announces AeonShift, and the committee says that site is no longer official, so a product must name the right source. No French-language deckbuilder found checks Duel Commander legality, and no competitor page read states the date of the list it applies.

### Scope

- [ ] A format picker at creation and in deck settings; switching re-validates and removes no card (slice 1). Today `src/components/deck/FormatSelector.tsx` is never rendered and `createDeck` sends no format, so every deck created in the app is a Commander deck. Duel Commander lists from the MTGTop8 meta panel (`src/lib/meta/mtgtop8.ts`, `src/components/deck/MetaPanel.tsx`) and Moxfield `duel` imports (`src/lib/import/url-import.ts`) land in those decks, with the multiplayer banned list, 40 life and the free mulligan.
- [ ] Legality computed on the server from Scryfall at each deck load, with a per-format meaning for `restricted` and the fetch date shown; a client-sent `isBanned` is never trusted (slice 2).
- [ ] A Duel Commander format: 100 cards, 20 life, no free mulligan, no bracket scoring or Game Changer toast, and banned-as-commander cards excluded from the commander picker (slice 3).
- [ ] One commander cast from the command zone per game with two commanders, and imports and meta labels that offer a Duel Commander deck instead of adding its cards silently to a Commander deck (slices 4–5).
- [ ] A source register that names duelcommander.org, and a scheduled drift check against Scryfall that marks a list "under review" on a mismatch (slice 6).
- [ ] Later: a player-count choice in the playtest, which closes I-07's follow-up from #1301; the Brawl split; Oathbreaker; Pauper Commander; ban notices on saved decks; cEDH link-outs; Canadian Highlander; and Tiny Leaders, parked on demand (slices 7–14).

### Engineering enablers

- Golden legality fixtures per variant: Lumra as a Duel Commander commander is an error and is legal in the 99; Sol Ring is banned in Duel Commander and legal in Commander.
- A table-driven test maps `restricted` for each format and fails when a new Scryfall key appears without a mapping.
- The drift check runs on recorded fixtures in CI and against the live pages only on schedule.
- Every format label and legality message exists in English and French, and no model decides or explains a verdict.

**Paid-tier angle:** every verdict and its list date, the picker, variant life and mulligan, and banned-list pages stay free. Candidates are an automatic watch over a player's saved decks for bans and unbans, which joins I-18's candidate, and personal Duel Commander matchup statistics from the player's own I-35 logs, never from TopDeck.gg data.

### Definition of done

A player creates a Duel Commander deck, sees each verdict with its list and date, cannot put a banned-as-commander card in the command zone, and playtests at 20 life with no free mulligan; no Duel Commander list lands in a Commander deck unless the player chooses it.

---

## I-43: Physical Collection: Storage Places, Deck Boxes And Pull Lists

**Spec:** [`specs/i43-physical-collection-storage-and-pull-lists.md`](specs/i43-physical-collection-storage-and-pull-lists.md)

**Outcome:** a player records where each physical copy sits, pairs a built deck with its box, and gets a pull list ordered by place and a put-back list when a deck changes or is dismantled.

**Status:** Later — proposed 2026-11-09
**Priority:** Later. The deck-box path (slices 1 to 5) needs no collection import and can be promoted on its own; binders and boxes at scale wait for I-26 slice 3
**Impact / effort:** Medium / medium
**Depends on:** nothing for slices 1–5; I-26 slice 3 for places in a collection import; I-19 slices 3 and 4 for offline labels; I-30 for the two paid candidates.

[I-16](#i-16-decks-buildable-from-a-collection) answers which deck a copy belongs to; nothing answers where the copy is. A player with twenty decks and a few binders finds a card from memory. EchoMTG shipped Locations on 2026-06-17, and Grimoria links a deck to its box; both flag drift between a deck and its box. Players on r/Moxfield ask for the binder a card sits in, an "In Use" mark and the cards they play most across decks; every software request scored under 10 points, so the evidence is many small requests. No product found builds a pull list ordered by place, a put-back list or a plan across several decks for one night. EchoMTG charges for nesting from $4 a month; here nesting stays free.

### Scope

- [ ] Schema for storage places, placements and moves, with one write module that keeps placed copies at or below the owned quantity under a row lock (slice 1).
- [ ] Places that nest up to five levels, with sort orders, deletion that moves contents, and a computed Unplaced (slice 2).
- [ ] Placing copies one row at a time or in bulk, quantity decreases and printing merges that keep placements consistent, and "Stored in" next to "Used in decks" (slice 3).
- [ ] Deck-box pairing, the box state on the deck page, and "put this deck in its box" with a preview (slice 4).
- [ ] A read-only pull list ordered by place, confirmed as moves with undo (slice 5).
- [ ] The put-back list and dismantling, misplaced-card and contention warnings, and cards across decks with a "built decks only" acquisition scope (slices 6–8).
- [ ] Deck-box labels with a QR code to a revocable `/b/<token>`, disallowed in robots and `noindex`; offline labels through I-19; a place column in the collection export and later its import (slices 9–12).
- [ ] After I-30's decision: a game-night planner across several decks, and a move-history timeline (slices 13–14).

### Engineering enablers

- Two concurrent moves of a row's last Unplaced copy let exactly one through.
- The pull list, put-back list, warnings and cross-deck view write nothing, asserted against the Prisma client.
- `/b/<token>` reveals no deck name to anyone but the owner unless the owner turns on "label opens the shared deck".

**Paid-tier angle:** places, nesting, pairing, single-deck pull and put-back lists, warnings, cross-deck views, labels and exports stay free. Candidates are the game-night planner, which settles contention between several decks for one night, and the move-history timeline; the moves themselves are stored and exported free for everyone. EchoMTG sells its move history on the $12 Pro plan.

### Definition of done

A player pairs a deck with its box, pulls the missing cards in place order, puts back what the deck no longer needs, and no placement ever exceeds the copies owned.

---

## I-44: Trade Lists Within The Pod And Nearby Players

**Spec:** [`specs/i44-trade-lists-within-the-pod.md`](specs/i44-trade-lists-within-the-pod.md)

**Outcome:** a player keeps have and want lists filled from the collection and the acquisition plan, shares them by link or with friends and the pod, compares both sides of a swap at dated prices, and agrees a card-for-card swap at a store or the next game, with no chat and no money.

**Status:** Later — proposed 2026-11-09
**Priority:** Later, with a cheap early part: private lists, share links, the balance view and the friends audience (slices 1 to 7) need no I-38 work and collect no new personal data
**Impact / effort:** Medium / large
**Depends on:** I-15 pods for the pod audience; I-38's block, reports and legal pages before proposals and the wider audiences; I-41 check-in for the store audience; I-16 slice 4 for free copies; lawyer answers before slice 12.

Commander players trade with the people they play with, and a deckbuilder already knows the two facts a trade needs: the cards each deck still lacks and the copies no deck uses. No product read builds wants from a deck's missing cards or haves from unused copies. Where a price was stated, lists and a value comparison are free (SuperSwap, Dragon Shield, EchoMTG up to $50 a trade); TappedOut charges $5 once to start a trade request. Nearby matching has a cold-start problem: SuperSwap's users in Rouen, the Paris region and a town of 50,000 found few or no players near them. Trade lists also lead towards a marketplace: CardNexus announced its marketplace in the same post as its trade lists. So the pod and friends come first and nearby players last, and the spec stays below the marketplace line.

### Scope

- [ ] Private have and want lists with three strictness levels, pasted and exported in the deck text format (slice 1). "Any printing" matches by English name until Oracle identity is stored: I-37 slice 12 for deck cards, I-06 for collection rows.
- [ ] Fill a have list from the collection and a want list from the acquisition plan, with a preview (slice 2).
- [ ] A share link and QR code with an allowlisted public page, `noindex` and a robots rule (slice 3), and a balance view in USD or EUR from Scryfall's dated prices, with no account needed and no conversion (slice 4).
- [ ] "Compare with mine", a friends audience of mutual follows, and trade-first marks on the acquisition plan (slices 5–7).
- [ ] A pod audience, then structured proposals between friends and pod members, with no free text, a 7-day expiry and a 30-day purge (slices 8–9).
- [ ] Reports for lists and proposals and a free-copies mode, then, after the lawyer answers, an adult declaration with a city opt-in, a store audience and on-demand nearby matches behind a density gate (slices 10–14).
- [ ] Confirmed-partner bands instead of ratings (slice 15), and a continuous match watch only after I-30's decision (slice 16).

### Engineering enablers

- A schema test fails when a trade model gains a text column another player can read.
- No route returns another player's city outside a nearby match, and opting out deletes the row in the same transaction.
- The balance module holds no exchange rate.
- A list shared with one pod is unreachable from another pod, from a signed-out request and from `/api/v1`.

**Paid-tier angle:** lists, sharing, the balance view, matching within friends, pods and stores, on-demand nearby matching, proposals, safety and blocking stay free. The one candidate is a continuous match watch with a digest, and the spec rates the evidence for it weak, because SuperSwap and EchoMTG alert for free. A paid plan never changes who sees a list, the order of matches or the limits.

### Definition of done

Two players in one pod see each other's matching cards, total both sides at the day's price, and agree a swap for their next game; no field another player can read holds typed text, and no asking price, payment or address is stored.

---

## I-45: Selling Spare Cards: Collection Value, Buylists And Seller Exports

**Spec:** [`specs/i45-selling-spare-cards.md`](specs/i45-selling-spare-cards.md)

**Outcome:** a player sees which owned copies no deck uses and their estimated value in a chosen market, with source and date, and exports them in a file that Card Kingdom or Cardmarket's tools accept; the sale happens on the buyer's site.

**Status:** Later — proposed 2026-11-09
**Priority:** Later, with a no-regret first part (slices 0 to 3) that may be pulled forward
**Impact / effort:** Medium / medium
**Depends on:** I-32 slices 2 and 3 for the market choice and dated prices (slice 4); I-16 slice 4 for one commitment index; I-06 for per-copy condition and the etched finish; Card Kingdom's written permission, I-30's legal gate and a feed contract for the paid candidates.

Players own more copies than their decks use, and nothing in the product works in the selling direction: I-32 sends what a deck needs to a seller, not what the player could sell. Bulkwise (2026-09-20) prices a CSV and exports a Card Kingdom sell file for free, and Archidekt exports to Card Kingdom's buylist; both start from a list the player already made. MagicAIBuilder knows which copies sit in which deck, so it never offers to sell a card the player is playing. Cardmarket documents no stock CSV upload and takes no new API applications, so its deliverable is a listing sheet. TCGplayer ended its buylist on 2024-07-17. Scryfall's prices are "dangerously stale after 24 hours" and not meant to "power a storefront or sales system", so no listing price is prefilled.

### Scope

- [ ] Spare copies, owned minus committed minus kept and never below zero, with the sideboard counted as committed by default and copies of another printing flagged as possibly in play (slice 0), and a spare view with keep marks and filters (slice 1).
- [ ] A Card Kingdom sell CSV with an edition map, parts split at 500 lines or 5,000 cards, and a "kept, set again, unmapped" summary, after a person checks the fixture in Card Kingdom's tool (slice 2).
- [ ] A Cardmarket listing sheet keyed by product ID and a generic CSV, with identifiers from server-side Scryfall data and never from the client-written `CardCache` (slice 3).
- [ ] Free valuation per market and finish, dated, with unpriced copies apart, applied also to the collection's "Total Value", which today prices every copy, foils included, at `prices.usd` with no date (`src/components/collection/CollectionPageClient.tsx`) (slice 4).
- [ ] Per-copy condition and the etched finish on collection rows (slice 5, an I-06 data change), an inventory report with its SHA-256, printable lists for shops without an upload, "remove sold copies" with confirmation, and export counts with no user column (slices 6–9).
- [ ] Switch the spare count to I-16's commitment index once it ships (slice 10).
- [ ] Paid candidates, each blocked on a decision: a buylist comparison against Card Kingdom's price list, value history and a snapshot archive on a licensed feed (slices 11–13).

### Engineering enablers

- The export and report routes make no outbound request, asserted with an HTTP mock.
- A tampered `CardCache` entry never reaches a seller file.
- No seller file contains a Scryfall price, and an EU-market view never shows a USD figure.
- Exporting leaves `CollectionCard` unchanged.

**Paid-tier angle:** the spare list, valuation, exports and the inventory report stay free, by Scryfall's paywall clause and the player's right to their own data. Candidates for I-30 are value history and a snapshot archive for insurance, on a licensed feed, and a buylist comparison that the spec recommends keeping free if Card Kingdom permits it. None ships before I-30's legal gate, and none sends "sell now" alerts.

### Definition of done

A player exports their spare copies, which never include a copy their decks use, as a Card Kingdom file and a Cardmarket listing sheet, each line valued in the chosen market with its date or listed as unpriced, and the product never handles the sale.

---

## I-46: Discord And Chat Integrations For Pods And Creators

**Spec:** [`specs/i46-discord-and-chat-integrations.md`](specs/i46-discord-and-chat-integrations.md)

**Outcome:** a deck link pasted into Discord, Slack, WhatsApp or Telegram shows the commander art with its artist, the deck's name and author, its declared bracket and its legality; a pod compares its decks with a slash command; and a creator's server receives deck updates by webhook. No bot reads the conversation.

**Status:** Next — proposed 2026-11-09
**Priority:** Next for link previews (slices 1 to 3, no bot); Later for webhook feeds and the Discord app (slices 4 to 15)
**Impact / effort:** Medium / small for previews; medium for the app
**Depends on:** I-36 slices 1 and 2 for the public projection and the deck image; I-38 slices 6 and 7 before the app's install link is public; I-28 slice 7 for estimated brackets; a rate limiter shared across instances (I-36 slice 11 or I-05).

Playgroups, stores and creators organise Commander on Discord, and the reference sites grew partly because those communities asked for their links. Card lookup and combo search are already free in chat: Scryfall's bot, Commander Spellbook's bot and Otterly MTG, which reports "242+" servers and "28.2K+" users itself. No bot found compares a pod's decks side by side or shows a declared bracket beside an estimate with the date of its rules. A link that unfurls well needs no bot, stores no data and falls under no app policy, and today MagicAIBuilder's links unfurl poorly. A bot is a support surface: Discord's data rules apply from the first install, verification from 100 servers, and since 2024-10-07 an app that sells paid features must also sell them through Discord at no more than the web price, with Discord keeping 15% and later 30% ([Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy)). So previews come first, and the app reads only the commands addressed to it. [I-23](#i-23-the-pods-own-surface) keeps account linking, consent and `/pod`.

### Scope

- [ ] A preview contract for every public page: full Open Graph and Twitter tags, `theme-color`, byte budgets, and a crawler path with no redirect and no cookie, under conformance tests (slice 1). Metadata must read the database directly: today `fetchPublicDeck` (`src/lib/deck/public-deck.ts`) calls the page's own API with a 15-second timeout, above Discord's 10-second budget for a whole preview.
- [ ] Show deck previews large and credit the artist (slice 1). Today `src/app/[locale]/deck/[id]/page.tsx` sets `og:image` to the commander's Scryfall `artCropUri` with no `twitter:card`, so Discord shows only a small thumbnail, and `DeckCard` stores no artist, so the art crop reaches chat without the artist credit Scryfall requires.
- [ ] Replace the SVG default image with a PNG (slice 1). `src/app/[locale]/layout.tsx` declares `/og-image.svg`, and Discord does not render SVG, so every page other than a deck or share page unfurls with no image.
- [ ] Deck previews from I-36's `/og/deck/{id}` with dimensions, alt text and a version parameter, then an oEmbed author line and a Discord component embed with "Open deck" and "Playtest" buttons (slices 2–3).
- [ ] A pure chat formatter from the public projection, then deck-update feeds by channel webhook on an explicit "Publish update", at most one post per deck an hour, with the webhook URL stored encrypted (slices 4–5).
- [ ] The Discord app: a signed interactions endpoint with no Gateway connection and no `MESSAGE_CONTENT`, server settings, shared rate limits, then `/deck`, `/bracket-check`, `/combo`, `/lineup`, `/gamenight` and `/card` (slices 6–13).
- [ ] Install and command counters for I-39, then verification and a public install link once I-38's privacy policy and terms exist (slices 14–15).

### Engineering enablers

- A conformance test parses each page type's server HTML with Discord's tag rules, checks the byte budgets with long Unicode names and the image size and type, and fails on SVG.
- One deck gives the same reply bytes twice, legality and brackets equal the web page's, and a dependency test fails if the interactions route imports the AI client.
- A schema test fails if any column holds a Discord user id, a username, message text or a webhook URL in clear.
- Private, deleted, share-token and missing decks get identical replies.

**Paid-tier angle:** previews, oEmbed, component embeds, every command, polls and one feed per deck stay free, and no paid feature lives inside the Discord app, because it would also have to be sold through Discord. The candidates are on the web: I-41's store plan posting night line-ups to the store's server, and I-36's creator analytics counting visits from chat. The spec rates the case weak to medium. Whether webhook delivery from a paid web plan counts as a paid feature of the app is a question for the lawyer and for Discord.

### Definition of done

A deck link pasted in Discord shows the commander art with its artist, the name, author, declared bracket and legality, and an "Open deck" button; every public page unfurls with a PNG image; a pod runs `/lineup` on four public decks and sees the bracket spread; and a creator's server gets one post per published update with no bot installed.

---

# Completed Foundation

These capabilities are not future bets. They are part of the product baseline:

- Scryfall search, filters, printing selection and localized card data.
- Commander, Brawl, Oathbreaker, Standard, Pioneer, Modern, Legacy, Vintage and Pauper rules. **Correction 2026-11-09:** these exist as format data (`FORMAT_CONFIG`), but no screen lets a player choose a format, so every deck created in the app is a Commander deck; see [I-42](#i-42-commander-variants-duel-commander-cedh-pauper-commander-and-others).
- Deck CRUD, snapshots, annotations, tags, import/export and sharing.
- Commander pairing, Ikoria Companion, Sideboard and Considering zones.
- Bracket scoring, Game Changers, banlists, mana alignment and deck statistics.
- AI archetypes, budget-aware suggestions and explanations.
- Collection tracking, shopping lists and proxy PDF export.
- Playtest engine and session analytics.
- Community profiles, public decks, ratings, votes, follows and comments.
- EDHREC, tournament and Commander Spellbook integrations.
- Sentry, health checks, structured logging, CI, Lighthouse CI and Dependabot.

---

# Explicitly Parked Or Blocked

These items remain visible so they are not forgotten, but they are not part of the next delivery order:

- **Prisma 7:** wait for Node 22.12+ locally.
- **Cloudflare R2:** wait for a concrete durable-media use case.
- **Custom domain and DNS:** do after the product URL and production ownership are settled.
- **PostHog, Plausible or LogRocket:** choose after defining measurable product questions.
- **Chromatic:** adopt when the component surface and visual regression budget justify it.
- **Datadog, Better Uptime, Grafana, OpenTelemetry and PagerDuty:** scale operations only when traffic and incident cost justify them.
- **Goldfish import:** wait for a supported access path.
- **Tournament win rate:** wait for terms that allow this product to show match-level results. TopDeck.gg has the data; its developer terms of 2026-10-27 forbid commercializing it (I-09).
- **Local MageZero model:** revisit after the cloud AI copilot has measurable usage and evaluation data.

---

# Delivery Rules

- Feature and fix branches target `dev`.
- Promotion order is always `dev` -> `staging` -> `main`.
- `staging` is the QA alpha candidate; `main` receives only code validated by QA and colleagues.
- A PR is not ready without typecheck, lint, unit tests, the agreed Docker E2E strategy and SonarCloud verification.
- Roadmap status changes only when the feature is present in code and its acceptance evidence exists.
- Product initiatives may be split into small PRs, but their definition of done remains the source of truth.
