# MTG Competitive Landscape

> **Last updated:** 9 November 2026
> **Purpose:** Product strategy reference for MagicAIBuilder
> **Method:** Public product pages, help pages and vendor changelogs reviewed on 8 November 2026 (Europe/Paris), plus the `dev` roadmap and README. This was not a signed-in test of every product. Vendor claims are not independent measurements. Reddit threads cited below are dated testimony, not a survey. **Not established** means not verified on the surfaces reviewed, not proven absent. A second pass on 9 November 2026 covered traffic, monetization, the marketplace path, editor depth, analytics, game tracking, AI economics and player demand; its findings and corrections are in [section 10](#10-additions-from-the-9-november-2026-pass). Traffic figures there are third-party modelled estimates. Reddit scores in that section come from the Arctic Shift archive, because Reddit refused automated reads.

The March 2026 edition of this document treated EDHREC's interface as dated, treated conversational Commander building as an empty market, and quoted approximate traffic, subscriber and premium prices. Those audience figures were not revalidated and are withdrawn. Prices below are the figures found on the cited page, in that page's currency, with no conversion.

---

## Executive Summary

1. **EDHREC modernized in October and November 2026.** The redesign added card context, configurable views, Lift, bracket and budget filters, and a round of performance fixes. It remains the benchmark for aggregate Commander data. It is not a personal deck editor with storage, versioning and playtesting comparable to Moxfield. The playtest action delegates to Archidekt.

2. **Conversational Commander assistance is already for sale.** DeckCheck and Farseek both ship chat, search and deck-aware advice. An LLM is not an uncontested gap. The useful difference is a loop the player can check: intention, a legal list, traceable explanations, reproducible tests and an informed purchase.

3. **Moxfield, Archidekt and ManaBox still own their specialties.** Moxfield is the benchmark for fast editing, sharing and presentation. Archidekt is the benchmark for a visual editor, packages and collaboration. ManaBox is the benchmark for mobile collection management and offline search.

4. **Players already split the job across tools.** Building in one product and presenting the list in another is a normal workflow. Reliable import and export matter more than assuming the community will move in full.

5. **Scryfall stays shared infrastructure.** Use it for card data and search. Do not rebuild the card database, and do not paywall Scryfall's own data.

6. **9 November 2026: the references grew on habit, and players pay for tools.** Scryfall, Moxfield and EDHREC each draw an estimated 16–23 million visits a month, mostly direct. Paid tiers that work sell AI usage, capacity, price tools and personal history, never reference data. Free tools already simulate a player's own list with the free mulligan, and r/EDH punishes undisclosed AI. See [section 10](#10-additions-from-the-9-november-2026-pass).

---

## 1. Functional Comparison

| Product                                                                                                                                                         | Build                                              | Advice and analysis                                           | Test                                                            | Collection                                      | Mobile and distinctive strength                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| **MagicAIBuilder**                                                                                                                                              | Zones, tags, packages, snapshots, imports          | Constrained copilot, six-axis bracket, combos, EDHREC rows    | Goldfish, logs and snapshot evidence                            | Owned and missing cards, multi-deck acquisition | Responsive web. Lumen foundations shipped; the visual redesign is still open |
| **Moxfield** ([features](https://github.com/moxfield/moxfield-public/wiki/Features))                                                                            | Scryfall syntax, categories, history, primers      | EDHREC, curve, mana sources, legality                         | Sandbox, tokens and counters                                    | Yes                                             | Web. Sharing and presentation                                                |
| **Archidekt** ([guide](https://edhrec.com/guides/how-to-use-archidekt-the-mtg-deckbuilding-site), [interaction simulator](https://archidekt.com/news/26104256)) | Visual editor, packages, comparison, collaboration | EDHREC, complete and partial combos, land base                | Playtester with an interaction simulator (about September 2026) | Editions and physical condition                 | Web. Custom organization                                                     |
| **EDHREC** ([redesign](https://edhrec.com/articles/changelog-edhrec-redesign), [Recs](https://edhrec.com/recs))                                                 | Clipboard, import into Recs, export to editors     | Inclusion, Lift, filters, precons, combos, salt               | Button to Archidekt. No standalone simulator established        | Personal collection management not established  | Modernized web. Statistical discovery                                        |
| **ManaBox** ([product](https://manabox.app/), [App Store](https://apps.apple.com/us/app/manabox-mtg/id1460407674))                                              | Decks, folders, statistics                         | EDHREC recommendations, rules, prices                         | Native simulator                                                | Scanner, binders, versions, trades              | iOS and Android. Offline search                                              |
| **Deckstats** ([FAQ](https://deckstats.net/help-articles/faq), [Premium](https://deckstats.net/premium))                                                        | Decks, automatic tags on Premium                   | What to add or cut, near-combos, hand analysis                | Playtest. Premium first-turn analysis                           | Yes                                             | Web. Detailed tables                                                         |
| **TappedOut** ([level up](https://tappedout.net/help-desk/level-up/))                                                                                           | Decks, primers, history by account level           | Community feedback and deck analysis                          | Playtest                                                        | Inventory and wishlist                          | Web. Long-running community                                                  |
| **MTGGoldfish** ([Premium](https://www.mtggoldfish.com/premium))                                                                                                | Decks and a metagame library                       | SuperBrew from owned stock, prices and alerts                 | Not established here                                            | Buy and sell prices, saved lists                | Web. Price history                                                           |
| **Scryfall and Tagger** ([syntax](https://scryfall.com/docs/syntax))                                                                                            | Search and data. Not a full deck workflow          | Rich syntax, functional and art tags, rulings                 | Not established here                                            | Not established here                            | Free infrastructure. Do not duplicate it                                     |
| **Commander Spellbook** ([Find My Combos](https://commanderspellbook.com/find-my-combos/), [about](https://commanderspellbook.com/about/))                      | Paste or import a list for analysis                | Combos present and potential                                  | Not a playtester in the pages reviewed                          | Not established here                            | Open, community-maintained combo data                                        |
| **DeckCheck** ([product](https://deckcheck.co/), [support](https://deckcheck.co/support))                                                                       | Editor, Deckhand chat, Smart Search                | DTI, PowerTune, ManaTune, DeckTrim, cited rules               | Sandbox                                                         | Scanner, binders, paid Smart Binders            | Web. Direct AI competitor                                                    |
| **Farseek** ([product](https://farseek.ai/), [terms](https://farseek.ai/terms))                                                                                 | 100-card lists, chat with the 99 in context        | Persistent budget and bracket, Scryfall search                | Not established here                                            | CSV import, recommendations against stock       | Web. Direct AI competitor                                                    |
| **CommanderSalt** ([product](https://www.commandersalt.com/))                                                                                                   | Analysis of an imported list                       | Bracket, power, saltiness, synergies                          | Not established here                                            | Not established here                            | Explanatory power report                                                     |
| **Mana For Cards** ([own comparison](https://www.manaforcards.com/mana-for-cards-vs-manabox.html))                                                              | Lists and sharing                                  | Discover ranks commanders by how much of the stock they cover | No playtester, by its own comparison                            | Scanner, free copies versus allocated copies    | Web. Collection-first discovery                                              |

MagicAIBuilder's current baseline is ahead of the March brief. Reusable packages, Markdown primers, public comparison, attributed forks and exportable playtest logs are already checked on the roadmap. The proposals in that roadmap update do not repeat them.

---

## 2. Prices Found On 8 November 2026

| Product                                                                                                                               | Free access and funding                              | Price found on the cited page                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **MagicAIBuilder**                                                                                                                    | MIT repository. AI provider costs are separate       | No public product price was verified in this pass                                                                                              |
| **Moxfield** ([Patreon](https://www.patreon.com/moxfield/membership))                                                                 | Free, advertising, Patreon                           | A Patreon tier displayed at 1 USD. The exact benefits need another look before anyone relies on them                                           |
| **Archidekt** ([FAQ](https://archidekt.com/faq))                                                                                      | Free, advertising, Patreon                           | Ad removal at 2 USD per month or more                                                                                                          |
| **EDHREC** ([guide](https://edhrec.com/guides/how-to-use-edhrec), [FAQ](https://edhrec.com/faq))                                      | Free, advertising, affiliate links, Patreon          | 2 USD per month (Uncommon). 5 USD per month (Rare)                                                                                             |
| **ManaBox** ([App Store, US](https://apps.apple.com/us/app/manabox-mtg/id1460407674))                                                 | Free, with in-app purchases                          | PRO at 2.49 USD per month or 22.99 USD per year. Ad removal at 1.99 USD                                                                        |
| **Deckstats** ([Premium](https://deckstats.net/premium))                                                                              | Free base, Premium above it                          | 4.99 USD per month after a 7-day trial. An annual 49.99 USD figure appeared in a search index and was not confirmed on the opened Premium page |
| **TappedOut** ([level up](https://tappedout.net/help-desk/level-up/))                                                                 | Free, advertising, donations and paid visibility     | Supporter at 3 USD per month. A permanent upgrade from 5 USD. Tokens cost extra                                                                |
| **MTGGoldfish** ([Premium](https://www.mtggoldfish.com/premium))                                                                      | Free base, Premium above it                          | 5.99 USD per month or 59.88 USD per year                                                                                                       |
| **Scryfall** ([API](https://scryfall.com/docs/api))                                                                                   | Free data and API                                    | The API terms forbid paywalling Scryfall's own data                                                                                            |
| **Commander Spellbook** ([about](https://commanderspellbook.com/about/), [Patreon](https://www.patreon.com/commanderspellbook/about)) | Public access, MIT, Patreon support                  | No tier price was confirmed                                                                                                                    |
| **DeckCheck** ([support](https://deckcheck.co/support), [pricing](https://deckcheck.co/get-more))                                     | Free editor, 5 credits per day, further AI by credit | Annual plans at 48, 96 and 192 USD per year, which the page presents as 4, 8 and 16 USD per month. One-time credit purchases exist too         |
| **Farseek** ([pricing](https://farseek.ai/), [terms](https://farseek.ai/terms))                                                       | Free base and a weekly AI allowance                  | From 9.99 USD per month. 7.99 USD per month when billed quarterly. Top-ups from 1.99 USD                                                       |
| **CommanderSalt** ([support](https://buymeacoffee.com/commandersalt.com?l=en))                                                        | Buy Me a Coffee                                      | "Salt enthusiast" at 5 USD per month. That is optional support, not a required price                                                           |
| **Mana For Cards** ([own comparison](https://www.manaforcards.com/mana-for-cards-vs-manabox.html))                                    | The site says 3 decks and 3 drafts are free          | Pro at 7.99 EUR per month or 59.99 EUR per year                                                                                                |

The March 2026 "premium around 3 dollars" summary does not match these pages. Quote a price only from the page that will be current at implementation time.

---

## 3. EDHREC In October And November 2026

EDHREC's own changelogs are the source for this section. The [how-to guide](https://edhrec.com/guides/how-to-use-edhrec) already described Recs from the cards in a deck, precon Add and Cut, advanced filters and clipboard export before the visual redesign.

### Lift replaced Synergy

On 1 October 2026 EDHREC generalized Lift to commander, tag and combo pages, after using it on card pages. Lift is a ratio of two inclusion rates: how often a card appears in the current context, divided by how often it appears in the reference set of potential decks. The ratio is centered on 1. It is an association between a card and a context. It is not a win rate and it is not a causal claim. EDHREC adopted it because the older Synergy score had no comparable mathematical basis and favored popular staples over cards that are distinctive in one context. Potential decks follow color identity, restrictions, availability date and the active filters. Sources: [Lift changelog](https://edhrec.com/articles/changelog-replacing-synergy-with-lift-on-edhrecs-card-pages), [FAQ](https://edhrec.com/faq).

### 13 October 2026: visual system and navigation

The redesign shipped card modals with Oracle text and statistics, New, Salty and Game Changer flags, and card frames that leave the art visible. Gallery views are Stats, Table, Text and Images, with a configurable size, groupings and sorts. Commander pages use Recs, Charts, Combos, Similar, Average Deck and Decks. Filters cover color identity, bracket, budget and tags. Mobile galleries are two columns, and the clipboard can go full screen. The announcement does not say that any data set or page was removed. Source: [redesign changelog](https://edhrec.com/articles/changelog-edhrec-redesign).

### 22 October 2026: follow-up from player feedback

The follow-up reduced card size, made tooltips less intrusive, revised light mode, and corrected tablet and laptop layouts. Tags and copy-card-name came back. Recs regained add and cut scores. Active filters carry onto Combos and Similar. Dragging a card to Moxfield and the Archidekt export link were fixed. These are product corrections, not a second coat of color. Source: [redesign follow-up](https://edhrec.com/articles/changelog-redesign-follow-up).

### 6 November 2026: performance and statistical facets

The performance pass covers Firefox without hardware acceleration, a cheaper background, lazy loading that keeps images already seen, preloaded previews, and a faster first render of the home page. The same window added bracket histograms, a tag cloud with counts, bracket filters on Top Cards, Game Changers, Staples and Mana Rocks, a Game Changers timeframe, and a budget filter on Tags. The live home page shows a trend curve. Source: [performance changelog](https://edhrec.com/articles/changelog-big-performance-upgrades) and the [home page](https://edhrec.com/) reviewed the same day.

### What the current surfaces do, and do not, establish

Recs takes a commander and a list and personalizes recommendations from that content. Include and exclude filters select a cohort of decks. Sorting or filtering the card gallery changes which results are visible. Inclusion, sample counts and Lift have denominators. Source: [guide](https://edhrec.com/guides/how-to-use-edhrec), [FAQ](https://edhrec.com/faq), [Recs](https://edhrec.com/recs).

The clipboard, Recs import, Average Deck and Add/Cut tools are real construction aids. The pages reviewed do not establish a personal editor with its own storage, version history and playtest. Export links and the Playtest button hand the list to Archidekt. EDHREC and the Archidekt editor are different products.

The site presents itself as data-driven. This pass did not establish a conversational LLM or an official native mobile app. A responsive layout, personalized statistical recommendations and numeric scores are not evidence of generative AI.

Combos come from Commander Spellbook, with steps, prerequisites and a bracket recommendation. Salt is the average of an annual 0-to-4 survey of how a card feels. It is not an official bracket and it does not guarantee power. The guide describes Patreon as 2 USD per month for no ads and Discord, and 5 USD per month adding art choice, Load More and experimental access. Advertising and affiliate links sit alongside that.

### What MagicAIBuilder should take from it

Use contextual discovery and show the count and the limit behind a recommendation. Keep Lumen's density. Treat mobile and tablet performance as part of the feature.

Attach the lessons to initiatives that already exist:

- **I-09** separates inclusion, Lift and AI advice, names the cohort, and says when the data is missing. A local Lift score needs the reference denominator, a compatible source and an access contract. The top-20 feed is not enough.
- **I-04 and I-13** take the follow-up lessons on tooltips, image loading and tablet layout. The goal is a calmer dense workspace, not a copy of EDHREC's skin.
- **I-10** keeps export fixtures current. EDHREC's own post-redesign fixes for the Archidekt export and the clipboard commander are the reminder.
- **I-17** is the dedicated precon path. It is not a restatement of generic copilot suggestions.

---

## 4. AI And Analysis Products

DeckCheck sells a deck editor with Deckhand chat, Smart Search, DTI, PowerTune, ManaTune and DeckTrim, plus a sandbox, a scanner and binders. The support page documents that AI results vary between scans. A January 2025 thread found the game-plan analysis useful and also reported missed niche synergies and combos. An April 2025 thread is one of several places where players treat online power scores as unstable. Sources: [DeckCheck](https://deckcheck.co/), [support](https://deckcheck.co/support), [January 2025 thread](https://www.reddit.com/r/EDH/comments/1i01xfu/anyone_else_used_deckcheckco_really_enjoying_it/), [April 2025 thread](https://www.reddit.com/r/EDH/comments/1js7a1o/how_useful_are_online_power_level_calculators/).

Farseek sells Commander chat with the 99, the budget and the bracket in context, Scryfall search, CSV collection import and stock-aware recommendations. Its terms describe the limits of the AI features. (**9 November 2026:** its blog, updated 11 October 2026, says Commander legality is read from Scryfall and the deck flags cards over the singleton limit, and its FAQ says the chat runs on Claude Sonnet 5.5.) This pass did not find a separate body of independent reviews large enough to judge quality. Sources: [Farseek](https://farseek.ai/), [terms](https://farseek.ai/terms).

CommanderSalt explains bracket, power, salt and synergies for an imported list. A May 2026 thread treats the report as entertaining and detailed, and warns that it can overrate decks and assign a poor bracket. It is not a matchmaking authority. Sources: [CommanderSalt](https://www.commandersalt.com/), [May 2026 thread](https://www.reddit.com/r/EDH/comments/1toxzcy/how_reliable_is_commandersalt/).

ManaTap, MTG Master and ManaForge complete the same wave, all checked on 8 November 2026. ManaTap sells collection-aware chat, an iterative workshop and a deck checker scoring legality, curve, ramp, draw, removal, threats and synergy, with a free tier and a paid tier around $12.99 a month. (**9 November 2026:** the pricing page showed Pro at £3.99 a month or £29.99 a year; see [section 10](#corrections-to-earlier-entries).) MTG Master generates bracket-aware and collection-aware 100-card lists and states that it enforces a legal commander, color identity and singleton. (**9 November 2026:** no MTG Master product page could be found, so this is not re-verified.) ManaForge generates from a paper or Arena collection, suggests commander swaps, re-validates saved decks against live ban lists and reads Arena wildcard counts; its entry paid tier is around EUR 9.99 a month. None of the three publishes a playtest-evidence loop or printing-level acquisition planning.

EDHREC ships no AI product. “EDHREChat” circulates as a reference but was an April Fools page published on 1 April 2023 and taken offline on 4 April 2023. Treat EDHREC as a statistical source, not a generative competitor.

17lands remains the reference for data-driven Limited, not for Commander. Commander Spellbook remains the combo reference and is open source. Generic chat assistants can discuss Magic and still lack a live, legality-checked card contract. Those three points from the March note still hold. The claim that no production tool offered intent-based Commander building does not.

---

## 5. Collection, Precons And Probability

MTGGoldfish SuperBrew proposes decks from owned stock and prices the missing cards. A 2024 report said SuperBrew failed for Commander. That report is not evidence the failure is still present in 2026, and current coverage should be checked before anyone promises parity. Mana For Cards Discover ranks commanders by how much of a collection they cover, and distinguishes free copies from copies already allocated. Its comparison with ManaBox is the vendor's own page. Sources: [MTGGoldfish Premium](https://www.mtggoldfish.com/premium), [2024 SuperBrew thread](https://www.reddit.com/r/magicTCG/comments/1abc3no/mtggoldfish_superbrew_does_not_work_with/), [Mana For Cards](https://www.manaforcards.com/mana-for-cards-vs-manabox.html).

EDHREC, DeckCheck and Farseek all touch precon upgrades or budget-banded advice. A MagicAIBuilder precon path needs a dated official list, a diff from that list and reversible bundles. It should stay separate from the generic copilot in I-02.

Deckstats analyzes hands and, on Premium, the first turns. Archidekt shows odds and has a playtester. A reproducible bench for MagicAIBuilder compares seeded samples across snapshots. It does not need an AI opponent or a full rules engine, and it does not replace the goldfish logs in I-07. Sources: [Deckstats FAQ](https://deckstats.net/help-articles/faq), [Archidekt guide](https://edhrec.com/guides/how-to-use-archidekt-the-mtg-deckbuilding-site).

ManaBox is the reference for voluntary offline search. The matching MagicAIBuilder slice is read-only game-night viewing, not a multi-device offline editor. Source: [ManaBox](https://manabox.app/).

Archidekt collaborators are the reference for a second person working on a list. The matching slice is a proposed patch the owner accepts or rejects, with a revocable role. Live co-editing can wait. Source: [Archidekt guide](https://edhrec.com/guides/how-to-use-archidekt-the-mtg-deckbuilding-site).

---

## 6. What Players Reported

| Product                                                                                                                                                                                                                                                          | What the cited players valued                              | Limit of the evidence                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Moxfield** ([March 2025](https://www.reddit.com/r/EDH/comments/1jlvdik/archidekt_or_moxfield_or/), [April 2025](https://www.reddit.com/r/EDH/comments/1k49c28/which_deck_builder_app_do_you_use_and_why/))                                                     | Clarity, sharing, phone use, Scryfall syntax               | A few reports of slow search and mobile lag. The threads disagree with each other. This is not a benchmark                                                                             |
| **Archidekt** (same threads, plus [August 2025](https://www.reddit.com/r/EDH/comments/1mifciq/ads_make_archidekt_annoying_and_unusable/))                                                                                                                        | Visual editor, categories, playtester                      | Some players find floating ads and the mobile site disruptive. Others do not                                                                                                           |
| **EDHREC** ([follow-up](https://edhrec.com/articles/changelog-redesign-follow-up), [performance](https://edhrec.com/articles/changelog-big-performance-upgrades), [homogenization](https://edhrec.com/articles/is-optimization-ruining-commander-deck-building)) | Guidance and commander context. The redesign is ambitious  | The team documented cards that were too large, hover trouble and lag, then shipped corrections. The homogenization article is a debate, not proof that every recommendation is generic |
| **ManaBox** (the two 2025 threads and the [App Store listing](https://apps.apple.com/us/app/manabox-mtg/id1460407674))                                                                                                                                           | Phone access, collection, Cardmarket prices                | Individual reviews mention missed scans, hard-to-identify editions and a disputed bracket                                                                                              |
| **Deckstats** ([2018 thread](https://www.reddit.com/r/EDH/comments/9r0ujz/should_i_be_using_tappedout_instead_of_deckstats/))                                                                                                                                    | Detailed price and mana tables, collection matching        | The testimony is old. It says nothing about satisfaction with 2026 Premium. Recent independent reports were too thin to conclude                                                       |
| **TappedOut** ([April 2025](https://www.reddit.com/r/EDH/comments/1k49c28/which_deck_builder_app_do_you_use_and_why/), [2018 thread](https://www.reddit.com/r/EDH/comments/9r0ujz/should_i_be_using_tappedout_instead_of_deckstats/))                            | Community history and lists that are already widely linked | One player describes leaving for Archidekt. That does not support a global quality verdict                                                                                             |
| **Scryfall and Tagger** ([April 2025](https://www.reddit.com/r/EDH/comments/1k49c28/which_deck_builder_app_do_you_use_and_why/), [syntax](https://scryfall.com/docs/syntax))                                                                                     | Cited as the discovery reference                           | The syntax has a learning cost. This pass did not collect a recent sample large enough to measure that friction                                                                        |
| **DeckCheck and CommanderSalt**                                                                                                                                                                                                                                  | See section 4                                              | Variable scores are a documented property of the AI products, and players already warn against treating a power report as authority                                                    |
| **Farseek and Mana For Cards**                                                                                                                                                                                                                                   | The promises match real jobs: stock, budget and context    | Independent commentary found in this pass was too thin to judge them. Mana For Cards' comparison is written by Mana For Cards                                                          |

---

## 7. Card Data, Tournaments And Distribution

Scryfall's API remains the card, image, rulings, legality and set source. Honor the published rate limit, cache aggressively, and use bulk data. Commander Spellbook remains the combo source. EDHREC's statistical feeds remain useful only with source, freshness and sample disclosure. The Goldfish import stays blocked while the Cloudflare challenge has no supported access path. MTGTop8 standings still do not yield a match win rate. Those constraints are unchanged from the engineering roadmap.

Two upstream contracts moved during 2026 and affect shipped integrations. Scryfall now serves bulk data as gzipped JSONL, with a reported cutover on 20 July 2026, refreshed twice a day and carrying prices; its per-endpoint limits are tighter than the sustained ceiling, with card search reported at 2 requests a second. Confirm both figures against Scryfall's own documentation before changing any limiter: the site blocks automated fetching, so this needs a human read. Commander Spellbook v0.84.0, released on 20 October 2026, added per-deck and per-card combo endpoints worth re-checking our integration against.

Tournament and marketplace tools (MTGTop8, MTGDecks, Melee.gg, Start.gg, TCGPlayer, Card Kingdom, Cardmarket) remain context and price sources. This pass did not re-audit their features. Regional price providers stay in I-06 and are chosen explicitly.

YouTube, podcasts, Discord and Reddit remain distribution channels. The March 2026 subscriber, listener, member and viewer counts are withdrawn because they were approximate and were not checked again. r/EDH is still the most relevant public place to read how players choose a builder. Tolarian Community College and similar reviewers can move adoption. None of that is a measured acquisition forecast.

---

## 8. Online Play: Adjacent, Out Of Scope

Online play stays a non-goal. These products are recorded so the boundary is explicit, and so a French audience overlap is not mistaken for a competing deckbuilder. Read on 8 November 2026 without signing in.

**MainTable** ([maintable.app](https://maintable.app)) is a free, ad-free browser table for Magic, launched in French with an English interface, and promoted through sponsored French Instagram and Threads posts. Its core is online play: Commander tables for three to eight players, duels, matchmaking, spectators, judges, voice through Discord and the Treachery variant. Players apply the rules themselves; an optional automated mode built on the Forge engine is labeled alpha ([rules guide](https://www.maintable.app/fr/mtg/pages/guide/rules/), [features](https://maintable.app/fr/mtg/pages/guide/features/)).

- **Overlap with MagicAIBuilder:** a deckbuilder with legality checks, a declared bracket plus an estimate from mass land denial, extra turns and tutors, a Game Changer search filter, curve and indicative EUR budget, co-occurrence card recommendations, solo testing, collection import, public decks, and — since Beta 2.20.0 on 2 November 2026 — owner-approved suggestions on public decks, the same job as I-20 ([versions](https://www.maintable.app/fr/pages/versions/)).
- **No overlap:** no AI, no explanation of card choices, no Rule 0 sheet, no bracket-based matchmaking, no cross-deck purchase planning.
- **Publisher and size:** WIZCARD EI, a French sole proprietorship that also runs a card shop, with a sister collection site, TCGEM ([terms](https://maintable.app/fr/pages/legal/terms/), [TCGEM](https://www.tcgem.app/)). Alpha 1.0.0 shipped on 8 October 2026 and Beta 2.0.0 on 1 November. On 8 November it showed 45 ranked players, a 17-member Discord and three public decks. No revenue model is stated.
- **Interoperability:** it imports pasted Moxfield, Archidekt, Cockatrice, MTGTop8, Magic-Ville and plain-text lists, and exports to the same formats. It has no public API. Our existing Moxfield and text exports should paste into it; that was not verified, because it needs an account.
- **Legal posture:** it presents itself as fan content under the [Wizards Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy) and uses Scryfall images. Wizards has acted against rules-implementing clients before, so its longevity is uncertain.

**Playgroup Live** lets a host set a bracket on a lobby and reported 26,212 games in October 2026 ([page](https://playgroup.gg/commander-en-ligne), updated 7 September 2026). **TableCommander** is a free virtual tabletop launched in January 2026 ([about](https://tablecommander.com/about)). **SpellTable**, owned by Wizards, remains the webcam reference; it was not re-verified in this pass.

**What follows for the roadmap:** nothing new to build. I-20 gains a second shipped reference next to Archidekt. A dedicated MainTable export is not worth adding while it has no API and few users; check once, with an account, that a pasted Moxfield export imports cleanly. A partnership through `/api/v1` is worth revisiting only if it grows.

---

## 9. Implications For The Roadmap

The November 2026 additions are I-14 through I-21 and I-28 in [`roadmap.md`](./roadmap.md), and on 9 November I-30 through I-37, from the pass in [section 10](#10-additions-from-the-9-november-2026-pass):

| Initiative                              | Job                                                                                                                            | Priority                                | Why it is separate                                                                                                                                                                                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-14 Verifiable natural-language search | English or French description to a visible, editable Scryfall query                                                            | Next                                    | DeckCheck Smart Search and Farseek. This is search, not another deck generator                                                                                                                                                                          |
| I-15 Rule 0 sheets and pod profiles     | Shared intentions, combos, extra turns, resource denial, proxies and house rules                                               | Next                                    | CommanderSalt, DeckCheck DTI and EDHREC salt describe the table. They do not guarantee a balanced game                                                                                                                                                  |
| I-16 Decks from a collection            | Rank lists and commanders by coverage, free copies and missing cost                                                            | Next                                    | SuperBrew and Mana For Cards Discover. Depends on I-06. This is not reconciliation of a deck the player already chose                                                                                                                                   |
| I-17 Precon path and tiered upgrades    | Dated official list, diff from the box, reversible budget bundles                                                              | Next                                    | EDHREC precon upgrades, DeckCheck and Farseek. This is not a copy of I-02                                                                                                                                                                               |
| I-18 Per-deck new-card radar            | On-demand legal candidates for one deck, with a sourced explanation and a diff                                                 | Later                                   | DeckCheck reports and EDHREC set pages. Notifications wait until the on-demand flow is validated                                                                                                                                                        |
| I-19 Offline game-night viewing         | A chosen deck, primer and tokens, readable with no network                                                                     | Next                                    | ManaBox offline search. Read-only. A multi-device offline editor waits                                                                                                                                                                                  |
| I-20 Collaborative review               | An invitee proposes a patch. The owner accepts or rejects it                                                                   | Later                                   | Archidekt collaborators, and MainTable's owner-approved suggestions since 2 November 2026. Live co-editing waits                                                                                                                                        |
| I-21 Probability bench                  | Seeded multi-turn hand samples compared across snapshots                                                                       | Later                                   | Deckstats and Archidekt odds. I-07 logs and manual comparisons stay as they are                                                                                                                                                                         |
| I-28 Deckbuilding guide by bracket      | Sourced guidance for each of the five brackets, and a check of the open deck against one                                       | Next                                    | Wizards publishes rules without guidance; EDHREC and the press publish guidance without evidence labels; nothing in French                                                                                                                              |
| I-30 Business model and the paid tier   | The free and paid line, prices, AI metering and quotas, billing after a legal gate                                             | Next, behind a decision gate            | Paid tiers sell AI usage, price tools and personal history; ad removal at 2 USD is a donation. The Fan Content Policy and Scryfall's terms keep card data free ([what players pay for](#what-players-pay-for), [AI unit economics](#ai-unit-economics)) |
| I-31 Deck Lab                           | Seeded keep table, commander cast odds by turn, per-turn percentiles and swap verdicts with intervals on the player's own list | Next                                    | DeckFlow and Fetch give castability free, and EDHTuner pairs swaps free; none solves the keep table for a list or shows an interval ([new competitors](#new-competitors-and-facts))                                                                     |
| I-32 Seller handoff and affiliate carts | Exact printings from the acquisition plan to a seller's cart, in a chosen market, affiliate labelled                           | Next                                    | Moxfield, Archidekt, EDHREC and mtgcommander.ai already hand off to Mana Pool; none removes copies owned across decks ([affiliate programmes](#affiliate-programmes-and-seller-hand-offs))                                                              |
| I-33 Marketplace ladder                 | A decision record: six stages, the gates between them, and stage 5, which would reverse the non-goal                           | Parked: owner decision                  | Deckbuilders partner with marketplaces; running one switches on EU duties and needs supply and staff ([the marketplace path](#the-marketplace-path))                                                                                                    |
| I-34 Commander data reports             | Dated reports and data pages with method and sample size, and one index policy for public pages                                | Next for no-index slices; Later on I-29 | What gets cited is recurring, dated and methodical; none of the large sites grew mainly through search ([how the references grew](#how-the-references-grew), [traffic](#traffic-estimates))                                                             |
| I-35 Pod game log                       | A post-game log tied to the deck version and the pod's declared brackets, with thresholded opt-in aggregates                   | Later                                   | Playgroup tracks games at scale; no tracker ties a result to a deck version. Not a table companion ([section 8](#8-online-play-adjacent-out-of-scope))                                                                                                  |
| I-36 Creator and embed toolkit          | Embeds, link previews, video in primers, view counts and a public read API                                                     | Later                                   | Creators and community gatekeepers made the references; the social layer here evaluates and does not broadcast ([how the references grew](#how-the-references-grew))                                                                                    |
| I-37 Editor depth                       | Views, sticky groups, tags, text bulk edit, history and a mobile toolbar, measured for latency                                 | Next                                    | Archidekt shipped editor changes in four 2026 updates, and Moxfield previewed a redesign in September ([Archidekt's updates](#archidekts-2026-editor-updates))                                                                                          |

Open work on the editor, production safety and collection ownership stays ahead of this expansion. Start I-14 and I-15, test demand for I-16 and I-17, and specify the I-19 cache alongside them. For I-30 through I-37: I-30's legal gate and its AI metering and quota can start now, and no billing code starts before the gate. I-37's cheap visual slices run with I-13. I-32's handoffs without affiliate codes and I-34's slices that need no deck index can start. I-31 waits for four I-21 slices, and I-33 is decision work for the owner.

---

## 10. Additions From The 9 November 2026 Pass

Pages were read on 9 November 2026 unless another date is given. Moxfield, Patreon, Reddit, MTGGoldfish, Deckstats and CardTrader refused automated reads. Facts about them come from search-engine summaries, labelled "search summary", or from the Arctic Shift archive of Reddit posts, whose scores can differ from live Reddit. Every source is listed at the end of this document under the 9 November 2026 heading.

### Traffic estimates

These are third-party modelled estimates, not site analytics. Semrush shows September 2026 data (pages updated 11–14 October 2026). Similarweb shows October 2026 data and hides most visit totals. The March 2026 audience figures withdrawn at the top of this document are not reinstated; these are new and dated.

| Site            | Semrush visits, September 2026 | Direct share | US share | Similarweb global rank, October 2026 |
| --------------- | -----------------------------: | -----------: | -------: | -----------------------------------: |
| scryfall.com    |                   22.7 million |        51.5% |    60.4% |                               #2,822 |
| moxfield.com    |                   18.2 million |        71.5% |    59.4% |                               #4,629 |
| edhrec.com      |                   15.8 million |        59.2% |    55.4% |                               #5,178 |
| archidekt.com   |                    8.3 million |        78.9% |    59.6% |                         not recorded |
| mtggoldfish.com |                    6.5 million |        55.8% |    58.8% |                              #10,094 |
| tappedout.net   |                    1.2 million |        47.0% |    71.1% |                              #58,687 |
| edhtop16.com    |                   0.25 million |        53.2% |    66.6% |                         not recorded |

- Similarweb says EDHREC had more visits than Moxfield in October 2026, and Semrush puts Moxfield ahead in September. Treat the two as tied.
- Each site's top search keyword is its own name. Generic queries are small: "mtg deck builder" and "mtg decks" are each worth about 18,100 US searches a month, ranked first by Archidekt and TappedOut respectively.
- Visits referred by AI assistants were under 0.05% of traffic for every site measured. EDHREC got about 7,000 visits from ChatGPT in the period.

### How the references grew

- **EDHREC** was founded in 2015 as a Reddit bot. Its decks come from Archidekt and Moxfield, and its combos from Commander Spellbook. It reached 10 million unique decks from the past two years in September 2026. It partnered with Archidekt in 2019, and by 2022 both sat under Space Cow Media, which also lists Commander Spellbook and Cardsphere. Creators such as The Command Zone, Tolarian Community College and The Mana Source amplified it early.
- **Moxfield** went live in July 2019. In November 2022 it described itself as two employees with other full-time jobs, funded by advertising and Patreon. In 2020 the cEDH Decklist Database announced it would stop accepting TappedOut links, and the PlayEDH Discord asked for Moxfield, Archidekt or Scryfall lists; players cited TappedOut's slowness, crashes and ads.
- **Scryfall** launched in October 2016 and became infrastructure through a free API whose terms forbid paywalling its data. It has an estimated 47 million backlinks from 12,700 domains.
- **What gets cited:** recurring, dated releases with a stated method and denominators. Examples are EDHREC's salt vote (2.2 million votes in 2026) and year-end statistics report, EDHTop16's conversion rate, and 17lands' open game-level datasets for Limited.
- **Search policy:** Google's spam policy names scaled pages made with generative AI, scraping or automated translation "where little value is provided" as abuse. Programmatic pages built on original computed data, as EDHREC's are, sit on the allowed side.

### New competitors and facts

| Product                                                                                                                                                            | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Relevance                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **DeckFlow** ([mana base analyzer](https://www.deckflow.gg/manabase))                                                                                              | Free, Ko-fi supported. Land target from Frank Karsten's source-count math, extended. Monte Carlo castability on the player's list with the London mulligan and the free first mulligan, MDFC land faces and fetchlands, and a joint check of mana and coloured pips. Per-card share of games castable on curve and a four-tier verdict. Iteration count and seed not stated                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Per-list castability with the free mulligan is already free (I-21, I-31)                                                             |
| **EDHTuner** ([methodology](https://edhtuner.com/methodology))                                                                                                     | Free, no account, no ads, runs in the browser. Paired solo games on the same shuffle seeds with and without a swap; a swap must clear "both a statistical bar and a practical one"; the same deck always gives the same result; a shareable link replays the analysis. Its land study of 10,794 Moxfield decks over 1,500 games each finds missing a land drop by turn 4 falls from 39% (31 lands or fewer) to 16% (40 or more)                                                                                                                                                                                                                                                                                                                                                                                                                                | Corrects I-21's claim that no tool publishes a seed or compares variants                                                             |
| **Fetch** ([analyser](https://www.fetch-mtg.com/analyse))                                                                                                          | Free, no account. Per-spell cast rate by hypergeometric probability "calibrated on real decks", compared with decks of the same bracket. The list stays in the browser; an account tracks a deck over time                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Bracket comparison without a published sample size                                                                                   |
| **Playgroup.gg** ([about](https://playgroup.gg/about), [research](https://playgroup.gg/research))                                                                  | Free Commander game tracker on Android, iOS and web, plus the Playgroup Live tabletop. "770,000+" recorded games (page updated 9 November 2026). Publishes per-commander pages with seat and mulligan splits, a tier list (at least 40 games and 10 pilots), monthly metagame reports, a deck template comparing counts with the middle half of 201,607 decks of the same colour identity, a bracket calculator, and "How Sparring Works": phantom opponents for solo playtesting built from tracked games. Across 598,437 games, the first seat in four-player pods wins 29.1% against a fair 25% and the last seat 21.5%; a pre-registered experiment (9 September 2026) tests a fix. Supporter tiers listed as 4, 5 and 15 a month, currency not shown (search summary). Its privacy policy (3 November 2026) does not address guests named in logged games | The only casual tracker publishing results at scale (I-35); phantom opponents overlap I-07; the deck template overlaps I-31 and I-34 |
| **mtgcommander.ai** ([site](https://mtgcommander.ai/))                                                                                                             | Free conversational Commander builder funded by Patreon. Card data from Scryfall, synergy from EDHREC statistics, combos from Commander Spellbook; how legality is enforced is not explained. One click sends the generated list to a Mana Pool cart                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | An AI builder with a buy-this-deck cart already exists (I-02, I-32)                                                                  |
| **ManaForge** ([comparison page](https://manaforge.tools/en/blog/manaforge-vs-moxfield-vs-archidekt))                                                              | "From €9.99/mo", with a free tier needing no card. AI deck analysis, commander swaps, stock-aware upgrades, Arena wildcard awareness, and re-validation of saved decks after each ban update. The page carries conflicting update dates (August–September 2026) and says its data is current as of June 2026                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Ban-change alerts on saved decks (I-03)                                                                                              |
| **mtg-mcp-server** ([listing](https://glama.ai/mcp/servers/Cladios34/mtg-mcp-server/tools/simulate_opening_hands))                                                 | Open-source MCP server, first observed at v3.0.0 on 29 July 2026. `simulate_opening_hands` takes the free mulligan, a keep rule, the commander's colours, 100 to 100,000 iterations and a `seed`. Power users also attach card data to general assistants through MCP servers and skills                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | A seeded simulation exists (I-21)                                                                                                    |
| **BlueprintMTG.io** (r/EDH launch posts, [July](https://www.reddit.com/r/EDH/comments/1uqynon/) and [August 2026](https://www.reddit.com/r/EDH/comments/1vzwh0m/)) | Solo-built Commander builder. Feedback links whose suggestions the owner accepts or rejects, radial tagging, scripted non-LLM "Resistance Mode" bots that cast interaction during playtests, theft-target dummy decks, "New Card Trial", "Multi-Card" A/B logging, the full Scryfall Tagger hierarchy, per-change history with individual revert and a "Compare Cuts" ranking. The posts reached 742 and 585 points. "Over 800 users" after the first post is the developer's own claim. Commenters asked about AI use (39 and 38 points) and listed its styling as tells of an LLM-made site                                                                                                                                                                                                                                                                  | Strongest demand evidence for I-20 and for scripted interaction in I-07                                                              |

Moxfield previewed a deck-editor redesign on 28 September 2026, available to Patreon members first ([r/Moxfield](https://www.reddit.com/r/Moxfield/comments/1wsnch7/)). Its contents could not be verified, because moxfield.com refuses automated reads.

### Corrections to earlier entries

- **ManaTap price.** Section 4 recorded "a paid tier around $12.99 a month" on 8 November. On 9 November the [pricing page](https://www.manatap.ai/pricing), served in GBP, showed Pro at £3.99 a month or £29.99 a year. Free allows 10 AI chat messages, 3 deck checks and 5 constructed builds a day, against 500, 200 and 30 on Pro. Whether the earlier figure was a regional price, an older price or another tier is unresolved.
- **Farseek.** The I-02 spec said Farseek states no deterministic legality validation. Its [blog](https://farseek.ai/blog/chatgpt-fails-commander-deckbuilding), updated 11 October 2026, says Commander legality is read from Scryfall and the deck flags cards over the singleton limit. Its FAQ says the chat runs on Claude Sonnet 5.5, the only AI vendor found that names its model. Paid plans start at $9.99 a month, or $7.99 billed quarterly, and AI chat has a free weekly allowance of unstated size.
- **MTG Master.** No product page could be found. The only match was a Product Hunt profile describing deckbuilding tools with no mention of AI. The claims in section 4 and the I-02 spec are not re-verified.
- **EDHTop16 and tournament win rates.** The 2027 sweep in the roadmap said EDHTop16 publishes no win rates, no match-level results and no public API. Its `llms.txt` (last updated 3 January 2025) defines a win rate as wins divided by wins, losses and draws, and its commander pages show each entry's record. Its GraphQL endpoint answered on 9 November 2026 with "Only persisted queries are allowed in production", so there is still no usable public API. Match-level data with seat order and the winner of each table sits upstream at TopDeck.gg. TopDeck.gg's Developer Terms, effective 27 October 2026, forbid selling, licensing or otherwise commercializing API data (§7), and allow displaying public event data with a visible credit and link (§8.3, §6.1). The block on tournament win rates is a licence block, not a data block.
- **Archidekt's interaction simulator,** described as announced in section 1, shipped in the playtester around September 2026. A hypothetical opponent may roll attacks, removal, counterspells and similar events after a chosen turn, with customisable frequencies, archetype presets and a log. The tool never acts by itself, and no paid gate is stated. It is a scripted random-event roller, not an AI opponent.

### What players pay for

| Product                         | Paid tier, as shown on 9 November 2026                                                                         | What the tier sells                                                                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Untapped.gg** (MTG Arena)     | 7.99 USD per month                                                                                             | Personal statistics and matchups, deck-version tracking, history up to two years instead of two sets, data export, no ads, early access |
| **DeckCheck**                   | 48, 96 or 192 USD per year (150, 300 or 600 credits a month); 5 free credits a day; 100 credits for 5 USD once | AI credits ("Best" 5 credits, "Eco" 1), card scans, Deckhand reports that watch the player's decks for new-set cards                    |
| **Farseek**                     | From 9.99 USD per month, 7.99 billed quarterly; top-ups from 1.99 USD                                          | AI chat beyond a free weekly allowance. Storage, search, the commander finder and the bracket calculator stay free                      |
| **ManaTap**                     | £3.99 per month or £29.99 per year                                                                             | Higher AI quotas, the best model all day, collection-aware AI and price insights, early access                                          |
| **TopDecked**                   | Spark 2.99, Powered 4.99, Elite 8.49 USD per month                                                             | Capacity (3 lists to unlimited, 375 to 6,000 tracked cards) and price trends                                                            |
| **Deckbox**                     | 3.99 USD per month billed yearly, or 5.99 monthly                                                              | Unlimited scanner additions and tags, building from inventory, collection history. "Your collection stays free"                         |
| **ManaBox**                     | PRO 2.49 USD per month or 22.99 per year, sold only through the app stores                                     | Pro features, including new binders beyond the free allowance                                                                           |
| **Archidekt, EDHREC, Draftsim** | Patreon from 2 USD per month                                                                                   | Ad removal and small perks                                                                                                              |

- Paid tiers that look like products gate volume or personal data, not reference data. Ad removal at about 2 USD a month is a donation, not a product. AI products sell credits or daily caps plus one-off packs, and none offers flat unlimited AI. The band for a full paid tier is about 3–8 USD a month, or 30–50 USD a year.
- Of ManaBox's 250 most recent US App Store reviews (November 2024 to November 2026), 82 gave three stars or fewer: 57 of those mention scanning and 9 the paywall or subscription. Reviewers resent caps on how many decks or binders they may keep.
- No subscriber counts, Patreon member counts or conversion rates could be read for any MTG tool.
- **Constraint.** The Wizards Fan Content Policy, last updated 15 November 2017, says "Free means FREE": fan content cannot require payments, subscriptions or email registration, and may be funded by ads, sponsorships and donations. It does not mention apps, premium features or affiliate links. Scryfall's API terms say "You may not 'paywall' access to Scryfall data" and require that card data stay reachable anonymously or with a free account. ManaBox and TopDecked state they are not affiliated with Wizards and do not invoke the policy. No public Wizards ruling on paid deckbuilding tools was found.
- **Billing in the EU.** Paddle and Lemon Squeezy act as merchant of record for 5% + 50¢ per transaction and handle VAT. Stripe Tax costs 0.5% per transaction but leaves the seller to register and file under the EU One-Stop Shop.

### Affiliate programmes and seller hand-offs

- **Mana Pool** pays 5% of a referred first sale, with a 7-day first-click window, tracking through TapFiliate, payment 45 days after month end and a 20 USD minimum. Applicants need "some significant presence in the online MTG community". A decklist becomes a cart through `/add-deck`, with exact or any printing and a cart optimiser. Its seller fee is 5%, capped at 50 USD per item, plus 2.9% + 30¢ processing.
- **Moxfield and Mana Pool:** since 30 May 2025, Moxfield decks and cards have a button that opens Mana Pool's mass entry with any or exact printings and a cart optimiser. The announcement does not say whether Moxfield is paid. Moxfield's disclosure page lists Card Kingdom and TCGplayer affiliate programmes (search summary).
- **Mana Pool's other integrations** are Archidekt, EDHREC, Cube Cobra and mtgcommander.ai.
- **TCGplayer** runs its affiliate programme through Impact: credit goes to the first referrer for purchases within 48 hours, and the current page states no rate. Older versioned docs said 3.5% with last-click attribution, which conflicts. TCGplayer grants no new API access, and its API terms bar redistributing its prices.
- **Card Kingdom** has paid EDHREC a share of referred purchases since 5 May 2017, which then funded a part-time developer's hours. Its rate is not published.
- **Cardmarket** accepts no new API applications. Its affiliate programme reportedly pays a share of Cardmarket's own commission (search summary; the help page returned 404). Since 10 February 2026 EDHREC offers Cardmarket as a price source for EU users. Cardmarket had more than 80 staff in February 2026.
- **Archidekt** sends a deck or a category to vendor carts and to Card Kingdom's buylist (January 2026), and has a Mana Pool buy button.

### Archidekt's 2026 editor updates

Archidekt's news posts show relative dates; the dates below are each post's "edited" timestamp.

- **20 November 2025:** free custom cards, and up to 150 pinned cards available site-wide with notes, filters, drag into a deck and "create deck from pins".
- **21 January 2026:** collapsible categories and sticky category headings, deck-tag suggestions for untagged Commander decks, total mana value, auto-resizing playtester cards, and buy or sell to vendor carts per category.
- **6 March 2026:** a static card panel pinned beside the deck with printing, category and colour-tag controls; per-element card toggles and a text-only card render; "already in deck" markers in search results; and EDHREC's recommended cuts in the editor.
- **15 May 2026:** a mobile overhaul with a bottom toolbar (Search, Quick add, Layout, Undo, More).
- **27 July 2026:** Scryfall Oracle tags applied as categories, deck help requests with a seven-day window, a browse page and notifications, and a deck price overlay with per-vendor totals, cheapest edition, owned and basic exclusions, category breakdown, price bands and printing optimisation.
- **About September 2026:** the playtester interaction simulator described above.

### What players say, 2025–2026

Scores are r/EDH title-search results from the Arctic Shift archive, posts since 1 January 2025, queried on 9 November 2026.

- **Bracket estimators are mocked when they misjudge decks.** "Nuh Uh! Manabox Says It's A 3!" reached 797 points (March 2025). "Am I crazy or is EDHREC's combo section a bit of a joke?" reached 407 (August 2026), and a thread on "two-card" combos that need a third card reached 262 (November 2025).
- **Discovery by function.** "Scryfall cheat sheet or: How I Learned to Stop Using EDHRec" reached 909 points (April 2025) and "PSA: Check the scryfall tagger" 425 (June 2025).
- **Recommendations that fit the commander.** "Remember…take edhrec suggestions with a Grain of salt" reached 368 (March 2026), with replies naming Arcane Signet under colourless commanders and Roaming Throne in Go-Shintai decks.
- **Feedback without copy-paste.** BlueprintMTG's two launch posts reached 742 and 585.
- **AI.** "Do not use AI to make deck suggestions or clarify rules. It's wrong most of the time." reached 729 (31 December 2025). All fourteen posts with "ChatGPT" in the title sit at zero, and a builder advertised as "doesn't use AI" appeared in October 2026.
- **EDHREC's redesign.** Under "New EDHREC Design…" (395 points, October 2026) the top replies were "I think its trash and is worse for building decks" (394) and "vibe coded crap" (233). Under the r/magicTCG announcement, an AI-disclosure question was the top reply (311).
- **Switching.** Most players stay with the first tool they used unless ads, slowdowns or a disliked redesign push them. Moxfield's mobile ads "blocking vital buttons" drew a staff reply in August 2026.

### AI unit economics

Anthropic's pricing page, read 9 November 2026, lists per million tokens: Claude Haiku 4.5 at 1 USD input and 5 USD output, which is the model MagicAIBuilder calls today; Claude Haiku 5.5 at 0.10 and 0.50 USD for prompts up to 100,000 tokens; and Claude Sonnet 5.5 at 2 and 10 USD. The Batch API halves both. Haiku 4.5 caches no prompt shorter than 4,096 tokens; the 5.5 generation caches from 512. Estimated from the app's prompt templates, a build costs about 0.008 USD and a suggestion about 0.012 USD on Haiku 4.5, and an active user with 20 builds and 60 suggestion calls a month about 0.88 USD. Entry prices for paid AI Commander tools run from £3.99 (ManaTap) to 9.99 USD (Farseek) or 9.99 EUR (ManaForge) a month. The roadmap's I-02 section records the calculation, its assumptions and the code facts.

### The marketplace path

- **Incumbents.** Cardmarket (Berlin, 2007) charged a 5% commission as its only revenue in 2021 and had more than 80 staff in February 2026. eBay bought TCGplayer for up to about 295 million USD in October 2022, and TCGplayer raised its commission to 10.75% on 10 February 2026 (search summary of its help pages). Mana Pool, the newest US entrant, charges 5% capped at 50 USD per item. It built supply through store inventory integrations and demand through deckbuilders and creators.
- **Obligations a marketplace switches on in the EU and France:** Digital Services Act duties, including trader traceability (Article 30) once the platform is no longer a micro or small enterprise (Article 29); disclosure of whether a seller is a professional (Consumer Rights Directive Article 6a, Code de la consommation L111-7); DAC7 seller reporting, for which Cardmarket began collecting data on 13 November 2023; the 14-day withdrawal right for purchases from professional sellers; product-safety duties since 13 December 2024; and payment regulation. The European Banking Authority says settling a buyer's debt to a seller does not by itself exclude a platform from PSD2, and BaFin treats the commercial-agent exemption as generally unavailable to platforms that contract with both sides. A platform without a payment licence therefore runs funds through a licensed provider such as Stripe Connect or Mangopay. These points come from secondary sources and a transcription of the regulation, not from EUR-Lex, which refused automated reads; a lawyer should confirm them.
- **What it implies:** deckbuilders have partnered with marketplaces rather than becoming one. Affiliate links, a regional price source and buy-this-deck carts on the seller's site need no buyer funds or seller identity. A marketplace of its own does. At a 5% take rate, each million euros of sales yields about 50,000 EUR before costs.

### What follows for the roadmap

The roadmap of 9 November 2026 applies these findings. It corrects I-02 (Farseek, MTG Master, the build validator's scope, cost and disclosure), I-09 and the 2027 sweep (EDHTop16 and the licence block), and I-21 (seeded and paired simulation exist). It adds scopes to I-03, I-05, I-07, I-14 and I-22, and it adds I-30 to I-37: the business model, a Deck Lab, seller hand-off, the marketplace ladder as a decision record, data reports, a pod game log, a creator and embed toolkit, and editor depth.

---

## Sources

Primary pages and announcements:

- EDHREC redesign, 13 October 2026: <https://edhrec.com/articles/changelog-edhrec-redesign>
- EDHREC redesign follow-up, 22 October 2026: <https://edhrec.com/articles/changelog-redesign-follow-up>
- EDHREC performance and filters, 6 November 2026: <https://edhrec.com/articles/changelog-big-performance-upgrades>
- EDHREC Lift, 1 October 2026: <https://edhrec.com/articles/changelog-replacing-synergy-with-lift-on-edhrecs-card-pages>
- EDHREC guide: <https://edhrec.com/guides/how-to-use-edhrec>
- EDHREC FAQ: <https://edhrec.com/faq>
- EDHREC home: <https://edhrec.com/>
- EDHREC Recs: <https://edhrec.com/recs>
- EDHREC on optimization: <https://edhrec.com/articles/is-optimization-ruining-commander-deck-building>
- Moxfield features: <https://github.com/moxfield/moxfield-public/wiki/Features>
- Moxfield Patreon: <https://www.patreon.com/moxfield/membership>
- Archidekt guide: <https://edhrec.com/guides/how-to-use-archidekt-the-mtg-deckbuilding-site>
- Archidekt FAQ: <https://archidekt.com/faq>
- Archidekt interaction simulator: <https://archidekt.com/news/26104256>
- ManaBox: <https://manabox.app/>
- ManaBox on the US App Store: <https://apps.apple.com/us/app/manabox-mtg/id1460407674>
- Deckstats Premium: <https://deckstats.net/premium>
- Deckstats FAQ: <https://deckstats.net/help-articles/faq>
- TappedOut level up: <https://tappedout.net/help-desk/level-up/>
- MTGGoldfish Premium: <https://www.mtggoldfish.com/premium>
- Scryfall syntax: <https://scryfall.com/docs/syntax>
- Scryfall API: <https://scryfall.com/docs/api>
- Commander Spellbook Find My Combos: <https://commanderspellbook.com/find-my-combos/>
- Commander Spellbook about: <https://commanderspellbook.com/about/>
- Commander Spellbook Patreon: <https://www.patreon.com/commanderspellbook/about>
- DeckCheck: <https://deckcheck.co/>
- DeckCheck support: <https://deckcheck.co/support>
- DeckCheck pricing: <https://deckcheck.co/get-more>
- Farseek: <https://farseek.ai/>
- Farseek terms: <https://farseek.ai/terms>
- CommanderSalt: <https://www.commandersalt.com/>
- CommanderSalt support: <https://buymeacoffee.com/commandersalt.com?l=en>
- Mana For Cards comparison: <https://www.manaforcards.com/mana-for-cards-vs-manabox.html>

Dated player threads:

- March 2025, Archidekt or Moxfield: <https://www.reddit.com/r/EDH/comments/1jlvdik/archidekt_or_moxfield_or/>
- April 2025, deck-builder apps: <https://www.reddit.com/r/EDH/comments/1k49c28/which_deck_builder_app_do_you_use_and_why/>
- August 2025, Archidekt ads: <https://www.reddit.com/r/EDH/comments/1mifciq/ads_make_archidekt_annoying_and_unusable/>
- April 2025, power-level calculators: <https://www.reddit.com/r/EDH/comments/1js7a1o/how_useful_are_online_power_level_calculators/>
- January 2025, DeckCheck: <https://www.reddit.com/r/EDH/comments/1i01xfu/anyone_else_used_deckcheckco_really_enjoying_it/>
- May 2026, CommanderSalt: <https://www.reddit.com/r/EDH/comments/1toxzcy/how_reliable_is_commandersalt/>
- 2018, Deckstats and TappedOut: <https://www.reddit.com/r/EDH/comments/9r0ujz/should_i_be_using_tappedout_instead_of_deckstats/>
- 2024, SuperBrew Commander: <https://www.reddit.com/r/magicTCG/comments/1abc3no/mtggoldfish_superbrew_does_not_work_with/>

### Added 9 November 2026

Read on 9 November 2026 unless another date is given. "Search summary" marks a page that refused automated reads and is known only from a search engine's summary.

Traffic estimates (Semrush, September 2026 data, pages updated 11–14 October 2026; Similarweb, October 2026 data):

- Semrush, scryfall.com: <https://www.semrush.com/website/scryfall.com/overview/>
- Semrush, moxfield.com: <https://www.semrush.com/website/moxfield.com/overview/>
- Semrush, edhrec.com: <https://www.semrush.com/website/edhrec.com/overview/>
- Semrush, archidekt.com: <https://www.semrush.com/website/archidekt.com/overview/>
- Semrush, mtggoldfish.com: <https://www.semrush.com/website/mtggoldfish.com/overview/>
- Semrush, tappedout.net: <https://www.semrush.com/website/tappedout.net/overview/>
- Semrush, edhtop16.com: <https://www.semrush.com/website/edhtop16.com/overview/>
- Similarweb, Moxfield against EDHREC: <https://www.similarweb.com/website/moxfield.com/vs/edhrec.com>
- Similarweb, Archidekt competitors: <https://www.similarweb.com/website/archidekt.com/competitors>

Growth history and citable data:

- EDHREC About: <https://edhrec.com/about-us>
- EDHREC, interview with Don Miner, 16 October 2025: <https://edhrec.com/articles/edhrec-founder-don-miner-to-speak-at-mv-con-2025>
- EDHREC, 10 million unique decks, 14 September 2026: <https://edhrec.com/articles/edhrec-hits-10-million-unique-decks-from-past-two-years>
- EDHREC and Archidekt partnership, 8 April 2019 (date from a search summary): <https://edhrec.com/articles/archidekt-and-edhrec-announce-partnership>
- EDHREC salt vote results, 16 October 2026: <https://edhrec.com/articles/salt-vote-results-2026>
- EDHREC, a statistical look at 2025, 26 November 2025: <https://edhrec.com/articles/a-statistical-look-at-almost-a-year-in-commander-2025>
- StarCityGames, Moxfield's social platform announcement, 14 November 2022: <https://articles.starcitygames.com/magic-the-gathering/moxfield-announces-social-media-platform-dedicated-to-magic-the-gathering/>
- TappedOut forum, "Is TappedOut dying?", 19–23 November 2020: <https://tappedout.net/mtg-forum/tappedout/is-tappedout-dying>
- Google Search spam policies: <https://developers.google.com/search/docs/essentials/spam-policies>
- Inked Gaming, Moxfield artist feature, on the July 2019 launch (search summary): <https://www.inkedgaming.com/blogs/news/inked-gaming-artist-feature-moxfield>
- mtg.wiki, Scryfall's October 2016 launch (search summary): <https://mtg.wiki/page/Scryfall>
- EDHREC, "Top 10 cEDH Decks of 2025", citing EDHTop16 conversion rates: <https://edhrec.com/articles/the-top-10-cedh-decks-of-2025>
- 17lands public datasets, tutorial of 31 December 2023: <https://joelnitta-home.pages.dev/posts/2023-12-31_17lands-intro>

New competitors and facts:

- DeckFlow mana base analyzer: <https://www.deckflow.gg/manabase>
- EDHTuner methodology: <https://edhtuner.com/methodology>
- EDHTuner FAQ: <https://edhtuner.com/faq>
- EDHTuner land study (land test dated 23 October 2026): <https://edhtuner.com/how-many-lands-commander-deck>
- Fetch analyser: <https://www.fetch-mtg.com/analyse>
- Playgroup.gg About (updated 9 November 2026): <https://playgroup.gg/about>
- Playgroup.gg Research: <https://playgroup.gg/research>
- Playgroup.gg Turn Order: <https://playgroup.gg/commander/turn-order>
- Playgroup.gg seat-parity experiment, 9 September 2026: <https://playgroup.gg/posts/100-playgroup-experiments-testing-a-fix-for-going-first>
- Playgroup.gg tier list: <https://playgroup.gg/commanders/tier-list>
- Playgroup.gg deck template: <https://playgroup.gg/commander/deck-template>
- Playgroup.gg privacy policy, updated 3 November 2026: <https://playgroup.gg/privacy>
- Playgroup.gg supporter tiers (search summary): <https://playgroup.gg/premium>
- mtgcommander.ai: <https://mtgcommander.ai/>
- mtgcommander.ai on Patreon: <https://www.patreon.com/MTGCommanderAI>
- ManaForge comparison page: <https://manaforge.tools/en/blog/manaforge-vs-moxfield-vs-archidekt>
- mtg-mcp-server on Glama: <https://glama.ai/mcp/servers/Cladios34/mtg-mcp-server/tools/simulate_opening_hands>
- BlueprintMTG launch post, July 2026: <https://www.reddit.com/r/EDH/comments/1uqynon/>
- BlueprintMTG launch post, August 2026: <https://www.reddit.com/r/EDH/comments/1vzwh0m/>
- Moxfield editor preview, 28 September 2026: <https://www.reddit.com/r/Moxfield/comments/1wsnch7/>

Corrections:

- ManaTap pricing: <https://www.manatap.ai/pricing>
- Farseek blog, published 2 April 2026, updated 11 October 2026: <https://farseek.ai/blog/chatgpt-fails-commander-deckbuilding>
- MTG Master search result, Product Hunt: <https://www.producthunt.com/@edlimir>
- EDHTop16 `llms.txt`, last updated 3 January 2025: <https://edhtop16.com/llms.txt>
- EDHTop16 GraphQL endpoint, queried 9 November 2026: <https://edhtop16.com/api/graphql>
- TopDeck.gg Developer Terms, effective 27 October 2026: <https://topdeck.gg/developer-terms>
- TopDeck.gg tournaments API v2: <https://topdeck.gg/docs/tournaments-v2>
- Archidekt interaction simulator, about September 2026: <https://archidekt.com/news/26104256>

Monetization and constraints:

- Untapped.gg Premium: <https://mtga.untapped.gg/premium>
- TopDecked on the US App Store: <https://apps.apple.com/us/app/topdecked/id1173388234>
- TopDecked Powered features: <https://topdecked.com/articles/powered-features>
- Deckbox Premium: <https://deckbox.org/premium>
- ManaBox subscriptions guide: <https://manabox.app/guides/general/subscriptions/>
- ManaBox US App Store review feed, 250 most recent reviews (13 November 2024 to 6 November 2026): <https://itunes.apple.com/us/rss/customerreviews/page=1/id=1460407674/sortby=mostrecent/json>
- Draftsim Premium, 19 February 2026: <https://draftsim.com/?p=269684>
- EDHREC terms, effective 6 August 2024: <https://edhrec.com/terms>
- Wizards Fan Content Policy, last updated 15 November 2017: <https://company.wizards.com/en/legal/fancontentpolicy>
- Paddle pricing: <https://www.paddle.com/pricing>
- Lemon Squeezy pricing: <https://www.lemonsqueezy.com/pricing>
- Stripe Tax pricing: <https://stripe.com/tax/pricing>

Affiliate programmes and seller hand-offs:

- Mana Pool affiliates: <https://manapool.com/affiliates>
- Mana Pool seller fees and timeline: <https://manapool.com/seller-info>
- Mana Pool mass entry and integrations: <https://manapool.com/mass-entry-info>
- Mana Pool, Moxfield integration, 30 May 2025: <https://manapool.com/library/platform/2025/05/30/moxfield-manapool-integration.html>
- Moxfield affiliate disclosures (search summary): <https://sorcery.moxfield.com/help/disclosures>
- TCGplayer affiliate programme: <https://docs.tcgplayer.com/docs/tcgplayer-affiliate-program>
- TCGplayer affiliate programme, docs v1.38.0: <https://docs.tcgplayer.com/v1.38.0/docs/tcgplayer-affiliate-program>
- TCGplayer developer docs: <https://docs.tcgplayer.com/docs>
- TCGplayer fees (search summary): <https://help.tcgplayer.com/hc/en-us/articles/201357836-Fees>
- EDHREC and Card Kingdom, 5 May 2017: <https://edhrec.com/articles/announcing-edhrec-and-card-kingdom-partnership>
- Cardmarket API help: <https://help.cardmarket.com/en/cardmarket-api>
- Cardmarket affiliate programme (returned 404; search summary): <https://help.cardmarket.com/en/AffiliateProgram>
- EDHREC and Cardmarket, 10 February 2026: <https://edhrec.com/articles/introducing-the-cardmarket-x-edhrec-partnership-for-eu-users/>
- Archidekt FAQ: <https://archidekt.com/faq>

Archidekt editor updates (each post's edited date):

- 20 November 2025: <https://archidekt.com/news/17621845>
- 21 January 2026: <https://archidekt.com/news/19248512>
- 6 March 2026: <https://archidekt.com/news/20605672>
- 15 May 2026: <https://archidekt.com/news/22633051>
- 27 July 2026: <https://archidekt.com/news/24799503>

Player threads (Arctic Shift archive scores, queried 9 November 2026):

- March 2025, "Nuh Uh! Manabox Says It's A 3!": <https://www.reddit.com/r/EDH/comments/1j3r30v/>
- August 2026, EDHREC's combo section: <https://www.reddit.com/r/EDH/comments/1vrt8ww/>
- November 2025, two-card infinites that need a third card: <https://www.reddit.com/r/EDH/comments/1oxuhqy/>
- April 2025, Scryfall cheat sheet: <https://www.reddit.com/r/EDH/comments/1k0ih2q/>
- June 2025, Scryfall Tagger PSA: <https://www.reddit.com/r/EDH/comments/1lc7cu9/>
- October 2026, Scryfall tags to find similar cards: <https://www.reddit.com/r/EDH/comments/1wxxui2/>
- January 2026, OffMeta: <https://www.reddit.com/r/EDH/comments/1q8czkc/>
- March 2026, EDHREC suggestions with a grain of salt: <https://www.reddit.com/r/EDH/comments/1rl9bfa/>
- 31 December 2025, "Do not use AI": <https://www.reddit.com/r/EDH/comments/1q0epg2/>
- October 2026, a builder that "doesn't use AI": <https://www.reddit.com/r/EDH/comments/1x7wicf/>
- October 2026, "New EDHREC Design": <https://www.reddit.com/r/EDH/comments/1x7v653/>
- October 2026, EDHREC redesign on r/magicTCG: <https://www.reddit.com/r/magicTCG/comments/1x56apg/>
- August 2026, Moxfield mobile ads: <https://www.reddit.com/r/EDH/comments/1vhlzqj/>
- October 2026, which site players use: <https://www.reddit.com/r/EDH/comments/1wv8mf7/>

AI unit economics and the marketplace path:

- Anthropic pricing: <https://platform.claude.com/docs/en/about-claude/pricing>
- Anthropic prompt caching: <https://platform.claude.com/docs/en/build-with-claude/prompt-caching>
- OMR on Cardmarket, 16 March 2021: <https://omr.com/en/daily/cardmarket-trading-card-platform>
- eBay Form 10-Q on the TCGplayer acquisition: <https://www.sec.gov/Archives/edgar/data/1065088/000106508822000030/ebay-20220930.htm>
- Digital Services Act, Articles 29 and 30 (transcription; EUR-Lex refused automated reads): <https://www.eu-digital-services-act.com/Digital_Services_Act_Article_30.html>
- Cardmarket DAC7 information, 1 November 2023: <https://news.cardmarket.com/en/Magic/DAC7-information>
- Herbert Smith Freehills Kramer on the Omnibus Directive and marketplaces: <https://www.hsfkramer.com/notes/tmt/2020-07/omnibus-directive-a-new-deal-for-eu-consumers-part-3>
- INC on platform information duties in France since 1 January 2018: <https://www.inc-conso.fr/node/10164>
- Service-Public, the 14-day withdrawal right (verified 1 January 2026): <https://www.service-public.gouv.fr/particuliers/vosdroits/F10485>
- EBA Single Rulebook Q&A 2020_5354: <https://www.eba.europa.eu/single-rule-book-qa/qna/view/publicId/2020_5354>
- Paytechlaw on the commercial-agent exemption: <https://paytechlaw.com/en/commercial-agent-exemption-zag/>
- Osborne Clarke on GPSR duties for online marketplaces: <https://www.osborneclarke.com/insights/navigating-eus-new-gpsr-obligations-are-introduced-online-marketplaces>
