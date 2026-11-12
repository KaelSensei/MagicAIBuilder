# I-47: Rules Answers For The Cards In This Deck

> **Initiative:** I-47, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for official rulings and rule links (slices 1 to 7); Later for the authored interaction notes (slices 8 to 11) and for offline and screen-reader inclusion (slice 12); the optional slices 13 and 14 wait on I-48, I-30 and the owner · **Written 2026-11-10**
> **Research:** one dated note on Scryfall's rulings data and terms, Wizards' rules page, rules references, deckbuilders and AI rules assistants, plus our own measurements on Scryfall's rulings file of 2026-11-09 and on two versions of the Comprehensive Rules. The note is not committed, so every external fact links its own source in [Sources](#sources). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** official rulings on each card in the builder and on the public deck page; the versioned, addressable Comprehensive Rules (CR) and every link into them; links from card keywords to their rules; authored "worth knowing in this deck" notes and their judge review; the citation contract that every rules statement in the product follows. **Does not own:** explanations of the product's own warnings ([I-27](i27-learning-while-building.md), which should reuse this citation contract for its slice 4); the screen-reader export ([I-24](i24-decks-a-screen-reader-can-play-from.md)); card search and query generation ([I-14](i14-verifiable-natural-language-search.md)); the card panel's layout ([I-37](i37-editor-depth.md) requirement 6); the offline cache ([I-19](i19-offline-game-night-viewing.md)); the copilot ([I-02](i02-checkable-ai-copilot.md)); indexing of `/rules` ([I-34](i34-commander-data-reports.md) slice 2); the report form ([I-38](i38-trust-safety-and-user-rights.md) slice 8); the Commander format's dated banned list, Game Changers and brackets, and the per-deck change report and notices ([I-48](i48-official-changes-reach-every-deck.md)), which this initiative feeds with CR and rulings changes (slice 13).

## Overview

At the table, a pod argues about how two cards in one deck interact. Today the player opens Scryfall, a search engine or a chatbot. The chatbot answers every question with confidence and is wrong some of the time, and players say so loudly [23][24][25].

MagicAIBuilder already knows which cards are in the deck. It can bring the official answers to those cards and say where its knowledge stops. The work has three layers, ordered by cost and risk:

1. **Official rulings on every card.** Wizards' rulings, as Scryfall distributes them, with their dates and source, in the builder and on the public deck page. The data exists, is free and fits in a 5 MB file. Next.
2. **Rule links.** The CR the app already serves becomes versioned and addressable rule by rule, and each keyword on a card links to its rule. Next.
3. **Interactions worth knowing in this deck.** Short notes written by a person and reviewed by a judge, shown when the deck holds the cards a note is about. Each note cites rule numbers with their CR version and rulings with their dates. Later: this is content work that needs a named reviewer, and an error would be quoted at tables.

One boundary covers all three: **no language model decides a rules answer.** Rulings and rules are shown verbatim, notes are written and reviewed by people, and an optional model step may only retrieve sources. When nothing reviewed applies, the product says so and points to a judge.

It passes three tests. A player opens any card in the builder or on a public deck and sees its official rulings with dates, labelled Wizards or Scryfall, and a link from each keyword to its rule. A link to "CR 903.9a" opens that rule in the version it was written against and says whether a newer version changed it. A deck with a commander and a "dies" payoff shows a reviewed note citing 903.9a; when a CR update changes 903.9a, the note disappears until a reviewer approves it again.

## What the market does

Read on 2026-11-10 unless dated.

| Product                 | Rulings and rules                                                                                                                                                                                                                                                                     | Limits found                                                                                                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scryfall**            | Card pages list "Notes and Rules Information", one date per ruling [7]. The API serves rulings per card and a daily bulk file holds all of them [1][2]. Each ruling is `wotc` or `scryfall`; Scryfall's notes add context or cover unofficial formats such as Duel Commander [1]      | No link from a ruling to a rule. A ruling has no language field [1]. A judges' resources page warns that Oracle text on Scryfall "is sometimes outdated or inaccurate" [13]                                                                                                |
| **Gatherer** (Wizards)  | The official Oracle reference; judges track its 2025 updates [11][12]                                                                                                                                                                                                                 | The Edge of Eternities update merged rulings across versions and kept repeated keyword rulings on one card only; it "affects ca. 7600 cards" (2025-09-05) [11]. A December 2025 bulletin found a misleading ruling and "two rulings which refer to the wrong ability" [12] |
| **Moxfield**            | "You can see the format legality as well as the rulings for all cards" (wiki, last edited 2020-10-14) [14]                                                                                                                                                                            | The current card panel could not be read; moxfield.com answered 403                                                                                                                                                                                                        |
| **Archidekt**           | A rulings tab in the deck page's card modal since a July 2023 update [15]                                                                                                                                                                                                             | Source and rule links not stated                                                                                                                                                                                                                                           |
| **EDHREC**              | No rulings on card pages; links out to Scryfall, Moxfield, Archidekt and Commander Spellbook [16]                                                                                                                                                                                     | —                                                                                                                                                                                                                                                                          |
| **Yawgatog**            | The CR as one hyperlinked page, already on the 6 November 2026 version, with an anchor per rule and about 39,000 internal links [17]                                                                                                                                                  | Not tied to cards or decks                                                                                                                                                                                                                                                 |
| **Academy Ruins**       | Old CR, MTR and IPG versions, diffs between them, and an API that traces one rule's history; AGPL-3.0 code, updated 2026-11-07 [18]                                                                                                                                                   | Not tied to cards or decks                                                                                                                                                                                                                                                 |
| **Magic Judges**        | Rules Q&A forum ("Need an official answer? Ask it here!") and chat.magicjudges.org "for a quick answer"; latest forum post 1 August 2026 [19]. RulesGuru, a judges' database of rules questions with an API [20]                                                                      | People, so not instant. RulesGuru states no licence [20]                                                                                                                                                                                                                   |
| **AI rules assistants** | MTG Judge says it is grounded in the CR and Scryfall, says it "is not always correct" and flags disputes for review [21]. MagicJudge (iOS, released 2024-12-03, under 1,000 downloads) promises "precise answers to any rules question quickly and reliably" and names no source [22] | No accuracy published by either                                                                                                                                                                                                                                            |

