# I-76: Complete This Deck From My Collection

> **Initiative:** I-76, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for slices 0 to 16, the model-free completion and the owned substitute, placed directly after [I-58](i58-mana-base-builder.md) because it reuses I-58's apply engine; Later for slices 17 to 21 (events, measured norms, model wording, the AI mode and the collection-wide allocation), which wait for I-39, I-68, I-30 and I-02 · **Paid:** completing one deck and every substitute stay free; the collection-wide allocation is a candidate for [I-30](i30-business-model-and-paid-tier.md) (requirement 15) · **Written 2026-11-11**
> **Research:** wave 11 notes of 2026-11-10 (digital card games, analytics and AI, player voice) and one dated note of 2026-11-11 that re-read every source kept here. None is committed, so every external fact links its entry in [Sources](#sources). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** the slot roles used to fill a deck and their versioned definitions; role targets per bracket as data; the legal-candidate filter; the deterministic proposal for the open slots of one deck and its ranking rule; the reason on every line; the slot-by-slot review; the owned substitute for one missing card; the fixture set and before-and-after report that gate a ranking change; the collection-wide allocation (paid candidate). **Does not own:** land counts, source targets and land lines ([I-58](i58-mana-base-builder.md)); the apply, snapshot and revert engine (I-58 slice 16, proposed below); route roles and their definition format ([I-65](i65-how-this-deck-wins.md)); bracket rules and the guide's ranges ([I-28](i28-commander-deckbuilding-guide-by-bracket.md)); copies committed to other decks ([I-16](i16-decks-buildable-from-a-collection.md)); ownership, proxies and the acquisition plan ([I-06](i06-collection-and-purchase-planning.md)); printings ([I-57](i57-printing-preferences-everywhere.md)); the card catalogue ([I-67](i67-one-card-data-pipeline.md)); Game Changer versions ([I-48](i48-official-changes-reach-every-deck.md)); the model routes and allowance ([I-02](i02-checkable-ai-copilot.md), I-30); events ([I-39](i39-first-run-activation-and-measurement.md)).
> **Proposed changes to neighbours, for the integrator:**
>
> | Neighbour              | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
> | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | I-16                   | Slice 4's commitment index depends on nothing: it reads deck rows and collection rows, as `GET /api/collection/usage` already does (the roadmap says so for slice 6). The free-cards ranking mode moves to a new slice 7 (depends on 2 and 4). Copies in main and command zones commit; Considering and sideboard do not. The non-goal "Generating a full 100-card list from the collection" now reads: completing a started deck is I-76; generating a list from nothing stays I-02. |
> | I-02                   | Slice 9 reads I-76 slice 3's `isLegalCandidate` (one filter, one owner) and gains "I-76 slice 3" as a dependency. Pointer: completion from the collection is I-76; its AI mode (slice 20) picks from slice 9's pool and counts against the allowance.                                                                                                                                                                                                                                 |
> | I-58                   | New slice 16, "Reviewed change set: snapshot-then-apply route, 409, apply record with `kind`, revert", depends on nothing. Slice 7 becomes the land review on top of it (depends on 6 and 16). `ManaBaseApply` becomes `DeckChangeSetApply` with `kind`. Slice 15's cross-deck allocation runs on I-76 slice 21's allocator, restricted to lands.                                                                                                                                     |
> | I-06                   | Scope item: each missing card offers three paths: I-76 slice 10's owned substitute, a proxy only when the deck's I-15 sheet allows proxies, or the acquisition plan. The owner-decided "Collection only" search filter reads the same owned counts as I-76 slice 4.                                                                                                                                                                                                                   |
> | I-65, I-28             | I-65 slice 1's definitions file and compiler also carry I-76's slot roles, under their own ids and version. I-28 slice 7's soft targets read I-76 slice 2's `RoleTarget`, so the guide's ranges exist once as data.                                                                                                                                                                                                                                                                   |
> | I-39, I-17, I-62, I-68 | I-39 8.2 gains four count-only events (requirement 12). I-17's working copies, I-62's import report and I-68's "Start from this skeleton" call slice 10 or the proposal route; no new slice there.                                                                                                                                                                                                                                                                                    |
> | Registers              | New D-88 (signals and free per deck). D-64 gains I-76's role targets. D-47 gains requirement 10.3's answer on `Deck.budget`. D-17 gains slice 21. L-24 (h) covers the inclusion column (open question 5).                                                                                                                                                                                                                                                                             |

## Overview

A player with a commander and 40 chosen cards wants a playable 100 from their own boxes tonight. Today the product can show what is missing and what it costs (I-06), propose lands (I-58, not built) or generate a whole deck with a model that never reads the collection (I-02). Nothing fills the remaining slots of the player's own deck.

This initiative does that without a model. Each open slot gets a role from the bracket guide's target composition, legal candidates from what the player owns, free copies first, and a reason. The player reviews slot by slot, keeps the picks they like, applies them as one reviewed change and reverts it in one action. The same engine, run on one slot, answers the commonest physical-collection question: "I don't own this card. What do I own that does the same job?"

## What the market does

Read 2026-11-11 unless dated otherwise.

| Product                                | What it does                                                                                                                                                                                                                                                                                                                                                                                                  | Lesson for Commander                                                                                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hearthstone** "Complete My Deck" [1] | Fills a partial deck "using only cards from your existing collection": a meta layer built from clustered popular decks, then a back-fill layer. "If there are already 10 cards in any specific mana-cost bucket, we are reluctant to add any more". Repeated clicks give different decks only from an empty deck. Card power is rated "Without considering unique synergies and combo potential" (2019-03-28) | A collection-only fill with a curve rule works. Popularity as the first layer is what the roadmap forbids; the stated synergy limit is the gap a role and route model fills |
| **Hearthstone** "Suggest a Card" [2]   | Missing recipe cards are greyed out; clicking one replaces it "with a card from your collection" (2016-03-08)                                                                                                                                                                                                                                                                                                 | The owned substitute per missing card                                                                                                                                       |
| **Marvel Snap** Deck Builder [3][4][5] | Finishes a deck "from 0 to 11!" chosen cards, "taking your collection into account", data "updated regularly" (2023-12-05). "The auto deck builder is the best addition to the game in months": 304 points (2024-01-17). Later posts doubt unexplained picks: 108 points (2024-05-20), and 2025-08-14                                                                                                         | Players like the seed-then-fill gesture and distrust picks with no reason                                                                                                   |
| **Yu-Gi-Oh! Master Duel** [6][7]       | 2.1.0: "Build New Deck" and "Add rest of the cards to this Deck", "with the help of AI" (fan source, 2024-11-07). 2.3.0 added "the ability to Undo and adjust auto build settings" (fan source, 2025-05-07)                                                                                                                                                                                                   | Undo and settings followed about six months later; ship them on day one                                                                                                     |
| **r/mtg** generator thread [8]         | An EDHREC-statistics generator, 462 points. Replies: "skip the fun, satisfying part of edh" (336); a robot to "go through my collection and put the deck together" (378, a joke about assembling cards); a bracket and Game Changer filter (40). Post about May 2025, snapshot 2026-02-18                                                                                                                     | Whole-deck generation takes the fun away; slot by slot keeps the player choosing                                                                                            |
| **Bulk Commander** [9]                 | Builds decks "using the cards you already own" with composition targets and a gap analysis. A reply: "I don't want the first thing I see is essentially trying to make me buy cards I don't have" (post about May 2025, snapshot 2026-02-08; the site answered HTTP 522 on 2026-11-11)                                                                                                                        | Owned first, and purchases only after                                                                                                                                       |
| **Playgroup.gg** deck builder [10]     | Category targets come from the middle half of full decks in the same identity; a short category turns amber. It flags gaps, does not fill them, and does not read a collection                                                                                                                                                                                                                                | Role targets per deck are expected; filling them from the collection is not offered                                                                                         |
| **Grimoria** card suggestions [11]     | "AI-powered card recommendations" with EDHREC synergy data, an "owned only" filter, budget alternatives from a similarity engine and a deck impact preview (v2.3.51)                                                                                                                                                                                                                                          | Owned-only suggestions exist; a role-by-role fill does not                                                                                                                  |
| **Untap AI** [12]                      | "Complete-your-deck suggestions" in Pro at 4.99 USD a month or 49.99 a year, with a coach "powered by Claude AI"; bracket detection is free (iOS, released May 26, version 1.0.2, no ratings shown)                                                                                                                                                                                                           | Completion is sold as an AI feature at the I-30 price point                                                                                                                 |
| **Deckbox** Premium [13]               | "Build decks from your real inventory", 3.99 USD a month billed yearly or 5.99 monthly                                                                                                                                                                                                                                                                                                                        | Building against owned copies is a paid line elsewhere                                                                                                                      |

Whole-deck generation from a collection is crowded: SuperBrew, DeckFinder, ManaBuilder, MTG Agents and ManaForge ([specs README](README.md#what-the-sweep-concluded)).

**What no tool read does.** Fill the open slots of the player's own Commander deck one role at a time, against a sourced range for the target bracket, with the bracket's hard rules enforced by code, copies committed to other decks excluded, a reason on every line, and a reviewed change that reverts in one action.

## Current state in this codebase

Verified on `dev` at `2cf792e8` (#1340) on 2026-11-11.

- **No completion.** Nothing under `src/app/api/ai/` or `src/lib/ai/` reads `CollectionCard`. `getCardCollection` in `src/app/api/ai/suggest/route.ts` (lines 15 and 490) is Scryfall's `/cards/collection` lookup, up to 75 identifiers a call (`src/lib/scryfall/client.ts` line 172), not ownership.
- **Ownership is per printing, without an Oracle ID.** `CollectionCard` (`prisma/schema.prisma`) holds `scryfallId`, `name`, `quantity` and `foil` per user. No model holds `oracleId`.
- **No commitment index.** `GET /api/collection/usage?scryfallId=` lists the caller's deck rows for one printing. Nothing counts free copies across the collection.
- **Owned printing by name.** `getOwnedPrinting` (`src/lib/deck/store.ts` lines 134–154) takes the first owned printing with the same name. `applyBulkEdit` (line 813) uses it, sends one `PATCH /api/decks/[id]/cards` transaction that answers 409 through `StaleDeckCardsError`, then drops the deck's undo entries. No edit takes a snapshot first; snapshot and restore routes exist under `src/app/api/decks/[id]/snapshots/`.
- **One role per card.** `categorizeCard` (`src/lib/deck/categories.ts` line 77) returns one of ramp, removal, draw (tutors too), protection, and others; `boardWipe` and `winCondition` exist as categories. `BENCHMARKS` in `src/lib/constants/benchmarks.ts` is one set of ranges for every bracket, imported only by its test.
- **Brackets 1 to 4.** `BracketLevel = 1 | 2 | 3 | 4` in `src/lib/constants/brackets.ts`; I-28 slice 2 (branch `fix/official-bracket-definitions`) adds Bracket 5. `Deck.targetBracket` defaults to 3. `Deck.budget` is one `Float?`, read as a per-card cap.
- **Game Changers come from a browser search.** `useGameChangersSet` (`src/hooks/useGameChangers.ts`) fetches `is:gamechanger` from Scryfall. `detectGameChanger` in `src/lib/deck/validation.ts` was an Oracle-text heuristic used by no production code, deleted on 2026-11-12 (P1-32); completion must not reintroduce it.
- **Rules helpers to reuse.** `isCardOutsideColorIdentity` (`src/lib/deck/color-identity.ts`), `maxQuantity` (`src/lib/deck/multiples.ts`), `canPairWith` (`src/lib/deck/pairing.ts`), `validateCompanionCondition` (`src/lib/deck/companion.ts`) and `checkGeneratedDeckLegality` (`src/lib/ai/generated-deck-legality.ts`, which refuses to repair a command zone and repairs nothing from a pool). `requestDeckCombos` (`src/lib/combos/find-my-combos.ts`) checks a list against Commander Spellbook.
- **Dead substitutes.** `findCheaperAlternatives` (`src/lib/deck/pricing.ts` line 198) matches an identical type line and is imported only by its test. `suggestBudgetReductions` proposes "(budget alternative)" placeholders. Neither is a base.
- **Search.** `collectionOnly` (`src/lib/deck/types.ts` line 165) toggles in `SearchFilters.tsx`, but no code filters by it; the owner decided on 2026-11-10 to make it work.
- **EDHREC.** `src/lib/meta/fetch.ts` keeps the top 20 cards per commander (line 161) with inclusion and its sample; no Lift.
- **No seeded generator** exists in `src/lib`.

**Where new code goes.** The refactor's `docs/engineering/architecture.md` (branch `docs-architecture-foundation`, not yet merged) forbids creating `src/modules/` by hand: new code sits beside its siblings, shaped as the target layers. Owners: slot roles, role targets and gaps belong to **deck analysis** (beside `src/lib/deck/categories.ts`); `isLegalCandidate` to **format rules** (beside `color-identity.ts`); the proposal, substitute and apply use case to **deck building**, which owns the data the change writes (`src/lib/deck/completion/`); owned counts and the commitment index to **collection** (`src/lib/collection/`); the candidate catalogue to **card catalog** (I-67); the inclusion column to **meta insights**; the AI mode to **AI copilot**.

## Functional requirements

### 1. Ground rules

1.1 Every pick, count, check and reason is computed by code from card data, the collection, deck rows and versioned definitions. No model chooses, ranks or checks a card ([strategic boundaries](../roadmap.md#strategic-boundaries)).
1.2 The same inputs (deck version, collection hash, settings, definitions and rule versions, card-data date, seed) give the same proposal, byte for byte, including order.
1.3 The proposal route writes nothing. Only apply writes, after review, and only for the deck's owner.
1.4 Completion works with the copilot off ([I-02 6.3](i02-checkable-ai-copilot.md#6-disclosure-of-ai-use)) and with Spellbook down ("combos not checked", never "no combos").
1.5 Ownership is private: a proposal reads only its owner's collection, and nothing about ownership reaches a public page.

### 2. Inputs and pools

2.1 A Commander deck with a legal command zone. Completion never proposes a commander, partner, Background or companion; an empty or illegal command zone shows "Choose a commander first", as `checkGeneratedDeckLegality` refuses to repair one.
2.2 Cards in the main and command zones are the player's choices: locked, never removed or changed. Cards in Considering are the player's own shortlist and rank first (5.2).
2.3 Owned count per card sums every printing and finish, grouped by exact name until I-67 slice 2's `CardPrinting` maps printings to Oracle IDs.
2.4 Pools: **owned only** (the default with a collection); **owned first** and **any card** (slice 13, the default without a collection); **free copies only** (slice 11).
2.5 Without a collection, the panel says so and links collection import ([I-26](i26-collections-arriving-from-elsewhere.md), [I-62](i62-switching-from-another-site.md)). Before slice 13, "Complete" needs a collection.

### 3. Slot roles and role targets

3.1 Slot roles follow the guide's [roles of a Commander deck](../guides/commander-deckbuilding-by-bracket.md#the-roles-of-a-commander-deck): ramp (land search, rocks, dorks, rituals, cost reducers), card draw, targeted interaction (removal, counterspells, bounce, edicts), mass interaction, protection and tutor (land search counts as ramp). A card may hold several. Lands come from I-58; win routes and plan pieces from I-65's route roles.
3.2 Each role is versioned data in I-65 slice 1's format: Oracle patterns, keywords and types now; Tagger tags after I-67 slice 7 and [L-22](../legal-questions.md#l-22-scryfalls-tagger-tags), which raise recall. A role shows the clause that matched it.
3.3 The owner can add or remove a slot role on a card in their deck, stored per deck and hashed into the inputs, as I-65 3.4 does for route roles.
3.4 Role targets per bracket are I-28's **Recommended** ranges ([per-bracket tables](../guides/commander-deckbuilding-by-bracket.md#what-decks-look-like-per-bracket)), stored once with their evidence label and anchor. A test fails when the guide's tables and the data differ.
3.5 Measured norms by style and bracket ([I-68](i68-archetype-guides.md) slice 12, [I-29](i29-cross-site-deck-index.md) §6) replace a range only after the owner approves it under D-64, and show their n and date.

### 4. Legal candidates

4.1 `isLegalCandidate` passes a card that is legal in Commander and not banned, inside the command zone's identity (both commanders for a pair), within `maxQuantity`, and keeps the Game Changer count within the target bracket's limit.
4.2 At Brackets 1 to 3, no candidate belongs to the extra-turn or mass-land-denial classes. Until I-28 slice 7 publishes those classes, conservative Oracle patterns apply and are labelled "conservative".
4.3 Below Bracket 4, no line completes a two-card combo with the projected deck, checked once per proposal and again before apply through `requestDeckCombos`. At Bracket 3, the official turn-6 rule replaces this once I-28 slice 2 and I-65 slice 2 read Spellbook's `bracketTag`.
4.4 Game Changer status comes from Scryfall's `game_changer` field on the server, then from the deck's rules version after I-48 slice 2.
4.5 With a companion, every line keeps its condition, checked on the projected deck with `validateCompanionCondition`.
4.6 On demand, the panel lists the top-ranked cards a rule dropped, with the rule: "Cyclonic Rift not proposed: Game Changer, limit 0 at Bracket 2".

### 5. Ranking (recommended answer to D-88: option a)

5.1 A slot's candidates are legal, fill at least one of the slot's open roles and belong to the run's pool.
5.2 Each step breaks the ties of the one before: (1) availability: in this deck's Considering, then a free copy, then an owned copy committed elsewhere, then not owned; (2) the number of roles below their minimum the card fills; (3) plan fit: how many chosen cards share a route role with it; (4) curve fit: the projected average mana value stays inside the bracket's range, or moves toward it; (5) colour demand: the card raises no colour's I-58 source target; (6) price to acquire, owned at zero, unpriced after priced; (7) name, then card ID.
5.3 Popularity never orders candidates. EDHREC inclusion appears only as a labelled column with its sample and date (slice 16). Lift is not shown: the top-20 feed has no reference denominator (strategic boundary).
5.4 The rule carries a version, recorded with every proposal and apply.

### 6. The proposal

6.1 Open slots are the deck size (99, or 98 with a pair) minus the cards in main and command zones. A deck already full gets "nothing to fill"; the substitute still works.
6.2 Lands first: the target is the bracket range's minimum, or the current count if higher, with I-58 slice 1's formula on the projected deck shown beside it; the player may pick any count. Basics fill land slots split by I-58 slice 4's source targets until I-58 slice 6's proposal ships and fills them with its own reasons.
6.3 Then every role below its minimum, largest relative shortfall first. Each pick updates the counts, and a card counts for every role it fills.
6.4 Then plan slots, from candidates that share a route role with the chosen cards ("sacrifice outlet: your deck has 5 payoffs and 1 outlet").
6.5 Then roles up to their maximum, then flex slots by the ranking alone.
6.6 When the pool holds no legal candidate for a role, the slot stays open: "No owned card fills ramp at Bracket 2". The fill never pads with basics beyond the land target.

### 7. Review: slot by slot by default

7.1 The panel shows a role meter (each count against its range) and the open slots grouped by role. Each slot shows its top pick, its reason and up to four alternatives, with accept, swap and skip.
7.2 "Fill this role" and "Fill the rest" accept the top picks for one role or for every open slot. Both are explicit buttons, and both end in the same summary; neither applies anything. This answers the 336-point "skip the fun" reply [8].
7.3 Each acceptance re-runs the proposal with the pick locked, so later slots see the new counts.
7.4 The summary shows before and after: role counts against ranges, average mana value, land count, Game Changers against the limit, the combo check, the owned share, and the cost to acquire with its price date and unpriced count.
7.5 Each reason comes from a template in English and French: roles filled with counts and range ("Ramp 6 → 7; Bracket 2 target 9–13, I-28 Recommended"), availability ("owned, 1 of 2 copies free"), curve effect, cost. Templates pass I-65 1.3's verdict-word test.

### 8. Apply and revert

8.1 Apply goes through I-58 slice 16's change set: a snapshot "Before completion · <UTC time>", then the accepted lines in one transaction against the reviewed deck version; a changed deck gets 409 and nothing is written.
8.2 The record holds `kind: completion`, the snapshot, the change set and the inputs hash. Revert is one action, under I-58 7.5's rules.
8.3 Added lines take an owned printing by name, as `applyBulkEdit` does today, until slice 14 hands printings to I-57's resolver.

### 9. The owned substitute for a missing card

9.1 On a deck row the player does not own, or has no free copy of after slice 11, "Owned substitute" runs the engine on one slot. Candidates share a slot role or route role with the missing card, pass group 4 for this deck, are owned (free first) and sit within one mana value of it unless none does.
9.2 Shared roles rank first, then group 5. Up to three are shown with a reason: "Does Rhystic Study's job: card draw. Owned, free. Mana value 4 against 3."
9.3 Choosing one moves the missing card to Considering and adds the substitute in one change set (group 8).
9.4 With no candidate: "No owned card does this job", beside I-06's proxy and acquisition paths.
9.5 The route serves I-06's missing-card panel, [I-17](i17-precon-path-and-tiered-upgrades.md)'s working copies and I-62's import report.

### 10. Settings

10.1 Pool (2.4), the bracket (the deck's target by default), roles to fill, the land count, and excluded cards ("never propose") are stored per deck for its owner.
10.2 A per-card price cap and a budget to acquire for the run, in USD as stored; the EUR market follows I-32 slices 2 and 3.
10.3 Recommended answer to D-47: `Deck.budget` becomes `{ perCard?, total?, market }`, shared with I-58 1.3. Until then completion reads `Deck.budget` as the per-card cap it is.
10.4 "Another proposal" (slice 15) takes a visible, copyable seed that reorders only ties of 5.2 steps 1 to 4.

### 11. Pairs, companion and Bracket 5

11.1 A pair has the union of both identities and 98 slots, checked with `canPairWith` (pairing variants from `fix/commander-pairing-variants`).
11.2 A companion takes no main-deck slot; 4.5 applies to every line.
11.3 Bracket 5 has no Game Changer limit and uses the guide's Bracket 5 ranges. The panel says these are medians of self-labelled decks and that cEDH lists follow a field this fill cannot see, and links I-29's cEDH sources.

### 12. Measuring acceptance

12.1 I-39 8.2 gains four events, counts only: `completion_run` {pool, bracket, mode, openSlots, proposedLines}; `completion_applied` {lines, topPicks, alternatives, ownedLines, unownedLines}; `completion_reverted` {hoursSinceApplyBucket}; `missing_card_path` {path: substitute, proxy, plan or none}. No card name or list, per I-39 8.3.
12.2 I-39's owner view shows the share of runs applied, the top-pick share, the owned share of applied lines, reverts within seven days and the share of runs where a role had no owned candidate. No target is set before three months of data.

### 13. The quality gate

13.1 A fixture set of twelve partial decks: one per bracket, a partner pair, a Background, a companion, mono-colour, five-colour, 40 chosen cards, 95 chosen cards and an empty collection. Card data comes from a pinned snapshot (shared with [I-70](i70-ai-quality-bench-and-model-changes.md) slice 3) and recorded collections.
13.2 A report per fixture lists the lines, role counts against ranges, average mana value, Game Changers, owned share, cost to acquire and any rule drops.
13.3 CI fails when the ranking-rule or role-definition version changes without a regenerated report; the diff of the report is the review.

### 14. Models, later

14.1 An optional model rewording of a reason receives only the template output and is kept only if it holds the same card names and numbers and no verdict word, as I-65 9.2 requires. It is labelled and counts against I-30's allowance.
14.2 The AI mode (D-88 option c) asks the model for numbered picks from slice 3's pool, per role. Every pick passes group 4 again, is labelled "picked by a model", and is scored on I-70's bench in a "completion" case family.

### 15. Free and paid

| Capability                                                                                                                          | Free                 | Paid (I-30) | Why                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model-free completion of one deck, substitutes, reasons, review, apply, revert, the role meter                                      | Yes                  | —           | Building is free ([I-30 1.1](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)); the evidence behind a pick is never paid                                      |
| AI mode and model wording                                                                                                           | Within the allowance | Above it    | Use that costs money (I-30 1.3), as Untap AI sells completion in Pro [12]                                                                                                  |
| Collection-wide allocation: give each owned copy to one deck across all decks, then the cheapest purchase that completes every deck | —                    | Candidate   | A personal tool over the player's own data (I-30 1.3). Deckbox sells "Build decks from your real inventory" [13]; no tool read allocates copies across decks. **Unproven** |

## Data model / API

```
SlotRole            id, version, label{en, fr}, clauses[] (oraclePattern | keyword | type | taggerTag)
RoleTarget          bracket (1..5), roleId, min, max, evidence (official|data|community|recommended), guideAnchor, rulesDate
SlotRoleOverride    deckId, cardKey, roleId, action (add|remove), createdAt            -- Prisma, per deck
CompletionSettings  deckId, pool, bracket, roles[], landCount (formula|current|fixed), perCardCap?, acquireBudget?, excludedCardKeys[]
CompletionProposal  inputsHash, rankingRuleVersion, rolesVersion, cardDataDate, seed?, slots[]{roleId?, kind (land|role|plan|flex),
                    target{min,max}?, lines[]{cardKey, availability (considering|free|committed|unowned), rolesFilled[],
                    reasons[], price?, unpriced, inclusion?{value, decks, eligible, date}}}, drops[], summary{before, after}
DeckChangeSetApply  id, deckId, kind (manaBase|completion|substitute), appliedAt, beforeSnapshotId, changeSet, inputsHash, revertedAt?   -- I-58 slice 16
```

`cardKey` is the card name until I-67 slice 2, then the Oracle ID.

- `POST /api/decks/[id]/completion/proposal` {settings, accepted[], seed?} returns a proposal. Owner-only, zero writes, rate-limited per user.
- `POST /api/decks/[id]/completion/substitute` {cardKey, pool} returns up to three substitutes.
- Apply and revert use I-58 slice 16's routes with `kind: completion` or `substitute`.
- After slice 13, `POST /api/completion/proposal` takes a guest or pasted list with the any-card pool, proposal only; picks are added one at a time through the editor's undoable add.
- Pure modules (`slotRolesOf`, `roleGaps`, `isLegalCandidate`, `proposeCompletion`, `proposeSubstitute`) import no I/O and no AI client.

## Non-goals

- A model choosing, ranking or checking a card in the default mode.
- Ordering by popularity, or showing inclusion or Lift as advice.
- Generating a deck from nothing, or choosing the commander. I-02 and [I-54](i54-find-your-next-commander.md) own those.
- Removing or changing a card the player chose.
- Land selection beyond basics; I-58 owns land lines.
- Buying; the plan hands off to I-06 and I-32.
- A public "decks you can complete" ranking; I-16 and I-75 own coverage across decks.

## Testing strategy

- **Roles (solitary, table-driven):** about 40 recorded cards map to their expected multi-labels, for example Cultivate (ramp), Swords to Plowshares (targeted interaction), Toxic Deluge (mass interaction), Mystic Remora (card draw), Demonic Tutor (tutor).
- **Targets:** every `RoleTarget` row equals the guide's table; a changed guide row without new data fails.
- **Legality (property-based):** no proposal holds a card outside identity, a banned card, a copy beyond `maxQuantity`, a Game Changer over the limit, an extra-turn or land-denial card at Brackets 1 to 3, or a companion breach.
- **Determinism:** the same inputs give byte-identical proposals; a different seed changes order only inside ties.
- **Pools:** owned-only never proposes an unowned card; free-only never a committed copy; an unpriced card never counts as zero; a chosen card is never removed.
- **Combos:** a recorded Spellbook reply with Thassa's Oracle and Demonic Consultation keeps the second piece out at Bracket 2; a failed lookup shows "combos not checked".
- **Pairs:** a partner pair gets 98 slots and the union identity; a Lurrus deck gets no permanent above mana value 2.
- **Apply (sociable, API and PostgreSQL):** the snapshot exists before rows change; a stale version gets 409; revert restores the deck; the proposal route makes zero writes, asserted against the Prisma client.
- **No AI:** an import test fails if the pure modules reach an AI client.
- **Report:** CI regenerates the fixture report and fails on an unrecorded change (13.3).
- **Wording and access:** the verdict-word scan on reason templates; the meter and slot list are readable by a screen reader, with role names in text ([I-49](i49-colour-vision-and-low-vision-display.md)).

## Delivery slices

| #   | Slice                                                                                                                                              | Depends on                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 0   | Owner answers D-88 (signals that may order candidates; model-free completion free per deck) and names the owner of role targets under D-64         | — (owner; no code)                                                 |
| 1   | Slot-role definitions as versioned data in I-65's format, Oracle-pattern and keyword clauses, `slotRolesOf`, 40-card fixture                       | I-65 slice 1                                                       |
| 2   | `RoleTarget` for Brackets 1 to 5 from the guide's tables, with labels, anchors and the consistency test; `roleGaps`                                | 1; I-28 slice 2                                                    |
| 3   | `isLegalCandidate` in format rules: identity, legality, copy limits, Game Changer limit, conservative classes below Bracket 4, companion           | I-28 slice 2                                                       |
| 4   | Owned pool: owned counts by name from `CollectionCard`, Considering cards, card data through the cache; "owned (may be in another deck)"           | —                                                                  |
| 5   | `proposeCompletion` with ranking rule v1, fill order, templated reasons in English and French, shortfall, basics by source target; read-only route | 0, 2, 3, 4; I-58 slice 4                                           |
| 6   | Two-card combo guard on the projected deck, at proposal and before apply                                                                           | 5                                                                  |
| 7   | Fixture set and before-and-after report as a CI gate                                                                                               | 5                                                                  |
| 8   | Review panel: role meter, slot by slot with alternatives, fill this role, fill the rest, summary                                                   | 5, 6                                                               |
| 9   | Apply and revert through the reviewed change set                                                                                                   | 8; I-58 slice 16                                                   |
| 10  | Owned substitute: engine, route and the deck-row action                                                                                            | 5, 9                                                               |
| 11  | Free copies first and the "free copies only" pool                                                                                                  | 5; I-16 slice 4                                                    |
| 12  | Per-card cap and budget to acquire (USD; EUR after I-32 slices 2 and 3)                                                                            | 5                                                                  |
| 13  | "Owned first" and "any card" pools from the local catalogue; guest and pasted proposals                                                            | 5; I-67 slice 2                                                    |
| 14  | Printings through I-57's resolver                                                                                                                  | 9; I-57 slice 2                                                    |
| 15  | "Another proposal" with a visible seed                                                                                                             | 5; I-21 slice 1                                                    |
| 16  | EDHREC inclusion column with sample and date, where I-09 holds it                                                                                  | 0, 8                                                               |
| 17  | Acceptance events and the owner view (group 12)                                                                                                    | 9; I-39 slices 10 and 12                                           |
| 18  | Measured norms replace Recommended ranges, per style and bracket, after owner approval                                                             | 2; I-68 slice 12                                                   |
| 19  | Model rewording of reasons with the post-check and label                                                                                           | 8; I-30 slices 1 and 2                                             |
| 20  | AI mode: numbered picks from the legal pool, re-checked, bench cases                                                                               | 13; I-02 slice 9; I-30 slices 1 and 2; I-70 slice 4                |
| 21  | Collection-wide allocation across decks (paid candidate)                                                                                           | 11; **Blocked** on I-30's decision gate (slice 0) and legal review |

Slice 4 can start now. Slice 1 waits for I-65 slice 1, which can start now; slices 2 and 3 wait for I-28 slice 2, which is in flight. Slices 5 to 10 give the owned-only completion and the substitute without I-67, because the owned pool is the collection itself. Slice 17 is Later because I-39's event store waits for I-39's legal slice 0.

## Open questions

1. **Which signals order candidates (D-88)?** Recommended: (a) deterministic facts only (5.2), inclusion as a labelled column, free per deck. (b) Lift as a tie-break needs a denominator the top-20 feed lacks. (c) the AI mode, later, inside the allowance and I-70's bench.
2. **Where do role targets come from?** Recommended: I-28's Recommended ranges now, measured norms later (3.5), with the guide's content owner under D-64 keeping both in step.
3. **How much does one run fill?** Recommended: slot by slot by default, a role at a time on request, everything only through "Fill the rest", always ending in a review. Master Duel added undo and settings about six months after its auto-build [6][7].
4. **Should completion cap a mana-value bucket as Hearthstone does [1]?** Not yet: no per-bracket curve shape is published in I-28's data. The average range stands in until I-28 or I-31 slice 11 measures one.
5. **May the inclusion column appear on a paid surface?** L-24 (h) asks whether EDHREC data must stay out of paid features (research, not legal advice). Recommended until answered: the column shows only in the free one-deck panel and never in slice 21.
6. **Do Considering and sideboard copies commit a card?** Recommended: no; only main and command zones (I-16 neighbour change). Lent copies join after [I-51](i51-cards-lent-and-borrowed.md) slice 13.
7. **Is recall good enough without Tagger tags?** Oracle patterns undercount roles (the guide's own research limits say spot removal is undercounted). The panel says "function tags unavailable: fewer cards recognised", as I-65 3.3 does, until L-22 is answered.

## Sources

1. Blizzard (Tian Ding), "Developer Insights: Smart Deck Builder", 2019-03-28, read 2026-11-11. <https://hearthstone.blizzard.com/en-us/news/22938500/developer-insights-smart-deck-builder>
2. Blizzard, "Let's Get Brewing with Deck Recipes!", 2016-03-08, read 2026-11-11. <https://hearthstone.blizzard.com/en-us/blog/20056279>
3. Second Dinner, "Patch Notes – Dec 05, 2023", read 2026-11-11. <https://marvelsnap.com/?p=31>
4. r/MarvelSnap, "The auto deck builder is the best addition to the game in months", 2024-01-17, 304 points and 50 comments through the Arctic Shift archive, read 2026-11-11. <https://www.reddit.com/r/MarvelSnap/comments/1997muq/>
5. r/MarvelSnap, "Is the auto deck builder messed up??", 2024-05-20, 108 points, and "Is the deck builder feature reliable?", 2025-08-14, through the Arctic Shift archive, read 2026-11-11. <https://www.reddit.com/r/MarvelSnap/comments/1cw2cjs/> · <https://www.reddit.com/r/MarvelSnap/comments/1mqcn84/>
6. Game8, Yu-Gi-Oh! Master Duel patch notes, version 2.1.0, last updated 2024-11-07 (fan source), read 2026-11-11. <https://game8.co/games/Yu-Gi-Oh-Master-Duel/archives/483223>
7. Master Duel Meta, v2.3.0 update, 2025-05-07 (fan source), read 2026-11-11. The owned-only, rarity and size settings named elsewhere are not on this page. <https://www.masterduelmeta.com/articles/news/may-7-2025/master-duel-leaks/>
8. r/mtg, "I made a tool that lets you build a commander deck in a few minutes", snapshot 2026-02-18 of a post about 266 days older, read 2026-11-11. <https://reddit.sentinel-team.org/posts/1r7ab6i/snapshots/2026-02-18T03%3A20%3A00.59355Z>
9. r/magicTCG, "Bulk Commander: Build EDH decks using the cards you already own (now with deck composition tracking)", snapshot 2026-02-08 of a post about 275 days older, read 2026-11-11. <https://reddit.sentinel-team.org/posts/1qzhc5k/snapshots/2026-02-08T22%3A52%3A12.074304Z>
10. Playgroup.gg, Commander deck builder, undated, seen 2026-11-11. <https://playgroup.gg/commander/deck-builder>
11. Grimoria help, "Card suggestions", v2.3.51 (2026111002), seen 2026-11-11. <https://www.grimoria.app/help/deckbuilder/card-suggestions>
12. Untap AI, US App Store, version 1.0 of May 26 to 1.0.2 of June 3 (year not shown; © 2026), seen 2026-11-11. <https://apps.apple.com/app/id6768833564>
13. Deckbox, Premium page, undated, seen 2026-11-11. <https://deckbox.org/premium>

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player with a commander and part of a deck asks the product to finish it, reviews the proposals slot by slot (owned and free copies first, each with its role and reason, inside colour identity, legality, the target bracket and the budget), applies them as one reviewed change and reverts it in one action; any missing card in a deck, precon copy or import offers an owned card that does the same job.

### Goals

- A player with a commander, 40 chosen cards and an imported collection presses "Complete", accepts proposals slot by slot, each naming its role, the bracket's range and whether a free copy is owned, applies them as one change that keeps the deck inside its bracket's hard rules, and reverts it in one action; a missing Rhystic Study offers up to three owned cards that draw cards, each with its reason.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-76-01

As a player with a half-built deck, I want the open slots filled from cards I own, so that I can accept or reject each line.

#### US-76-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-76-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-76-01 Happy path

Given a signed-in player and the English locale
When every proposed line names the role and the owned card.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-76-02 Happy path

Given a signed-in player and the English locale
When nothing is written until the player applies.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-76-03 Happy path

Given a signed-in player and the English locale
When apply and revert are one change set.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-76-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-76-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-76-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in, because it reads the collection. Guests do not see it. The AI mode, later, counts against I-02's allowance and stays off.

#### AC-76-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-76-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-76-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The proposal is a list beside the deck, not a new deck. A slot with no owned card says so and points at the acquisition plan.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Role targets are data. Candidates are legal for the commander. The default mode does not call a model. Apply uses I-58's change set.

### Analytics and telemetry

`completion_applied {lines: count, unowned: count}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in, because it reads the collection. Guests do not see it. The AI mode, later, counts against I-02's allowance and stays off.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Which signals may order candidates is D-88. A full 100-card list generated from the collection stays I-16's non-goal.

### Sources

- https://hearthstone.blizzard.com/en-us/news/22938500/developer-insights-smart-deck-builder

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-76-101

As a player, I want the product to owner decisions first: which signals may order candidates and whether model-free completion is free per deck (D-88), and who owns the role targets per bracket (D-64) (slice 0)., so that a player with a commander and part of a deck asks the product to finish it, reviews the proposals slot by slot (owned and free copies first, each with its role and reason, inside colour identity, legality, the target bracket and the budget), applies them as one reviewed change and reverts it in one action; any missing card in a deck, precon copy or import offers an owned card that does the same job.

#### AC-76-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Owner decisions first: which signals may order candidates and whether model-free completion is free per deck (D-88), and who owns the role targets per bracket (D-64) (slice 0).

#### AC-76-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-76-102 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-76-102

As a player, I want the product to slot roles as versioned data in I-65 slice 1's format, several per card, which the owner may add or remove per deck (slice 1); role targets per bracket from I-28's Recommended ranges, stored once, with a test that fails when the guide and the data differ (slice 2); isLegalCandidate in format rules: identity, legality, copy limits, the Game Changer limit, conservative extra-turn and land-denial classes below Bracket 4, and the companion (slice 3)., so that a player with a commander and part of a deck asks the product to finish it, reviews the proposals slot by slot (owned and free copies first, each with its role and reason, inside colour identity, legality, the target bracket and the budget), applies them as one reviewed change and reverts it in one action; any missing card in a deck, precon copy or import offers an owned card that does the same job.

#### AC-76-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Slot roles as versioned data in I-65 slice 1's format, several per card, which the owner may add or remove per deck (slice 1); role targets per bracket from I-28's Recommended ranges, stored once, with a test that fails when the guide and the data differ (slice 2); isLegalCandidate in format rules: identity, legality, copy limits, the Game Changer limit, conservative extra-turn and land-denial classes below Bracket 4, and the companion (slice 3).

#### AC-76-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-76-105 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-76-103

As a player, I want the product to the owned pool from CollectionCard, by name until I-67's Oracle IDs (slice 4); proposeCompletion with ranking rule v1 (availability, roles below their minimum, plan fit, curve fit, colour demand, price, then name), lands first, then roles, plan and flex slots, a reason in English and French on every line, and a read-only route (slice 5); the two-card combo guard below Bracket 4, at proposal and before apply (slice 6); twelve partial fixture decks and a before-and-after report as a CI gate on any ranking change (slice 7)., so that a player with a commander and part of a deck asks the product to finish it, reviews the proposals slot by slot (owned and free copies first, each with its role and reason, inside colour identity, legality, the target bracket and the budget), applies them as one reviewed change and reverts it in one action; any missing card in a deck, precon copy or import offers an owned card that does the same job.

#### AC-76-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: The owned pool from CollectionCard, by name until I-67's Oracle IDs (slice 4); proposeCompletion with ranking rule v1 (availability, roles below their minimum, plan fit, curve fit, colour demand, price, then name), lands first, then roles, plan and flex slots, a reason in English and French on every line, and a read-only route (slice 5); the two-card combo guard below Bracket 4, at proposal and before apply (slice 6); twelve partial fixture decks and a before-and-after report as a CI gate on any ranking change (slice 7).

#### AC-76-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-76-108 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-76-104

As a player, I want the product to the review panel: a role meter, slot by slot with up to four alternatives, "Fill this role" and "Fill the rest" as explicit buttons, and a before-and-after summary (slice 8); apply and revert through I-58 slice 16's reviewed change set (slice 9); the owned substitute for one missing card, which I-06's missing-card panel, I-17's working copies and I-62's import report call (slice 10)., so that a player with a commander and part of a deck asks the product to finish it, reviews the proposals slot by slot (owned and free copies first, each with its role and reason, inside colour identity, legality, the target bracket and the budget), applies them as one reviewed change and reverts it in one action; any missing card in a deck, precon copy or import offers an owned card that does the same job.

#### AC-76-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: The review panel: a role meter, slot by slot with up to four alternatives, "Fill this role" and "Fill the rest" as explicit buttons, and a before-and-after summary (slice 8); apply and revert through I-58 slice 16's reviewed change set (slice 9); the owned substitute for one missing card, which I-06's missing-card panel, I-17's working copies and I-62's import report call (slice 10).

#### AC-76-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-76-111 Edge

Given a list where one name does not resolve
When the player confirms
Then the unresolved name is shown first and nothing is written until they accept that list

#### US-76-105

As a player, I want the product to free copies first and a "free copies only" pool (slice 11); a per-card cap and a budget to acquire (slice 12); "owned first" and "any card" pools from I-67's catalogue, with guest and pasted proposals (slice 13); printings through I-57 (slice 14); "Another proposal" with a visible seed (slice 15); EDHREC inclusion as a labelled column with its sample, never the order (slice 16)., so that a player with a commander and part of a deck asks the product to finish it, reviews the proposals slot by slot (owned and free copies first, each with its role and reason, inside colour identity, legality, the target bracket and the budget), applies them as one reviewed change and reverts it in one action; any missing card in a deck, precon copy or import offers an owned card that does the same job.

#### AC-76-112 Happy path

Given a guest with one unsaved session deck
When the player uses this behaviour
Then the behaviour holds: Free copies first and a "free copies only" pool (slice 11); a per-card cap and a budget to acquire (slice 12); "owned first" and "any card" pools from I-67's catalogue, with guest and pasted proposals (slice 13); printings through I-57 (slice 14); "Another proposal" with a visible seed (slice 15); EDHREC inclusion as a labelled column with its sample, never the order (slice 16).

#### AC-76-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-76-114 Edge

Given a list where one name does not resolve
When the player confirms
Then the unresolved name is shown first and nothing is written until they accept that list

#### US-76-106

As a player, I want the product to later: count-only acceptance events through I-39 (slice 17); measured norms in place of ranges after the owner approves them (slice 18); model rewording of reasons with a post-check (slice 19); an AI mode that picks numbered cards from the legal pool, re-checked by code and scored on I-70's bench (slice 20); the collection-wide allocation of owned copies across decks, a paid candidate (slice 21)., so that a player with a commander and part of a deck asks the product to finish it, reviews the proposals slot by slot (owned and free copies first, each with its role and reason, inside colour identity, legality, the target bracket and the budget), applies them as one reviewed change and reverts it in one action; any missing card in a deck, precon copy or import offers an owned card that does the same job.

#### AC-76-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Later: count-only acceptance events through I-39 (slice 17); measured norms in place of ranges after the owner approves them (slice 18); model rewording of reasons with a post-check (slice 19); an AI mode that picks numbered cards from the legal pool, re-checked by code and scored on I-70's bench (slice 20); the collection-wide allocation of owned copies across decks, a paid candidate (slice 21).

#### AC-76-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-76-117 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a player with a commander and part of a deck asks the product to finish it, reviews the proposals slot by slot (owned and free copies first, each with its role and reason, inside colour identity, legality, the target bracket and the budget), applies them as one reviewed change and reverts it in one action; any missing card in a deck, precon copy or import offers an owned card that does the same job.

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

## I-76: Complete This Deck From My Collection

**Spec:** [`specs/i76-complete-this-deck-from-my-collection.md`](i76-complete-this-deck-from-my-collection.md)

**Outcome:** a player with a commander and part of a deck asks the product to finish it, reviews the proposals slot by slot (owned and free copies first, each with its role and reason, inside colour identity, legality, the target bracket and the budget), applies them as one reviewed change and reverts it in one action; any missing card in a deck, precon copy or import offers an owned card that does the same job.

**Status:** Next
**Priority:** Next for slices 0 to 16, the model-free completion and the owned substitute, directly after I-58 because it applies through I-58's reviewed change set; Later for slices 17 to 21 (events, measured norms, model wording, the AI mode and the collection-wide allocation), which wait for I-39, I-68, I-30 and I-02. Completing one deck and every substitute stay free; the collection-wide allocation is an I-30 candidate
**Impact / effort:** High / large
**Depends on:** nothing for slice 4; the owner's answer to D-88 (slice 0); I-65 slice 1 for slot roles (slice 1); I-28 slice 2 for role targets (slice 2) and legal candidates (slice 3); I-58 slice 4 for basics by source target (slice 5); I-58 slice 16, the reviewed change set, for apply and revert (slice 9); I-16 slice 4 for free copies (slice 11); I-67 slice 2 for the "any card" pool (slice 13); I-57 slice 2 for printings (slice 14); I-21 slice 1, which already moves ahead of I-21's Later priority, for the seed (slice 15); I-39 slices 10 and 12 for events (slice 17); I-68 slice 12 for measured norms (slice 18); I-30 slices 1 and 2 for model wording and the AI mode, with I-02 slice 9 and I-70 slice 4 for the AI mode (slices 19 and 20); I-30's decision gate and legal review for the allocation (slice 21).

Nothing fills the remaining slots of the player's own deck. No file under `src/app/api/ai/` or `src/lib/ai/` reads `CollectionCard`, and `getCardCollection` in the suggest route is Scryfall's `/cards/collection` lookup, not ownership; `collectionOnly` toggles in `SearchFilters.tsx`, but no code filters by it; `findCheaperAlternatives` (`src/lib/deck/pricing.ts`) is imported only by its test (checked on `dev` at `2cf792e8`). Other card games ship this. Hearthstone's "Complete My Deck" fills a partial deck "using only cards from your existing collection", reluctant to overfill a mana-cost bucket, and repeated clicks vary the proposal only from an empty deck ([Blizzard](https://hearthstone.blizzard.com/en-us/news/22938500/developer-insights-smart-deck-builder), 2019-03-28). Marvel Snap finishes a deck "from 0 to 11" chosen cards, "taking your collection into account" (2023-12-05), and a 304-point thread called it "the best addition to the game in months". Master Duel added undo and settings about six months after its auto-build. Under an r/mtg Commander generator, the reply that it would "skip the fun, satisfying part of edh" drew 336 points, so the fill goes slot by slot by default and "Fill the rest" is an explicit button. Untap AI sells "Complete-your-deck suggestions" at 4.99 USD a month. No home existed: [I-16](i16-decks-buildable-from-a-collection.md) ranks whole lists by coverage and leaves "a full 100-card list from the collection" to I-02, which never reads the collection; [I-58](i58-mana-base-builder.md) fills lands only; [I-17](i17-precon-path-and-tiered-upgrades.md)'s bundles are editorial swaps.

### Scope

- [ ] Owner decisions first: which signals may order candidates and whether model-free completion is free per deck ([D-88](../owner-decisions.md#product-scope-and-non-goals)), and who owns the role targets per bracket ([D-64](../owner-decisions.md#content-and-naming)) (slice 0).
- [ ] Slot roles as versioned data in [I-65](i65-how-this-deck-wins.md) slice 1's format, several per card, which the owner may add or remove per deck (slice 1); role targets per bracket from [I-28](i28-commander-deckbuilding-guide-by-bracket.md)'s Recommended ranges, stored once, with a test that fails when the guide and the data differ (slice 2); `isLegalCandidate` in format rules: identity, legality, copy limits, the Game Changer limit, conservative extra-turn and land-denial classes below Bracket 4, and the companion (slice 3).
- [ ] The owned pool from `CollectionCard`, by name until I-67's Oracle IDs (slice 4); `proposeCompletion` with ranking rule v1 (availability, roles below their minimum, plan fit, curve fit, colour demand, price, then name), lands first, then roles, plan and flex slots, a reason in English and French on every line, and a read-only route (slice 5); the two-card combo guard below Bracket 4, at proposal and before apply (slice 6); twelve partial fixture decks and a before-and-after report as a CI gate on any ranking change (slice 7).
- [ ] The review panel: a role meter, slot by slot with up to four alternatives, "Fill this role" and "Fill the rest" as explicit buttons, and a before-and-after summary (slice 8); apply and revert through [I-58](i58-mana-base-builder.md) slice 16's reviewed change set (slice 9); the owned substitute for one missing card, which I-06's missing-card panel, I-17's working copies and I-62's import report call (slice 10).
- [ ] Free copies first and a "free copies only" pool (slice 11); a per-card cap and a budget to acquire (slice 12); "owned first" and "any card" pools from I-67's catalogue, with guest and pasted proposals (slice 13); printings through I-57 (slice 14); "Another proposal" with a visible seed (slice 15); EDHREC inclusion as a labelled column with its sample, never the order (slice 16).
- [ ] Later: count-only acceptance events through I-39 (slice 17); measured norms in place of ranges after the owner approves them (slice 18); model rewording of reasons with a post-check (slice 19); an AI mode that picks numbered cards from the legal pool, re-checked by code and scored on I-70's bench (slice 20); the collection-wide allocation of owned copies across decks, a paid candidate (slice 21).

### Engineering enablers

- The same deck version, collection, settings, definitions and seed give the same proposal byte for byte; a different seed reorders only ties.
- Property tests: no proposal holds a card outside the identity, a banned card, an extra copy, a Game Changer over the limit, an extra-turn or land-denial card at Brackets 1 to 3, or a companion breach, and no chosen card is removed.
- The proposal route makes zero writes, asserted against the Prisma client; apply takes a snapshot before rows change, and a stale deck gets 409.
- An import test fails if `slotRolesOf`, `roleGaps`, `isLegalCandidate`, `proposeCompletion` or `proposeSubstitute` reach an AI client or I/O.

**Paid-tier angle:** model-free completion of one deck, the substitutes, reasons, review, apply, revert and the role meter are free, because building is free under I-30 1.1. The AI mode and model wording count against I-02's allowance. The candidate is the collection-wide allocation, which gives each owned copy to one deck and then finds the cheapest purchase that completes every deck; Deckbox sells "Build decks from your real inventory" and no tool read allocates copies across decks, so the case is unproven.

### Enrichment (2026-11-11)

**User story.** As a player with a half-built deck, I want the open slots filled from cards I own, so that I can accept or reject each line.

**Acceptance.**
- Every proposed line names the role and the owned card.
- Nothing is written until the player applies.
- Apply and revert are one change set.

**UX.** The proposal is a list beside the deck, not a new deck. A slot with no owned card says so and points at the acquisition plan.

**Data and API.** Role targets are data. Candidates are legal for the commander. The default mode does not call a model. Apply uses I-58's change set.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `completion_applied {lines: count, unowned: count}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in, because it reads the collection. Guests do not see it. The AI mode, later, counts against I-02's allowance and stays off.

**Open questions.** Which signals may order candidates is D-88. A full 100-card list generated from the collection stays I-16's non-goal.

### Definition of done

A player with a commander, 40 chosen cards and an imported collection presses "Complete", accepts proposals slot by slot, each naming its role, the bracket's range and whether a free copy is owned, applies them as one change that keeps the deck inside its bracket's hard rules, and reverts it in one action; a missing Rhystic Study offers up to three owned cards that draw cards, each with its reason.

---

