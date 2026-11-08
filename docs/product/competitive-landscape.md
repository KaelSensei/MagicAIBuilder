# MTG Competitive Landscape

> **Last updated:** 8 November 2026
> **Purpose:** Product strategy reference for MagicAIBuilder
> **Method:** Public product pages, help pages and vendor changelogs reviewed on 8 November 2026 (Europe/Paris), plus the `dev` roadmap and README. This was not a signed-in test of every product. Vendor claims are not independent measurements. Reddit threads cited below are dated testimony, not a survey. **Not established** means not verified on the surfaces reviewed, not proven absent.

The March 2026 edition of this document treated EDHREC's interface as dated, treated conversational Commander building as an empty market, and quoted approximate traffic, subscriber and premium prices. Those audience figures were not revalidated and are withdrawn. Prices below are the figures found on the cited page, in that page's currency, with no conversion.

---

## Executive Summary

1. **EDHREC modernized in October and November 2026.** The redesign added card context, configurable views, Lift, bracket and budget filters, and a round of performance fixes. It remains the benchmark for aggregate Commander data. It is not a personal deck editor with storage, versioning and playtesting comparable to Moxfield. The playtest action delegates to Archidekt.

2. **Conversational Commander assistance is already for sale.** DeckCheck and Farseek both ship chat, search and deck-aware advice. An LLM is not an uncontested gap. The useful difference is a loop the player can check: intention, a legal list, traceable explanations, reproducible tests and an informed purchase.

3. **Moxfield, Archidekt and ManaBox still own their specialties.** Moxfield is the benchmark for fast editing, sharing and presentation. Archidekt is the benchmark for a visual editor, packages and collaboration. ManaBox is the benchmark for mobile collection management and offline search.

4. **Players already split the job across tools.** Building in one product and presenting the list in another is a normal workflow. Reliable import and export matter more than assuming the community will move in full.

5. **Scryfall stays shared infrastructure.** Use it for card data and search. Do not rebuild the card database, and do not paywall Scryfall's own data.

---

## 1. Functional Comparison