**Measured on Scryfall's rulings file of 2026-11-09** [6]: 79,706 rulings for 20,080 Oracle cards, 79,637 from Wizards and 69 Scryfall notes; 40 cards carry Scryfall notes only. A card with rulings has a median of 3 and at most 32; the median text is 182 characters. The file is 5.4 MB compressed and 26 MB uncompressed. Dates run from 2004-10-04 to 2026-09-01. Star Trek, released 2026-11-13 [9], had a ruling for 5 of the first 175 rares its search returned. Only 28 rulings contain a rule number, so rulings will not link themselves to the CR.

**What players say.**

- r/EDH, 2025-12-31, 729 points: "Do not use AI to make deck suggestions or clarify rules. It's wrong most of the time." The author's chatbots invented a card and called Viscera Seer a Cleric [23].
- r/mtgrules, 2026-08-01: a hobby bot grounded in the CR of 2026-06-19 and Scryfall rulings scored 118 of 126 (94%) on community questions and 28 of 29 (97%) on judge-blog rules tips, graded by another model. It "committed to a ruling" on all 157, wrong answers included; its author concluded that the bot "prefers to lie to you with a confident wrong ruling rather than defer with grace." The post scored 0; the top reply was "AI Slop has no business in this sub" [24].
- r/mtgrules, 2026-10-12: a 2023-04-14 backup ruling and CR 702.165d name different moments. Replies: rulings are "general statements designed to help players understand" (3 points); this one is "unfortunately imprecise here. And this is not the first time" (7); "Do not use AI for rules questions" (15) [25].

**The read.** Rulings per card are table stakes: Scryfall, Gatherer, Moxfield and Archidekt show them, so layer 1 reaches parity, not advantage. Hyperlinked rules exist apart from cards. None of the products read joins a card's keywords to rule numbers, versions a citation, or lists the interactions that matter for one deck. AI assistants answer everything, and the best figure found, from a grounded hobby bot graded by a model, is about one wrong answer in sixteen, with no refusal. The opening is a product that cites, versions and declines. It is also the only position this roadmap's boundary allows. Official rulings are imperfect too [12][25], so the CR governs and rulings are labelled as summaries.

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10.

**Rulings.**

- `src/lib/scryfall/rulings.ts` fetches `/cards/{id}/rulings` from the browser with a 15-second timeout and keeps the 50 most recent cards in `localStorage`. It bypasses the 100 ms queue in `src/lib/scryfall/request-queue.ts`: fine for one card, not for a hundred.
- `src/components/card/CardRulingsPanel.tsx` loads rulings on a click. It parses `source` but never shows it, and titles every ruling "Oracle rulings" ("Rulings Oracle" in French), so Scryfall's notes read as official. Dates show as raw ISO strings; the text is English in both locales.
- The panel appears only in `src/components/card/PrintingSelectorModal.tsx`, used by the builder, the collection and the Game Changers page. The public deck page (`src/components/profile/PublicDeckCards.tsx`) shows neither Oracle text nor rulings, and the allowlist `PUBLIC_DECK_CARD_SELECT` in `src/lib/deck/public-deck-select.ts` carries neither.
- `DeckCard` in `prisma/schema.prisma` stores the printing's `scryfallId` and `oracleText`, with no Oracle id and no keywords. `ScryfallCard` in `src/lib/scryfall/types.ts` has an optional `oracle_id` and `keywords`. Reversible cards carry their Oracle id on each face only [5].

**Comprehensive Rules.**

- `src/lib/rules/comprehensive.ts` parses one hard-coded file, `src/lib/rules/data/MagicCompRules-20260807.txt`, effective 7 August 2026, and caches it per process. Wizards' rules page now links the 6 November 2026 version [10], and Academy Ruins captured another version on 2026-09-22 [18]. The served rules are two versions old; Academy Ruins captured seven versions in 2026 so far.
- `src/components/rules/ComprehensiveRulesView.tsx` renders one chapter per `?chapter=`. Rule paragraphs have no `id`, so no link can reach a single rule. Search results show the rule number without a link. "No matching rules found." is hard-coded English, and the French page inserts the English date "August 7, 2026".
- Two more copies sit at the 27 February 2026 version: `docs/rules/` (TXT, PDF, DOCX) and `.agents/skills/mtg-rules/references/comprehensive-rules.txt`. The I-27 spec names `docs/rules/` as the reference, but the app serves the other file.
- Code cites rules by number. `src/lib/deck/commander-eligibility.ts` cites "CR 903.3 and 903.3a (comprehensive rules of 2026-08-07)", with its version; `src/lib/playtest/engine.ts` cites 103.5, 103.5c, 903.6 and 903.9b without one.
- `/rules` has been public since #1313 (`src/lib/auth/public-paths.ts`). `src/app/[locale]/rules/comprehensive/page.tsx` has static English metadata and no `noindex` yet; I-34 slice 2 owns that.

**No model answers rules.** `src/lib/ai/deck-question.ts` accepts two questions only, "why this card" and "weakest card". There is nothing to undo.

**Measured: how a citation breaks.** We compared the served file with the 6 November 2026 file [10], rule by rule, on exact text:

- Numbered rules went from 3,161 to 3,182. 124 numbers disappeared and 145 appeared; 109 of the vanished numbers reappear with identical text under a new number, for example 712.4a → 713.1a.
- 211 rules kept their number with different text; for 39 of them only cross-references changed.
- Chapter 715 was "Adventurer Cards" and is now "Saga Cards". "Commander games do not use sideboards" moved from 903.5e to 903.5f, and 903.5e now states a different rule.

A citation stored as a bare number points at different words after one update. Requirements 3 and 5.5 exist for this.

**Measured: keywords to rules.** Against the November rule titles, 188 of Scryfall's 223 keyword abilities and 68 of its 80 keyword actions [8] match a 702 or 701 title exactly. The rest are variants (Forestwalk under 702.14 Landwalk, Multikicker under 702.33 Kicker, Megamorph under 702.37 Morph, Commander ninjutsu under 702.49 Ninjutsu) or digital-only actions such as Seek and Conjure. Ability words have "no special rules meaning and no individual entries in the Comprehensive Rules" (CR 207.2c).

## Functional requirements

### 1. Ground rules

1.1 No language model decides, writes, rewrites or translates a rules statement that a player sees. Rulings and rule text are shown verbatim; notes are written by a person and reviewed (requirement 5).
1.2 **Citation contract.** Every rules statement shown carries at least one citation: a rule number with the effective date of its CR version, or an official ruling with its date and source. A statement without one does not render, and a test fails.
1.3 Sources are labelled: "Wizards of the Coast ruling", "Scryfall note (unofficial)", "Comprehensive Rules, effective <date>", "MagicAIBuilder note, reviewed by <name> on <date>".
1.4 Each rules panel states the hierarchy once: the Comprehensive Rules govern; rulings are official summaries; notes explain and do not rule.
1.5 When nothing reviewed applies, the product says "No reviewed answer here" and links the judges' chat and Rules Q&A forum [19]. It never fills the gap.
1.6 Everything is free and readable signed out, the public deck page included (requirement 8).
1.7 No route or component of this initiative imports the AI client, except slice 14 under requirement 6. A dependency test enforces it, as in [I-46](i46-discord-and-chat-integrations.md).

### 2. Official rulings on every card

2.1 A server job imports Scryfall's rulings bulk file into a table keyed by Oracle id, weekly and on demand after a set release, as Scryfall advises for gameplay data [2][4]. It records the file's `updated_at`, the row count, a SHA-256 and the newest ruling date. _Re-pointed 2026-11-10:_ [I-67](i67-one-card-data-pipeline.md) slice 6 loads the rulings daily into its `CardRuling` and `RulingText` tables and emits `rulings.changed`; this initiative reads them and keeps its change entries, and `DeckCard.oracleId` is [I-37](i37-editor-depth.md) slice 12's.
2.2 An import is atomic. A malformed line fails it and the previous data stays.
2.3 Every card the builder opens, and every card on the public deck page, shows its rulings: the date in the locale's format, the text verbatim, the source label (1.3), and "Rulings as of <file date>".
2.4 "No rulings published" differs from "may not be published yet". When the card's set was released after the newest ruling in the file, the panel says so with the check date.
2.5 A deck-level Rulings view lists the deck's cards that have rulings, collapsed per card, with a text filter over this deck's rulings only.
2.6 The browser stops calling Scryfall for rulings. A deck's rulings come in one server response, cached per deck version.
2.7 Official text stays English in the French interface, marked `lang="en"` and labelled "Official text, in English". No machine translation (1.1).
2.8 A re-import that adds, changes or removes a ruling for a card records the change. Requirement 5.5 and slice 13 use it.

### 3. Comprehensive Rules, versioned and addressable

3.1 A script imports a CR version from Wizards' TXT [10]. It records the effective date, source URL and SHA-256, and writes a diff report: added, removed, moved with identical text, changed. The import lands as a reviewed pull request, never automatically.
3.2 The first import is the 6 November 2026 version. Each version has one served copy. The `docs/rules/` and agent-skill copies are removed or regenerated from it, and a test fails when a committed copy differs from the served version.
3.3 Each rule has an address: `/rules/comprehensive?rule=903.9a` opens its chapter at that rule. Each paragraph carries an `id` and a copy-link control.
3.4 Cross-references in rule text ("See rule 704") and every search result become links.
3.5 The app keeps the current version and every version a reviewed note still cites. A non-current version shows "Superseded on <date>", the current text under the same number, and a link to the rule's history at Academy Ruins [18].
3.6 A weekly check compares the served version with the one Wizards links [10] and opens an issue when they differ. It never deploys rules text.
3.7 The verbatim CR stays `noindex` (I-34 slice 2). The French page localises its date and strings; the rules text stays English (2.7).

### 4. Rule links from cards

4.1 Each keyword ability or keyword action on a card links to its rule in the served version, by exact title match on 701 and 702.
4.2 A reviewed alias table maps the variants (landwalk forms, Multikicker, Megamorph, Commander ninjutsu, and others) and lists keywords with no rule, such as digital-only actions. A test fails when a keyword in Scryfall's catalogues [8] is neither matched, aliased nor listed.
4.3 Ability words get no keyword link (CR 207.2c).
4.4 A commander links to chapter 903; a card with Partner or Companion links to 702.124 or 702.139.
4.5 Each link shows its CR version date on hover and focus, and opens the version it was resolved against.

### 5. Interactions worth knowing in this deck

5.1 A note is a reviewed content file in the repository: title and body per locale, a matcher, citations, author, reviewer, review date and the CR version it was written against.
5.2 Matchers are deterministic data: lists of Oracle ids, or predicates over deck facts such as "has a commander", a type line, a keyword or an Oracle-text pattern approved with the note. The cards a matcher selects in fixture decks are part of the review.
5.3 The first catalogue covers Commander rules a deck triggers: a commander that dies goes to the graveyard before its owner may move it (903.9a); a commander headed to hand or library (903.9b); commander tax (903.8); effects that refer to controlling or casting a commander (903.3d). General families that cause arguments in Commander follow: replacement effects (614, 616), layers (613), copy effects (707) and state-based actions (704). This spec lists topics only. Each answer is written and reviewed, not drafted here.
5.4 A note publishes only after review by a certified Magic judge whom the owner names. Author and reviewer are different people, and both appear on the note.
5.5 **Drift.** After a CR import, a note citing a rule whose text changed or vanished becomes `needs-review` and stops rendering. A note citing a rule that only moved is renumbered automatically, and the move is logged. After a rulings import, a note citing a changed or removed ruling becomes `needs-review`.
5.6 Each note and each rulings panel offers "Report a rules error" through I-38's report form. A confirmed error retires the note in one action, and a public changelog of notes records the correction.
5.7 The deck view shows "Worth knowing in this deck (N)", collapsed and never blocking. Each item names the deck's cards involved.
5.8 Coverage is stated: "N reviewed notes apply to this deck. Cards without a note were not checked for interactions."

### 6. A model may retrieve, never answer (optional, owner decision)

6.1 A player may ask a question about cards in the deck. A model may return identifiers only: rule numbers in the served version, ruling ids for cards in the deck, and note slugs.
6.2 Identifiers are validated, and invalid ones are dropped. The product renders the sources verbatim and never model text. When none is valid, it shows 1.5.
6.3 The result says: "A language model found these sources. They may not answer your question, and they are not a ruling." I-02 requirement 6.1's disclosure page lists this surface.
6.4 A model may draft a note for an author inside the authoring workflow. Drafts never reach players; only reviewed text is published.
6.5 Before shipping, a golden set of judge-answered questions measures how often the right citation is among those returned, and the owner sets the bar. RulesGuru's question pool [20] is a candidate if its licence allows.

### 7. Accessibility, locale and offline

7.1 Rulings and notes are lists under headings. A rule reference reads "Comprehensive Rules 903.9a" to a screen reader. I-24's export includes each card's rulings (I-24 slice 3).
7.2 Interface strings exist in English and French. A note not yet reviewed in French is shown in reviewed English, marked `lang="en"`, and never machine-translated.
7.3 A deck's rulings and notes travel in I-19's offline cache. The 50-card `localStorage` cache is retired for decks.