| Product                                                                                                                                                         | Build                                              | Advice and analysis                                           | Test                                                     | Collection                                      | Mobile and distinctive strength                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| **MagicAIBuilder**                                                                                                                                              | Zones, tags, packages, snapshots, imports          | Constrained copilot, six-axis bracket, combos, EDHREC rows    | Goldfish, logs and snapshot evidence                     | Owned and missing cards, multi-deck acquisition | Responsive web. Lumen foundations shipped; the visual redesign is still open |
| **Moxfield** ([features](https://github.com/moxfield/moxfield-public/wiki/Features))                                                                            | Scryfall syntax, categories, history, primers      | EDHREC, curve, mana sources, legality                         | Sandbox, tokens and counters                             | Yes                                             | Web. Sharing and presentation                                                |
| **Archidekt** ([guide](https://edhrec.com/guides/how-to-use-archidekt-the-mtg-deckbuilding-site), [interaction simulator](https://archidekt.com/news/26104256)) | Visual editor, packages, comparison, collaboration | EDHREC, complete and partial combos, land base                | Playtester. An interaction simulator is announced        | Editions and physical condition                 | Web. Custom organization                                                     |
| **EDHREC** ([redesign](https://edhrec.com/articles/changelog-edhrec-redesign), [Recs](https://edhrec.com/recs))                                                 | Clipboard, import into Recs, export to editors     | Inclusion, Lift, filters, precons, combos, salt               | Button to Archidekt. No standalone simulator established | Personal collection management not established  | Modernized web. Statistical discovery                                        |
| **ManaBox** ([product](https://manabox.app/), [App Store](https://apps.apple.com/us/app/manabox-mtg/id1460407674))                                              | Decks, folders, statistics                         | EDHREC recommendations, rules, prices                         | Native simulator                                         | Scanner, binders, versions, trades              | iOS and Android. Offline search                                              |
| **Deckstats** ([FAQ](https://deckstats.net/help-articles/faq), [Premium](https://deckstats.net/premium))                                                        | Decks, automatic tags on Premium                   | What to add or cut, near-combos, hand analysis                | Playtest. Premium first-turn analysis                    | Yes                                             | Web. Detailed tables                                                         |
| **TappedOut** ([level up](https://tappedout.net/help-desk/level-up/))                                                                                           | Decks, primers, history by account level           | Community feedback and deck analysis                          | Playtest                                                 | Inventory and wishlist                          | Web. Long-running community                                                  |
| **MTGGoldfish** ([Premium](https://www.mtggoldfish.com/premium))                                                                                                | Decks and a metagame library                       | SuperBrew from owned stock, prices and alerts                 | Not established here                                     | Buy and sell prices, saved lists                | Web. Price history                                                           |
| **Scryfall and Tagger** ([syntax](https://scryfall.com/docs/syntax))                                                                                            | Search and data. Not a full deck workflow          | Rich syntax, functional and art tags, rulings                 | Not established here                                     | Not established here                            | Free infrastructure. Do not duplicate it                                     |
| **Commander Spellbook** ([Find My Combos](https://commanderspellbook.com/find-my-combos/), [about](https://commanderspellbook.com/about/))                      | Paste or import a list for analysis                | Combos present and potential                                  | Not a playtester in the pages reviewed                   | Not established here                            | Open, community-maintained combo data                                        |
| **DeckCheck** ([product](https://deckcheck.co/), [support](https://deckcheck.co/support))                                                                       | Editor, Deckhand chat, Smart Search                | DTI, PowerTune, ManaTune, DeckTrim, cited rules               | Sandbox                                                  | Scanner, binders, paid Smart Binders            | Web. Direct AI competitor                                                    |
| **Farseek** ([product](https://farseek.ai/), [terms](https://farseek.ai/terms))                                                                                 | 100-card lists, chat with the 99 in context        | Persistent budget and bracket, Scryfall search                | Not established here                                     | CSV import, recommendations against stock       | Web. Direct AI competitor                                                    |
| **CommanderSalt** ([product](https://www.commandersalt.com/))                                                                                                   | Analysis of an imported list                       | Bracket, power, saltiness, synergies                          | Not established here                                     | Not established here                            | Explanatory power report                                                     |
| **Mana For Cards** ([own comparison](https://www.manaforcards.com/mana-for-cards-vs-manabox.html))                                                              | Lists and sharing                                  | Discover ranks commanders by how much of the stock they cover | No playtester, by its own comparison                     | Scanner, free copies versus allocated copies    | Web. Collection-first discovery                                              |

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

Farseek sells Commander chat with the 99, the budget and the bracket in context, Scryfall search, CSV collection import and stock-aware recommendations. Its terms describe the limits of the AI features. This pass did not find a separate body of independent reviews large enough to judge quality. Sources: [Farseek](https://farseek.ai/), [terms](https://farseek.ai/terms).

CommanderSalt explains bracket, power, salt and synergies for an imported list. A May 2026 thread treats the report as entertaining and detailed, and warns that it can overrate decks and assign a poor bracket. It is not a matchmaking authority. Sources: [CommanderSalt](https://www.commandersalt.com/), [May 2026 thread](https://www.reddit.com/r/EDH/comments/1toxzcy/how_reliable_is_commandersalt/).

ManaTap, MTG Master and ManaForge complete the same wave, all checked on 8 November 2026. ManaTap sells collection-aware chat, an iterative workshop and a deck checker scoring legality, curve, ramp, draw, removal, threats and synergy, with a free tier and a paid tier around $12.99 a month. MTG Master generates bracket-aware and collection-aware 100-card lists and states that it enforces a legal commander, color identity and singleton. ManaForge generates from a paper or Arena collection, suggests commander swaps, re-validates saved decks against live ban lists and reads Arena wildcard counts; its entry paid tier is around EUR 9.99 a month. None of the three publishes a playtest-evidence loop or printing-level acquisition planning.

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

## 8. Implications For The Roadmap

The November 2026 additions are I-14 through I-21 in [`roadmap.md`](./roadmap.md):

| Initiative                              | Job                                                                              | Priority | Why it is separate                                                                                                    |
| --------------------------------------- | -------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| I-14 Verifiable natural-language search | English or French description to a visible, editable Scryfall query              | Next     | DeckCheck Smart Search and Farseek. This is search, not another deck generator                                        |
| I-15 Rule 0 sheets and pod profiles     | Shared intentions, combos, extra turns, resource denial, proxies and house rules | Next     | CommanderSalt, DeckCheck DTI and EDHREC salt describe the table. They do not guarantee a balanced game                |
| I-16 Decks from a collection            | Rank lists and commanders by coverage, free copies and missing cost              | Next     | SuperBrew and Mana For Cards Discover. Depends on I-06. This is not reconciliation of a deck the player already chose |
| I-17 Precon path and tiered upgrades    | Dated official list, diff from the box, reversible budget bundles                | Next     | EDHREC precon upgrades, DeckCheck and Farseek. This is not a copy of I-02                                             |
| I-18 Per-deck new-card radar            | On-demand legal candidates for one deck, with a sourced explanation and a diff   | Later    | DeckCheck reports and EDHREC set pages. Notifications wait until the on-demand flow is validated                      |
| I-19 Offline game-night viewing         | A chosen deck, primer and tokens, readable with no network                       | Next     | ManaBox offline search. Read-only. A multi-device offline editor waits                                                |
| I-20 Collaborative review               | An invitee proposes a patch. The owner accepts or rejects it                     | Later    | Archidekt collaborators. Live co-editing waits                                                                        |
| I-21 Probability bench                  | Seeded multi-turn hand samples compared across snapshots                         | Later    | Deckstats and Archidekt odds. I-07 logs and manual comparisons stay as they are                                       |

Open work on the editor, production safety and collection ownership stays ahead of this expansion. Start I-14 and I-15, test demand for I-16 and I-17, and specify the I-19 cache alongside them.

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