### 8. Free and paid ([I-30](i30-business-model-and-paid-tier.md))

8.1 **Free, always**, signed out included: rulings, rule pages and links, and notes, in the builder and on the public deck page. Scryfall forbids paywalling its data and requires that card data stay reachable "anonymously or with free accounts" [3]; the Fan Content Policy forbids gating fan content (I-30); and Scryfall, Gatherer, Moxfield and Archidekt show rulings for free.
8.2 **Paid candidate: a rules watch across all my decks.** After each CR or rulings import, an account sees, and can be emailed, which of its decks gained or lost a ruling, hold a note that went to review, or contain a card whose keyword rule changed. This initiative computes the changes (2.8, 3.1); [I-48](i48-official-changes-reach-every-deck.md)'s dated impact report, deck-list notice and opt-in e-mail deliver them, so there is one change report per deck, not two. Each change stays visible for free on the card and in the "Superseded" notice (3.5); what would be sold is the computation across every deck and the notification. None of the products read offers this. Whether it counts as paywalling Scryfall data goes to the lawyer list (I-30 7.2).
8.3 **Not paid: the notes.** They are what players will quote at the table, and an error in them is the product's to own.

## Data model / API

```
CardRuling      id, oracleId String, source (wotc | scryfall), publishedAt Date, comment String,
                commentHash String                                  @@index([oracleId])
RulingsImport   id, fileUpdatedAt DateTime, importedAt DateTime, rowCount Int, sha256 String,
                newestPublishedAt Date
RulingChange    id, importId, oracleId, kind (added | changed | removed), commentHash String
DeckCard        + oracleId String?    added by I-37 slice 12 (re-pointed 2026-11-10), backfilled from I-67's CardPrinting

src/lib/rules/data/MagicCompRules-<YYYYMMDD>.txt   one per kept version; versions.ts lists effective date, URL, SHA-256
content/rules-notes/<slug>.json   { slug, title{en,fr?}, body{en,fr?}, matcher, citations[], author, reviewer,
                                    reviewedAt, crVersion, status (draft | reviewed | needs-review | retired) }
citation = { kind: "cr", rule: "903.9a", crVersion: "2026-11-06" }
         | { kind: "ruling", oracleId, publishedAt, commentHash }

GET /api/decks/{id}/rules    owner view
GET /api/deck/{id}/rules     public view, same shape, through the public allowlist
  → { rulingsAsOf, crVersion, cards: [{ deckCardId, oracleId, rulings[], ruleLinks[] }],
      notes: [{ slug, deckCardIds, citations[] }] }
/rules/comprehensive?rule=903.9a[&version=2026-11-06]
```

Adding `oracleId` to `PUBLIC_DECK_CARD_SELECT` is a deliberate allowlist change, as that file's comment requires. Notes are files rather than rows so that every change to a rules answer is a reviewed diff.

## Non-goals

- A rules engine, an AI judge, or a chatbot that writes rules answers.
- Pages of rulings per card for search engines. The roadmap rules out a generic card database, and Scryfall forbids simply republishing its data [3].
- Machine translation of rulings, rules or notes.
- Tournament policy (MTR, IPG). Link to Wizards and Academy Ruins.
- Rulings in chat apps; I-46's non-goal stands.
- Explaining the product's own warnings (I-27) or card search (I-14).
- A paid tier on any rules content (requirement 8).
- Settling disagreements between a ruling and the CR automatically. A reviewed note may address one.

## Testing strategy

- **Import.** A fixture JSONL imports with the right counts and source labels; a malformed line aborts the import and keeps the old data; a re-import is idempotent; a reversible card resolves through its faces' Oracle ids.
- **Citation contract.** Rendering a rules statement without a citation fails. Every CR citation carries a version, and every ruling a date and source.
- **Drift, on real data.** The 2026-08-07 and 2026-11-06 files are fixtures. The diff reports 124 removed, 145 added and 109 moved with identical text; a note citing 903.5e goes to review; a note citing 712.4a is renumbered to 713.1a.
- **Addresses.** `?rule=903.9a` renders chapter 903 with that anchor; an unknown rule says so; cross-references are links.
- **Keywords.** A recorded snapshot of Scryfall's keyword catalogues resolves completely through titles, aliases and the no-rule list.
- **Matchers.** Fixture decks select exactly the expected notes and cards; a deck without the trigger gets none.
- **Boundary.** The dependency test of 1.7; no provider call on any rules path.
- **Public projection.** A public deck exposes rulings and `oracleId` and still no private field.
- **Accessibility and locale.** Automated accessibility checks on the panels; `lang="en"` on official text in French; localised dates.
- **Review record.** CI fails a note marked reviewed that lacks a reviewer or a date, or whose author is its reviewer.

## Delivery slices

| #   | Slice                                                                                                                                                                                                                       | Depends on                               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 1   | CR import script with diff report; update to 2026-11-06; one served copy and the copy test _(2026-11-10: also a row of I-73's release playbook, where the owner compares the served CR with Wizards' page at each release)_ | —                                        |
| 2   | Rule addresses: paragraph ids, `?rule=`, linked cross-references and search results, French date and strings                                                                                                                | 1                                        |
| 3   | Rulings reading side: `RulingChange` and the deck's rulings from I-67's `CardRuling` _(re-pointed 2026-11-10: I-67 slice 6 loads the rulings daily, and I-37 slice 12 adds `DeckCard.oracleId`)_                            | I-67 slice 6; I-37 slice 12              |
| 4   | Deck rules API; builder panel with source labels, dates and file date; browser fetch retired                                                                                                                                | 3                                        |
| 5   | Rulings on the public deck page through the allowlist                                                                                                                                                                       | 4                                        |
| 6   | Keyword-to-rule links, alias table and catalogue test                                                                                                                                                                       | 2, 4                                     |
| 7   | Weekly freshness check for the CR, opening an issue _(the rulings file's freshness re-pointed 2026-11-10 to I-67 slice 11)_                                                                                                 | 1                                        |
| 8   | Notes content model, citation contract test and drift rules                                                                                                                                                                 | 1, 3                                     |
| 9   | Review record, "Report a rules error" and the public notes changelog                                                                                                                                                        | 8; I-38 slice 8                          |
| 10  | First catalogue: Commander notes on 903.3d, 903.8, 903.9a and 903.9b                                                                                                                                                        | 9; owner names a judge reviewer          |
| 11  | "Worth knowing in this deck" in the builder and on the public deck page                                                                                                                                                     | 5, 10                                    |
| 12  | Offline and screen-reader inclusion                                                                                                                                                                                         | 5; I-19 slice 2; I-24 slice 3            |
| 13  | Rules watch: CR and rulings changes as entries in I-48's per-deck report and notices (paid candidate)                                                                                                                       | 7, 8; I-48 slices 5 and 11; I-30 slice 0 |
| 14  | Model retrieval of citations, with its golden set                                                                                                                                                                           | 8; owner decision                        |

Slices 1 to 7 ship value alone and need no reviewer. Slice 1 comes first because every later citation needs a versioned rule to point at. Slices 2 and 6 are what no product read offers today: a card's keywords linked to numbered, versioned rules.

## Open questions

1. **Who reviews the notes?** A certified judge, paid or volunteer, and at what level; how many hours each CR update costs, with seven versions captured in 2026 [18]; and who answers for an error quoted at a table. Without a named reviewer, slices 9 to 11 do not start.
2. **French.** Wizards' rules page links an English CR only [10], and Scryfall's rulings carry no language [1]. Keep official texts in English inside a French interface, or commission human translations labelled unofficial, with the English beside them?
3. **For the lawyer (research, not legal advice), through I-30 7.2.** (a) The CR file ends "All Rights Reserved" [10]: may the app serve it verbatim, and keep old versions, under the Fan Content Policy? (b) May Wizards' rulings, received through Scryfall, appear on public deck pages? (c) Is a paid rules watch over Scryfall rulings "paywalling" Scryfall data [3]?
4. **Old CR versions.** Keep each cited version in the repository, about 1 MB each, or rely on Academy Ruins for history? Its code is AGPL-3.0 and no data terms were found [18].
5. **Model retrieval at all?** Players' hostility to AI rules answers is documented [23][24][25]. Slice 14 may be worth never building; the owner decides.
6. **After the Commander catalogue.** Layers and replacement effects are where tables argue and where an error costs most. Should they wait until the first catalogue has a clean review record?

## Sources

Read on 2026-11-10 unless dated. Scryfall's pages answered 403 to the fetch tool and were read with curl and an identifying User-Agent. Reddit posts were read through the Arctic Shift archive, which can differ from live Reddit. Measurements are our own, from the files named.

1. Scryfall, [Rulings Objects](https://scryfall.com/docs/api/rulings).
2. Scryfall, [Bulk Data Files](https://scryfall.com/docs/api/bulk-data); Rulings file updated 2026-11-09 22:00 UTC.
3. Scryfall, [API Documentation](https://scryfall.com/docs/api), sections "Required Headers" and "Use of Scryfall Data and Images".
4. Scryfall, [Rate Limits](https://scryfall.com/docs/api/rate-limits).
5. Scryfall, [Card Objects](https://scryfall.com/docs/api/cards), field `oracle_id`.
6. Scryfall, [rulings bulk metadata](https://api.scryfall.com/bulk-data/rulings) and its file `rulings-20261109220032.jsonl.gz` (5,422,271 bytes), measured 2026-11-10.
7. Scryfall, [Boon-Bringer Valkyrie](https://scryfall.com/card/mom/9/boon-bringer-valkyrie), "Notes and Rules Information".
8. Scryfall catalogues: [keyword abilities](https://api.scryfall.com/catalog/keyword-abilities), [keyword actions](https://api.scryfall.com/catalog/keyword-actions), [ability words](https://api.scryfall.com/catalog/ability-words).
9. Scryfall, [Star Trek set](https://api.scryfall.com/sets/trk), released 2026-11-13.
10. Wizards of the Coast, [Magic rules](https://magic.wizards.com/en/rules), linking [MagicCompRules 20261106.txt](https://media.wizards.com/2026/downloads/MagicCompRules%2020261106.txt), "effective as of November 6, 2026".
11. The Name of the Rule (Magic Judges blog), [Brave New Gatherer — Edge of Eternities Edition](https://blogs.magicjudges.org/nametherule/?p=1294), 2025-09-05.
12. The Name of the Rule, [An Unofficial Magic: The Gathering—FINAL FANTASY Holiday Release Update Bulletin](https://blogs.magicjudges.org/nametherule/?p=1729), 2025-12-17.
13. The Name of the Rule, [Resources](https://blogs.magicjudges.org/nametherule/?p=6), published 2024-12-23, reviewed 2026-08-15.
14. Moxfield public wiki, [Features](https://github.com/moxfield/moxfield-public/wiki/Features), last edited 2020-10-14.
15. Archidekt, [Development Update - Potpourri](https://archidekt.com/news/4906283), July 2023 (page metadata).
16. EDHREC, [Hullbreacher](https://edhrec.com/cards/hullbreacher) card page.
17. Yawgatog, [Hyperlinked Magic: The Gathering Comprehensive Rules](https://yawgatog.com/resources/magic-rules/).
18. Academy Ruins: [API repository](https://github.com/lunakv/academyruins-api) (AGPL-3.0, last push 2026-11-07), [API docs](https://api.academyruins.com/docs), [CR versions](https://api.academyruins.com/metadata/cr), [trace of 903.9a](https://api.academyruins.com/cr/trace/903.9a).
19. Magic Judges, [forum](https://apps.magicjudges.org/forum/), Rules Q&A board.
20. RulesGuru, [source repository](https://github.com/KingSupernova31/RulesGuru), last push 2026-02-04, no licence asserted.
21. [MTG Judge](https://mtg-judge-landing.pages.dev/) landing page, undated.
22. MagicJudge (Ambicon ApS), [App Store listing mirror](https://mwm.ai/apps/magicjudge/6738770397).
23. r/EDH, ["Do not use AI to make deck suggestions or clarify rules. It's wrong most of the time."](https://www.reddit.com/r/EDH/comments/1q0epg2/), 2025-12-31, 729 points.
24. r/mtgrules, ["I tested my rules chatbot on rules questions from the /magicTCG sub's Daily Questions thread"](https://www.reddit.com/r/mtgrules/comments/1vcsp0u/), 2026-08-01.
25. r/mtgrules, ["Possible disagreement between the Comprehensive Rules and the card rulings regarding backup"](https://www.reddit.com/r/mtgrules/comments/1x45ay1/), 2026-10-12.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player opens any card in the builder or on a public deck and reads its official rulings with their dates and sources, follows each keyword to its rule in a stated version of the Comprehensive Rules, and later reads reviewed notes on the interactions in this deck. When nothing reviewed applies, the product says so and points to a judge.

### Goals

- A player opens any card in the builder or on a public deck and sees its rulings with dates and a Wizards or Scryfall label, and follows each keyword to its rule; a link to CR 903.9a opens the version it was written against and says whether a newer one changed it; and when an update changes a rule that a reviewed note cites, the note disappears until a reviewer approves it again.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-47-01

As a player arguing about a card, I want the official ruling and a link to the rule number, so that a model is not the judge.

#### US-47-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-47-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-47-01 Happy path

Given a signed-in player and the English locale
When each card on the deck can open its official rulings.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-47-02 Happy path

Given a signed-in player and the English locale
When a rule citation is a versioned address, with the rules date.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-47-03 Happy path

Given a signed-in player and the English locale
When the page declines to answer an interaction the rulings do not cover.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-47-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-47-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-47-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-out on public decks, signed-in on private decks. No flag. Judge-written notes stay Later and do not start without a named reviewer.

#### AC-47-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-47-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-47-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The rulings panel is available from the card, not only from the printing picker. A missing ruling says there is none.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Rulings load through I-67. The Comprehensive Rules file is the one the product ships, replaced by a dated import. No model route.

### Analytics and telemetry

`rulings_opened {found: yes or no}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-out on public decks, signed-in on private decks. No flag. Judge-written notes stay Later and do not start without a named reviewer.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Whether French players see official English rulings or a labelled unofficial translation is open. The product does not commission a translation in this slice.

### Sources

- https://www.reddit.com/r/EDH/comments/1q0epg2/
- https://www.reddit.com/r/mtgrules/comments/1vcsp0u/
- https://scryfall.com/docs/api/bulk-data
- https://magic.wizards.com/en/rules
- https://scryfall.com/docs/api

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-47-101

As a player, I want the product to a Comprehensive Rules import script with a diff report, landing as a reviewed PR; an update to the 2026-11-06 version; and one served copy, with a test that fails when a committed copy differs (slice 1)., so that a player opens any card in the builder or on a public deck and reads its official rulings with their dates and sources, follows each keyword to its rule in a stated version of the Comprehensive Rules, and later reads reviewed notes on the interactions in this deck. When nothing reviewed applies, the product says so and points to a judge.

#### AC-47-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A Comprehensive Rules import script with a diff report, landing as a reviewed PR; an update to the 2026-11-06 version; and one served copy, with a test that fails when a committed copy differs (slice 1). Today the app serves src/lib/rules/data/MagicCompRules-20260807.txt, two versions behind the file Wizards links (rules page). Between the two, 109 rules moved to a new number with the same text, 211 changed text under the same number, chapter 715 became "Saga Cards", and 903.5e became 903.5f. Two more copies sit at the 2026-02-27 version, in docs/rules/ and .agents/skills/mtg-rules/references/comprehensive-rules.txt.

#### AC-47-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-47-102 Edge

Given a list where one name does not resolve
When the player confirms
Then the unresolved name is shown first and nothing is written until they accept that list

#### US-47-102

As a player, I want the product to rule addresses: an id on each paragraph, /rules/comprehensive?rule=903.9a, linked cross-references and search results, and the French date and strings (slice 2)., so that a player opens any card in the builder or on a public deck and reads its official rulings with their dates and sources, follows each keyword to its rule in a stated version of the Comprehensive Rules, and later reads reviewed notes on the interactions in this deck. When nothing reviewed applies, the product says so and points to a judge.

#### AC-47-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Rule addresses: an id on each paragraph, /rules/comprehensive?rule=903.9a, linked cross-references and search results, and the French date and strings (slice 2). Today src/components/rules/ComprehensiveRulesView.tsx renders one chapter per ?chapter= with no anchor per rule, "No matching rules found." is hard-coded English, and the French page shows the English date.

#### AC-47-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-47-105 Edge

Given the French locale
When the new controls render
Then they come from the French catalogue and are not hard-coded English

#### US-47-103

As a player, I want the product to a weekly server-side import of Scryfall's rulings file into CardRuling, with RulingsImport and RulingChange, and DeckCard.oracleId with a backfill (slice 3)., so that a player opens any card in the builder or on a public deck and reads its official rulings with their dates and sources, follows each keyword to its rule in a stated version of the Comprehensive Rules, and later reads reviewed notes on the interactions in this deck. When nothing reviewed applies, the product says so and points to a judge.

#### AC-47-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A weekly server-side import of Scryfall's rulings file into CardRuling, with RulingsImport and RulingChange, and DeckCard.oracleId with a backfill (slice 3).

#### AC-47-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-47-108 Edge

Given a list where one name does not resolve
When the player confirms
Then the unresolved name is shown first and nothing is written until they accept that list

#### US-47-104

As a player, I want the product to a deck rules API and a builder panel with source labels, dates and the file date, which retires the browser fetch (slice 4)., so that a player opens any card in the builder or on a public deck and reads its official rulings with their dates and sources, follows each keyword to its rule in a stated version of the Comprehensive Rules, and later reads reviewed notes on the interactions in this deck. When nothing reviewed applies, the product says so and points to a judge.

#### AC-47-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A deck rules API and a builder panel with source labels, dates and the file date, which retires the browser fetch (slice 4). Today src/lib/scryfall/rulings.ts fetches rulings from the browser outside the request queue, and src/components/card/CardRulingsPanel.tsx, reached only from PrintingSelectorModal.tsx, titles every ruling "Oracle rulings", so Scryfall's own notes read as official.

#### AC-47-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-47-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-47-105

As a player, I want the product to rulings on the public deck page through the allowlist, and keyword-to-rule links with a reviewed alias table and a catalogue test (slices 5–6)., so that a player opens any card in the builder or on a public deck and reads its official rulings with their dates and sources, follows each keyword to its rule in a stated version of the Comprehensive Rules, and later reads reviewed notes on the interactions in this deck. When nothing reviewed applies, the product says so and points to a judge.

#### AC-47-112 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Rulings on the public deck page through the allowlist, and keyword-to-rule links with a reviewed alias table and a catalogue test (slices 5–6). Today PublicDeckCards.tsx shows neither Oracle text nor rulings, and PUBLIC_DECK_CARD_SELECT (src/lib/deck/public-deck-select.ts) carries neither.

#### AC-47-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-47-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-47-106

As a player, I want the product to a weekly freshness check for the rules and the rulings file, which opens an issue and never deploys rules text (slice 7)., so that a player opens any card in the builder or on a public deck and reads its official rulings with their dates and sources, follows each keyword to its rule in a stated version of the Comprehensive Rules, and later reads reviewed notes on the interactions in this deck. When nothing reviewed applies, the product says so and points to a judge.

#### AC-47-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A weekly freshness check for the rules and the rulings file, which opens an issue and never deploys rules text (slice 7).

#### AC-47-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-47-117 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-47-107

As a player, I want the product to later: the notes' content model, citation contract and drift rules; a review record, "Report a rules error" and a public changelog of notes; a first catalogue of Commander notes on 903.3d, 903.8, 903.9a and 903.9b; and "Worth knowing in this deck" (slices 8–11)., so that a player opens any card in the builder or on a public deck and reads its official rulings with their dates and sources, follows each keyword to its rule in a stated version of the Comprehensive Rules, and later reads reviewed notes on the interactions in this deck. When nothing reviewed applies, the product says so and points to a judge.

#### AC-47-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Later: the notes' content model, citation contract and drift rules; a review record, "Report a rules error" and a public changelog of notes; a first catalogue of Commander notes on 903.3d, 903.8, 903.9a and 903.9b; and "Worth knowing in this deck" (slices 8–11). A note whose cited rule changes goes back to review and stops rendering.

#### AC-47-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-47-120 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-47-108

As a player, I want the product to later: rulings and notes in I-19's offline copy and I-24's export (slice 12); the rules watch as entries in I-48's per-deck report (slice 13); and model retrieval of citations only if the owner decides for it (slice 14)., so that a player opens any card in the builder or on a public deck and reads its official rulings with their dates and sources, follows each keyword to its rule in a stated version of the Comprehensive Rules, and later reads reviewed notes on the interactions in this deck. When nothing reviewed applies, the product says so and points to a judge.

#### AC-47-121 Happy path

Given a downloaded deck and no network
When the player uses this behaviour
Then the behaviour holds: Later: rulings and notes in I-19's offline copy and I-24's export (slice 12); the rules watch as entries in I-48's per-deck report (slice 13); and model retrieval of citations only if the owner decides for it (slice 14).

#### AC-47-122 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-47-123 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a player opens any card in the builder or on a public deck and reads its official rulings with their dates and sources, follows each keyword to its rule in a stated version of the Comprehensive Rules, and later reads reviewed notes on the interactions in this deck. When nothing reviewed applies, the product says so and points to a judge.

| State | What the player sees |
| --- | --- |
| Empty | A sentence that names what is missing and the next action. No invented row, author, price or score. |
| Loading | A busy state that keeps the layout still. The previous confirmed content stays until the new content is ready. |
| Error | The catalogue message, what was not saved, and a retry. The last confirmed edit is still there. |
| Partial | Known rows are shown. Unknown rows are labelled unknown. A short list is not padded to look finished. |
| Stale | If this feature shows a date, the date is the one that was stored. A missing date is absent, not guessed. |
| Guest | A signed-out player sees only what the rollout allows. A control that needs an account explains that, and does not fail with a raw 401. |
| Signed-in | Writes go to that account only. Another player's notes, budget and collection are not in the response. |
| English | New controls use the `en` catalogue. |
| French | New controls use the `fr` catalogue. A French URL does not show a hard-coded English control. |
| Dormant catalogs | `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` keep every new key and may reuse the English text until a person reviews them. They are not routed. |
| Keyboard | The primary action and every new control can be reached without a pointer. Focus is visible and returns when a dialog closes. |
| Screen reader | Each new control has an accessible name. A status change is announced in words, not only by colour. |
| Colour | A warning and an error differ by text or icon as well as hue, in both themes. |
| Success | The completed action is confirmed in words. A second identical action does not duplicate the write. |

### Alternate paths

- The player cancels before confirming. Nothing is written.
- The player confirms, the request fails, and they retry. The retry uses the last confirmed state, not a mixture of the failed attempt and the old one.
- The player switches locale in the middle of the flow. The draft they already typed is kept. Chrome strings switch. Card names and oracle text stay the printing's language.
- Two writes overlap. Each field rolls back to its own last confirmed value. One failure does not undo the other field's success.

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

# Rules, Access And The Online Table

I-47 to I-50 were added on 2026-11-10 from a third research pass, each from dated research its spec links, because the notes are not committed. They cover what the product says about the rules of a deck's cards (I-47) and about the official lists that move a saved deck (I-48), who can read the product's colours and charts (I-49), and how a deck reaches the online tables where it is played (I-50). I-49 is Next, and I-47, I-48 and I-50 are Next for their early slices. The rules of the previous parts hold: no model decides a rules answer, a legality verdict or a replacement; card data and the evidence the product shows stay free; and legal points are research, not legal advice.

---

## I-47: Rules Answers For The Cards In This Deck

**Spec:** [`specs/i47-rules-answers-for-this-deck.md`](i47-rules-answers-for-this-deck.md)

**Outcome:** a player opens any card in the builder or on a public deck and reads its official rulings with their dates and sources, follows each keyword to its rule in a stated version of the Comprehensive Rules, and later reads reviewed notes on the interactions in this deck. When nothing reviewed applies, the product says so and points to a judge.

**Status:** Next
**Priority:** Next for official rulings and rule links (slices 1 to 7); Later for the judge-reviewed interaction notes (slices 8 to 11) and for offline and screen-reader inclusion (slice 12); slices 13 and 14 wait on I-48, I-30 and the owner
**Impact / effort:** Medium / medium for slices 1–7; the notes cost reviewer time on every rules update
**Depends on:** nothing outside this initiative for slices 1, 2 and 7; I-67 slice 6's daily rulings and I-37 slice 12's `DeckCard.oracleId` for the rulings (slice 3), and so for slices 4 to 6, re-pointed 2026-11-10; I-38 slice 8 for error reports; a judge the owner names before slices 10 and 11; I-19 slice 2 and I-24 slice 3 for slice 12; I-48 slices 5 and 11 and I-30 slice 0 for the rules watch; the owner's decision for slice 14.

At the table, a pod argues about how two cards in one deck interact, and players say loudly that chatbots get rules wrong: "Do not use AI to make deck suggestions or clarify rules" reached 729 points on r/EDH ([2025-12-31](https://www.reddit.com/r/EDH/comments/1q0epg2/)). A hobby bot grounded in the rules and in Scryfall's rulings was wrong on about one question in sixteen, and committed to an answer every time ([r/mtgrules, 2026-08-01](https://www.reddit.com/r/mtgrules/comments/1vcsp0u/)). Rulings on each card are table stakes: Scryfall, Gatherer, Moxfield and Archidekt show them. Scryfall's daily rulings file holds 79,706 rulings for 20,080 Oracle cards in 5.4 MB ([bulk data](https://scryfall.com/docs/api/bulk-data)), and only 28 of them contain a rule number, so rulings will not link themselves to the rules. No product read joins a card's keywords to rule numbers, versions a citation or lists the interactions that matter in one deck. The opening is a product that cites, versions and declines, which is also the only position the roadmap's boundary allows: no model decides, writes or translates a rules statement a player sees.

### Scope

- [ ] A Comprehensive Rules import script with a diff report, landing as a reviewed PR; an update to the 2026-11-06 version; and one served copy, with a test that fails when a committed copy differs (slice 1). Today the app serves `src/lib/rules/data/MagicCompRules-20260807.txt`, two versions behind the file Wizards links ([rules page](https://magic.wizards.com/en/rules)). Between the two, 109 rules moved to a new number with the same text, 211 changed text under the same number, chapter 715 became "Saga Cards", and 903.5e became 903.5f. Two more copies sit at the 2026-02-27 version, in `docs/rules/` and `.agents/skills/mtg-rules/references/comprehensive-rules.txt`.
  - Also a row of [I-73](i73-every-set-release-ready-on-day-one.md)'s release playbook (2026-11-10): seven days before each release the owner compares the served Comprehensive Rules with Wizards' page. Wizards linked the 2026-11-06 file a week before Star Trek's release.
- [ ] Rule addresses: an `id` on each paragraph, `/rules/comprehensive?rule=903.9a`, linked cross-references and search results, and the French date and strings (slice 2). Today `src/components/rules/ComprehensiveRulesView.tsx` renders one chapter per `?chapter=` with no anchor per rule, "No matching rules found." is hard-coded English, and the French page shows the English date.
- [ ] A weekly server-side import of Scryfall's rulings file into `CardRuling`, with `RulingsImport` and `RulingChange`, and `DeckCard.oracleId` with a backfill (slice 3).
  - Re-pointed 2026-11-10 to [I-67](i67-one-card-data-pipeline.md) slice 6, which loads the rulings daily into `CardRuling`; slice 3 keeps the reading side and the change entries, and `DeckCard.oracleId` is I-37 slice 12's.
- [ ] A deck rules API and a builder panel with source labels, dates and the file date, which retires the browser fetch (slice 4). Today `src/lib/scryfall/rulings.ts` fetches rulings from the browser outside the request queue, and `src/components/card/CardRulingsPanel.tsx`, reached only from `PrintingSelectorModal.tsx`, titles every ruling "Oracle rulings", so Scryfall's own notes read as official.
- [ ] Rulings on the public deck page through the allowlist, and keyword-to-rule links with a reviewed alias table and a catalogue test (slices 5–6). Today `PublicDeckCards.tsx` shows neither Oracle text nor rulings, and `PUBLIC_DECK_CARD_SELECT` (`src/lib/deck/public-deck-select.ts`) carries neither.
- [ ] A weekly freshness check for the rules and the rulings file, which opens an issue and never deploys rules text (slice 7).
  - The rulings file's freshness moved to I-67 slice 11 on 2026-11-10; slice 7 keeps the Comprehensive Rules check.
- [ ] Later: the notes' content model, citation contract and drift rules; a review record, "Report a rules error" and a public changelog of notes; a first catalogue of Commander notes on 903.3d, 903.8, 903.9a and 903.9b; and "Worth knowing in this deck" (slices 8–11). A note whose cited rule changes goes back to review and stops rendering.
- [ ] Later: rulings and notes in I-19's offline copy and I-24's export (slice 12); the rules watch as entries in I-48's per-deck report (slice 13); and model retrieval of citations only if the owner decides for it (slice 14).
- [ ] Added 2026-11-12 (thirteenth pass): [I-99](i99-a-pilot-sheet-and-how-heavy-this-deck-is-to-pilot.md)'s timing classes link their CR rule (502, 504, 507, 508, 513, 603, 614) through slice 2's anchors once they exist; nothing changes in the rules pages themselves.

### Engineering enablers

- A dependency test fails if any rules route or component imports the AI client, as in I-46.
- Rendering a rules statement without a citation fails; every Comprehensive Rules citation carries its version, and every ruling its date and source.
- The 2026-08-07 and 2026-11-06 files are fixtures: the diff reports 124 rules removed, 145 added and 109 moved with the same text; a note citing 903.5e goes to review, and one citing 712.4a is renumbered to 713.1a.
- CI fails a note marked reviewed that lacks a reviewer or a date, or whose author is its reviewer.

**Paid-tier angle:** rulings, rule pages and links, and notes stay free and readable signed out. Scryfall requires card data to stay reachable "anonymously or with free accounts" ([API terms](https://scryfall.com/docs/api)), and rival sites show rulings for free. The notes are never sold, because an error in them is the product's to own. The candidate is a rules watch across all of a player's decks, delivered through I-48's report and notices so that each deck has one change report; whether it paywalls Scryfall data is a lawyer question.

### Enrichment (2026-11-11)

**User story.** As a player arguing about a card, I want the official ruling and a link to the rule number, so that a model is not the judge.

**Acceptance.**
- Each card on the deck can open its official rulings.
- A rule citation is a versioned address, with the rules date.
- The page declines to answer an interaction the rulings do not cover.

**UX.** The rulings panel is available from the card, not only from the printing picker. A missing ruling says there is none.

**Data and API.** Rulings load through I-67. The Comprehensive Rules file is the one the product ships, replaced by a dated import. No model route.

**i18n and access.** Interface chrome in English and French. Ruling text stays the language of the source. A machine translation of a ruling is out of scope.

**Telemetry.** `rulings_opened {found: yes or no}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-out on public decks, signed-in on private decks. No flag. Judge-written notes stay Later and do not start without a named reviewer.

**Open questions.** Whether French players see official English rulings or a labelled unofficial translation is open. The product does not commission a translation in this slice.

### Definition of done

A player opens any card in the builder or on a public deck and sees its rulings with dates and a Wizards or Scryfall label, and follows each keyword to its rule; a link to CR 903.9a opens the version it was written against and says whether a newer one changed it; and when an update changes a rule that a reviewed note cites, the note disappears until a reviewer approves it again.

---

