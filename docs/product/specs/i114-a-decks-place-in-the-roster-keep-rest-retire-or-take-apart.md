# I-114: A Deck's Place In The Roster: Keep, Rest, Retire Or Take Apart

> **Initiative:** I-114, proposed for the [roadmap](../roadmap.md) · **Status:** Next — proposed 2026-11-20 · **Priority:** Next for slices 1 to 3 (the stage rules, `Deck.stage` with its three readers, the dialogs and the retired shelf), after the numbered Next band, because they correct how shipped modules count; Later for slices 4 to 6 (the review and its hand-offs). Slice 2 waits for [D-107](../owner-decisions.md#product-scope-and-non-goals) · **Paid:** never · **Written 2026-11-20**
> **Placement:** a state each deck carries and the counting rules it changes. [I-01](i01-deck-editor-workflow.md) slice 13 plans an archive that hides a deck but does not say what it still counts for. [I-43](i43-physical-collection-storage-and-pull-lists.md) owns the physical act (where copies are, the put-back list, "built" as a box pairing). [I-60](i60-player-stats-and-year-in-review.md) owns statistics and writes nothing to a deck. [I-16](i16-decks-buildable-from-a-collection.md) and [I-06](i06-collection-and-purchase-planning.md) own the commitment index and the acquisition plan, which read every deck forever.
> **Research:** one dated note of 2026-11-20 (angle R5, money, time and deck lifecycles), not committed, so every external fact links its entry in [Sources](#sources). Reddit scores are Arctic Shift snapshots read 2026-11-20. Legal points are research, not legal advice.
> **Owns:** the stage vocabulary (in rotation, resting, retired), its counting rules, the stage change with its preview, the retired shelf, and the private review page with the owner's verdicts. **Does not own:** hiding and deletion ([I-01](i01-deck-editor-workflow.md)); places and pull lists ([I-43](i43-physical-collection-storage-and-pull-lists.md)); the commitment index ([I-16](i16-decks-buildable-from-a-collection.md)); the acquisition plan ([I-06](i06-collection-and-purchase-planning.md)); spares ([I-45](i45-selling-spare-cards.md)); games ([I-35](i35-pod-game-log.md)); statistics ([I-60](i60-player-stats-and-year-in-review.md)); snapshots and history ([I-37](i37-editor-depth.md)); a deck handed to another account ([I-108](i108-decks-built-for-someone-else-the-brief-and-the-handover.md)); a project across decks ([I-113](i113-a-project-across-my-own-decks-the-32-colour-identities-and-other-slot-grids.md)).

**Proposed changes to neighbours, for the integrator:**

| Initiative       | Change                                                                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| I-01             | Slice 13's archive either becomes I-114's "retired" stage or adopts its counting rules (D-107). Recorded as a dated line on I-01.                                                          |
| I-06, I-16, I-45 | The acquisition plan, the commitment index and spares read the stage: a retired deck commits no copy and asks for no card; a resting deck keeps its copies and leaves the plan by default. |
| I-60             | 3.1's "active decks" may read the stage; no change to the recap's tone rules.                                                                                                              |
| I-18, I-73       | Notices and the set digest read only decks in rotation unless the player includes resting ones (the R5 note's SL8, recorded on both).                                                      |
| I-43             | Its pairing ("physically built") and this file's stage ("still played") are two different facts. Recorded as a dated line on I-43.                                                         |

## Overview

The largest thread of the R5 angle: "I had too many decks, and it was stressing me out ..." (319 points, 182 comments, 2026-10-11) [1]. The poster had 18 decks: "The decks want tweaking and revising. They want new cards. They want to be played. There were three decks I hadn't even played against others once!" They kept "a nice little spot in my binder for 'retired' commanders", kept the tuned lists online "so I can always recreate them", and "Taking apart Damia, Marchesa and Sakashima freed up _so many_ cards" [1]. 19 r/EDH titles have contained "too many decks" since 2025-01-01, among them "How many commander decks is too many?" (96 points, 184 comments) [2].

Players decide by hand. "How do you all decide to dismantle a deck?" drew a top comment at 94 points about a columnist who "reviews them and decides which ones to keep and which ones to cut", and a second at 60: "Make a list. Play them. Rate them. Cut them." [3]. "Just soft retire some them" (16) and "I try to rotate them" (97) answer a player who plays once or twice a month [3]. "Deck of the Month Challenge made me happier with my decks" (66 points, 2025-12-26) sorted decks into "happy with", "okay with" and "unhappy with" and worked on one a month [4]. Card Kingdom's yearly "Commander Class of" column names five fates in one article: kept, shelved, retired, taken apart and given away [5]. EDHREC's "When To Dismantle Your Commander Deck" (2026-01-28) gives money, fun and fit as reasons [5]. Archidekt's archived moderator proposal "[Collection] Mark decks as not part of Collection" (49 points) asked to mark decks "not papered" [6].

The product counts every deck forever. A retired deck keeps its copies committed, keeps asking for its missing cards, and keeps appearing in the "used in" list.

This initiative gives each deck one stage the owner sets (in rotation, resting or retired), says before saving what the change does to the collection's counts, and offers a private review page where the player sets their own verdicts, with the facts and denominators beside them.

**Why a new initiative.** No file owns "decide which of my decks stay in play, and make the product count them accordingly"; I-01 hides, I-43 moves cards, I-60 counts. **Why Next for slices 1 to 3.** They correct how shipped modules count (the acquisition plan and the commitment index, #1616); the review is Later.

## What the market does

All rows were read on 2026-11-20 unless dated otherwise.

| Product or source        | What it does or says                                                                                      | Source    |
| ------------------------ | --------------------------------------------------------------------------------------------------------- | --------- |
| **r/EDH**                | 319 / 182 on too many decks; 19 "too many decks" titles since 2025-01-01; how players decide to dismantle | [1][2][3] |
| **Deck of the month**    | A review habit: decks sorted "happy with", "okay with", "unhappy with", one worked on per month           | [4]       |
| **Card Kingdom, EDHREC** | A yearly review column naming five fates; an article on when to dismantle                                 | [5]       |
| **Archidekt**            | An archived request to mark decks "not papered" (49 points); an undocumented `theorycrafted` field        | [6]       |
| **TopDecked**            | Archives and colour-codes decks (already on I-01)                                                         | —         |

**The gap.** No product found offers a stage that changes how the collection counts, or a review of a player's decks: "not found", not "absent".

## Current state in this codebase

Verified on `dev` at `c88bdc7d` (#1631) on 2026-11-20:

- **No lifecycle field** on `Deck` (`prisma/schema.prisma`, lines 141 to 191).
- **Every deck counts forever.** The acquisition plan reads every deck the player owns (`prisma.deck.findMany` in `src/app/api/collection/acquisition-plan/route.ts`, line 25). The commitment index commits every main and command-zone copy: "One owned copy used by three decks is free in none of them" (`src/lib/collection/commitment-index.ts`, header; I-16 slice 4, #1616). The usage route reads every deck (`src/app/api/collection/usage/route.ts`).
- **Planned, not built:** I-01 slice 13's archive; I-43's pairing, put-back list and dismantling; I-60's "not played since"; I-35's `durationMinutes` and per-seat `funRating`.

**Owning context:** the deck context for `Deck.stage`; the collection context's index and plan read it through the deck context's public entry point.

## Functional requirements

### 1. Principles

1.1 The product never recommends which deck to cut, never orders decks by a score, and never uses buy or sell words on these pages (I-59 8.4's deny-list).
1.2 A stage change is reversible and previewed. Nothing is deleted.
1.3 A review fact always carries its denominator ("2 games in the last 12 months").

### 2. Stages and counting

2.1 In rotation (default), resting, retired.
2.2 Retired: commits no copy in I-16's index, leaves I-06's plan, keeps its list to be rebuilt. Resting: keeps its copies, leaves the plan unless the player keeps it in.
2.3 A retire takes an automatic snapshot (I-37 9.3's pattern).

### 3. Dialogs and the shelf

3.1 The retire and rest dialogs state, before saving, how many copies become free, how many plan lines leave, and that freed copies count as spares in I-45's list unless kept, with one-click "keep the commander".
3.2 Restore previews the copies now committed elsewhere.
3.3 The retired shelf lists retired decks with their dates, last list and the owner's note.

### 4. The review

4.1 A private page lists decks in rotation and resting with facts from shipped modules: created, last changed, cards committed that another deck or the plan wants, and the closest other deck by shared cards (`src/lib/deck/comparison.ts`). Once I-35 ships: last played, games in 12 months and the player's own average fun rating, labelled "self-reported casual games".
4.2 A roster target the player sets ("12 in rotation, your target 7"), and verdicts in the player's own words (happy with it, work on it, rest it, retire it); "work on it" only marks the deck and sends no reminder.
4.3 Stage changes apply in one batch with undo. The default order is by name.

### 5. Free and paid

| Part          | Free | Paid candidate | Why                                                                    |
| ------------- | ---- | -------------- | ---------------------------------------------------------------------- |
| Stages, shelf | Yes  | —              | The player's own data (I-30 1.2)                                       |
| The review    | Yes  | —              | The companion of I-60's free recap; a personal tool, but proposed free |

## Data model / API

```
Deck.stage           inRotation | resting | retired (default inRotation)
Deck.stageChangedAt  DateTime?
StageRules           commitsCopies, feedsPlan, inPickers, countsAsActive    -- per stage, as data
RosterVerdict        deckId, verdict: happy | workOnIt | rest | retire, setAt   -- private to the owner
```

- `stageRules(stage)` is pure; `Stage` is a discriminated union with an exhaustive `never` guard.
- `PATCH /api/decks/[id]/stage` (preview with `?dryRun=1`, then commit). A stage change and its snapshot are one transaction; a batch from the review is one transaction with an undo token.

## Non-goals

- A recommendation of which deck to cut, a score, or buy or sell words.
- A reminder to review by default; at most one dismissible card in I-60's December window, if the owner decides it.
- Deletion: retiring is reversible; deletion stays I-01's trash.
- A marketplace listing of a retired deck ([I-45](i45-selling-spare-cards.md), [I-33](i33-marketplace-ladder.md)).
- A public "graveyard" by default.
- Handing a deck to another account ([I-108](i108-decks-built-for-someone-else-the-brief-and-the-handover.md)).
- A goal over many decks ([I-113](i113-a-project-across-my-own-decks-the-32-colour-identities-and-other-slot-grids.md)).

## Testing strategy

- **Rules (solitary):** a retired stage commits no copy and feeds no plan; a resting stage commits copies and feeds no plan by default.
- **Readers (sociable):** with one Sol Ring used only by deck A, retiring A makes the index count it free and the plan list nothing for A; A's list is unchanged.
- **Preview (sociable):** the dry run writes nothing; cancelling writes nothing.
- **Tone (CI):** no review string contains "cut", "sell", "worst" or their French forms.
- **Red first:** slice 2's first Red: after `PATCH stage=retired` on deck A, the acquisition plan still lists A's missing cards today.

## Delivery slices

| #   | Slice                                                                                                                                                                  | Depends on                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 1   | The stage vocabulary and its counting rules as data; a pure `stageRules` with fixtures (which stages commit copies, feed the plan, appear in pickers, count as active) | None                           |
| 2   | `Deck.stage` and `stageChangedAt`, an owner route, a library filter, and the three readers changed (plan, index, usage); a snapshot on retire                          | 1; D-107                       |
| 3   | The retire and rest dialogs with their preview, restore with its preview, and the retired shelf, in `en` and `fr`                                                      | 2                              |
| 4   | The review page: facts from shipped modules, a roster target, the owner's verdicts, batch changes with undo                                                            | 3                              |
| 5   | After I-35 slice 6: last played, games in 12 months and the average fun rating on the review, labelled "self-reported casual games"                                    | 4; I-35 slice 6                |
| 6   | After I-43 slice 6: retire hands off to the put-back list, restore to the pull list; after I-108: a "given away" stage that offers, row by row, to remove copies       | 3; I-43 slice 6; I-108 slice 1 |

Slice 1 can start now: it is pure and needs no migration.

## Open questions

1. **Archive** (D-107). Merge I-01 slice 13's archive into "retired", or keep archive as a separate "hidden" switch? Recommended: merge, so one action both hides and releases copies.
2. **Resting and the plan** (D-107). Should resting decks leave the acquisition plan by default? Recommended: yes, with "include resting decks" one click away.
3. **A December invitation.** Is a review card beside I-60's recap acceptable, or is the review on demand only? Recommended: on demand only until the owner decides.
4. **A public retired section.** Recommended: never by default; one deck at a time by the owner's action.
5. **"Given away".** Remove copies from the collection, or only mark them? Recommended: offer row by row.
6. **An idea stage.** Should a stage before "in rotation" (a brew never built, which commits no copies) exist, as Archidekt's "not papered" request asks, or is I-43's pairing the only "built" fact?

## Sources

Read on 2026-11-20 unless stated otherwise. Reddit scores are Arctic Shift snapshots.

1. r/EDH, "I had too many decks, and it was stressing me out ...", 2026-10-11, 319 points, 182 comments (verified on 2026-11-20 with the User-Agent `MagicAIBuilder/1.0 (+https://magic-ai-builder.vercel.app)`). <https://www.reddit.com/r/EDH/comments/1x2um80/>
2. r/EDH, Arctic Shift `title=too many decks`, `after=2025-01-01` (19 titles): "How many commander decks is too many?", 2025-05-14, 96 / 184, <https://www.reddit.com/r/EDH/comments/1km3gau/>; "How many decks is too many decks ?", 2025-12-25, 32 / 89, <https://www.reddit.com/r/EDH/comments/1pvajku/>.
3. r/EDH: "I have too many decks", 2026-05-28, 50 / 85, <https://www.reddit.com/r/EDH/comments/1tptwzq/>; "Am I maintaining too many decks for my play frequency?", 2025-09-30, 45 / 79, <https://www.reddit.com/r/EDH/comments/1ntz14n/>; "For those who had too many commander decks, how did you manage to cut down the number eventually?", 2025-07-07, 49 / 97, <https://www.reddit.com/r/EDH/comments/1ltme8o/>; "What is your criteria for taking apart decks?", 2026-06-26, 21 / 44, <https://www.reddit.com/r/EDH/comments/1ufs7fn/>.
4. r/EDH, "Deck of the Month Challenge made me happier with my decks", 2025-12-26, 66 points. <https://www.reddit.com/r/EDH/comments/1pw44ce/>
5. Card Kingdom, Kristen Gregory, "Commander Class of 2025", 2025-12-16, <https://blog.cardkingdom.com/commander-class-of-2025/>, and "What's the Perfect Number of Commander Decks?", 2025-09-26, <https://blog.cardkingdom.com/whats-the-perfect-number-of-commander-decks/>; EDHREC, Josh Nelson, "When To Dismantle Your Commander Deck", 2026-01-28, <https://edhrec.com/articles/when-to-dismantle-your-commander-deck>.
6. Archidekt forum, "[Collection] Mark decks as not part of Collection", thread 2320932, 49 points, edited 2024-04-01, archived. <https://archidekt.com/forum/thread/2320932>

## Feature contract (Full, 2026-11-20)

The roadmap entry is a link. This section is the player contract. The engineering slices above stay the build plan.

### Summary and problem

A player with many decks cannot tell the product that a deck is resting, retired or taken apart, so retired decks keep their cards locked and keep asking for purchases, and the player decides what to cut from memory. Evidence: a 319-point thread, 19 "too many decks" titles since 2025-01-01, a yearly column, read 2026-11-20 [1][2][5].

### Goals

- Each deck carries one stage the owner sets; a change says what it does to the collection's counts before it is saved.
- Retired decks release their copies and leave the plan; resting decks keep copies and leave the plan by default.
- A private review page with facts and denominators, the player's own verdicts, and batch changes with undo.
- A retired shelf from which a deck is restored.

### Non-goals

- Advice to cut, scores, sell words; reminders; deletion; selling; a public graveyard; handing over (I-108); projects (I-113).

### Personas

The collector and budget player (primary); the casual pod player. See the roadmap persona table.

### User stories

#### US-114-01

As a player with 18 decks, I want to retire the ones I am done with without deleting them, so that their cards count as free for my new decks and I can rebuild them later.

#### US-114-02

As a player who plays twice a month, I want one page that shows when I last played each deck and what it holds that my other decks need, so that I decide myself which to take apart.

#### US-114-03

As a player keeping a deck built but not playing it, I want to rest it, so that it stops asking for upgrades without losing its cards.

#### US-114-04

As a player who works on one deck a month, I want to mark each deck "happy with it" or "work on it", so that I pick the month's deck from my own list.

### Acceptance criteria

#### AC-114-01 Happy path

Given a player who owns one Sol Ring, used only by deck A
When A is retired
Then I-16's index counts the copy as free, the acquisition plan lists no card for A, and A's list is unchanged

#### AC-114-02 Error and failure

Given a stage change that fails to save
When the player retries or leaves
Then the stage, the index and the plan are as they were, and the message is a catalogue string

#### AC-114-03 Preview before saving

Given a retire action
When the player opens it
Then the dialog states how many copies become free, how many plan lines leave, and that freed copies count as spares unless kept, with one-click "keep the commander"; cancelling writes nothing

#### AC-114-04 Guest and signed-in

Given the rollout
When a guest opens a public deck that is retired, and its owner opens their library
Then the guest sees the public deck as before with no stage shown, and the owner sees the stage and the library filter

#### AC-114-05 Locales

Given the ten catalogs `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt`
When this feature adds a user-facing string
Then only `en` and `fr` are routed, and the other eight keep key parity with `en` and may reuse the English text until a person reviews them

#### AC-114-06 Accessibility

Given a keyboard, a visible focus and a screen reader
When the player sets a stage or a verdict without a pointer
Then each control has a name, the preview is announced before confirmation, and the stage is a word, not a colour

#### AC-114-07 Rest keeps copies

Given deck C set to resting
When the acquisition plan opens
Then C's missing cards are absent unless "include resting decks" is on, and C's copies stay committed

#### AC-114-08 Review without advice

Given 12 decks in rotation and a roster target of 7
When the review opens
Then each row shows its facts with denominators, the default order is by name, no row is labelled "cut", "sell" or "worst" by the product, and the target line reads "12 in rotation, your target 7"

#### AC-114-09 Restore

Given a retired deck whose cards went to other decks
When the player restores it
Then the preview lists the copies now committed elsewhere, and after restoring the deck is in rotation with its last list

### UX flow and states

A deck's menu offers "Rest" and "Retire". The library filters by stage. "Retired decks" is a shelf. "Review my decks" is a table of facts with a verdict column and a roster target.

- Empty: "No retired decks."
- Loading: a busy state that keeps the table still.
- Error: a failed change keeps the last confirmed stage.
- Partial: game facts read "not yet available" until I-35 slice 6 ships.

### Data model and API

The types in [Data model / API](#data-model--api).

### Analytics and telemetry

`deck_stage_changed {from, to, viaReview}`, `roster_review_opened {decksInRotation}`. Reserved for I-39's store. Counts and enums only.

### Rollout and feature flags

Owner-only. Behind an I-69 switch, `decks.stages`, on with slice 3; slice 2's readers change only when the switch is on.

### Dependencies

[D-107](../owner-decisions.md#product-scope-and-non-goals); [I-16](i16-decks-buildable-from-a-collection.md) slice 4 (done, #1616); [I-06](i06-collection-and-purchase-planning.md)'s plan (shipped); [I-60](i60-player-stats-and-year-in-review.md) slices 1 and 2 (done); [I-01](i01-deck-editor-workflow.md) slices 12 and 13; [I-37](i37-editor-depth.md) 9; [I-35](i35-pod-game-log.md) slice 6; [I-43](i43-physical-collection-storage-and-pull-lists.md) slices 4 and 6; [I-108](i108-decks-built-for-someone-else-the-brief-and-the-handover.md) slice 1; [I-59](i59-prices-over-time-and-alerts.md) 8.4.

### Risks and mitigations

- **A review read as advice to sell.** Mitigation: no product verdict, order by name, a deny-list test.
- **Four modules' counting changed.** Mitigation: one `stageRules` table as data, and a sociable test per reader.
- **Lost decks.** Mitigation: nothing is deleted; a snapshot on retire; restore with preview.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in this file.

### Open questions

See [Open questions](#open-questions) above.

### Sources

See [Sources](#sources) above.

## Expanded scenarios

#### US-114-101 A batch from the review

As a player cutting from 12 to 7 decks, I want to apply five retirements at once and undo them if I change my mind, so that the review is one sitting.

#### AC-114-100 Happy path

Given five "retire" verdicts on the review
When the player applies them
Then all five stages change in one batch, the counts update, and "Undo" restores all five

#### AC-114-101 Failure

Given the batch fails halfway
When the player looks at the library
Then no stage changed

#### AC-114-102 Edge

Given a retired deck that is in a project (I-113)
When the project loads
Then the slot follows the owner's choice of whether retired decks fill slots

### UX states for this feature

| State            | What the player sees                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Empty            | "No retired decks."                                                                                     |
| Loading          | A busy state that keeps the table still.                                                                |
| Error            | The last confirmed stage; a catalogue message.                                                          |
| Preview          | Copies freed, plan lines leaving, spares, "keep the commander".                                         |
| Guest            | Public decks as before; no stage shown.                                                                 |
| Signed-in        | Stages, the shelf and the review.                                                                       |
| English          | New controls use the `en` catalogue.                                                                    |
| French           | New controls use the `fr` catalogue.                                                                    |
| Dormant catalogs | The eight other catalogs keep every new key and may reuse the English text until a person reviews them. |
| Keyboard         | Every action and verdict is reachable without a pointer.                                                |
| Screen reader    | Stages and verdicts are words; the preview is announced.                                                |
| Colour           | No meaning rests on colour.                                                                             |
| Success          | "Retired. 14 copies are free."                                                                          |

### Alternate paths

- The player rests a deck from the deck page. The same preview applies.
- The player restores from the shelf. The same preview applies.

### Roadmap record (2026-11-20)

This file is the record from the start; the roadmap row for I-114 is a link here. I-01 slice 13 carries a dated line that points here; D-107 decides whether the archive and "retired" are one action.

## I-114: A Deck's Place In The Roster: Keep, Rest, Retire Or Take Apart

**Outcome:** a player retires or rests a deck without deleting it; the product says before saving what that frees and stops asking for; a private review shows each deck's facts with denominators beside the player's own verdicts; nothing recommends what to cut.

**Status:** Next
**Priority:** Next for slices 1 to 3; Later for slices 4 to 6. Never paid.
**Impact / effort:** High / medium
**Risk:** Medium. A review read as advice to sell; four modules' counting.
**Depends on:** nothing for slice 1; D-107 for slice 2; I-35 slice 6 for slice 5; I-43 slice 6 and I-108 slice 1 for slice 6.

A 319-point thread on too many decks, 19 such titles since 2025-01-01, a yearly review column and an archived Archidekt request; the product counts every deck forever.

### Scope

- [ ] `stageRules` as data (slice 1); `Deck.stage` and the three readers (slice 2); dialogs, restore and the shelf (slice 3).
- [ ] Later: the review (slice 4); game facts (slice 5); hand-offs to I-43 and I-108 (slice 6).

### Engineering enablers

- One stage table as data; one transaction per change or batch, with undo.

**Paid-tier angle:** none.

### Enrichment (2026-11-20)

**User story.** As a player with 18 decks, I want to retire some without deleting them, so that their cards are free for new decks.

**Acceptance.** Retire frees copies and leaves the plan; rest keeps copies; a preview before saving; restore with preview; a review without advice.

**UX.** Rest and Retire actions, a stage filter, a shelf, a review table.

**Data and API.** `Deck.stage`, `stageChangedAt`, `RosterVerdict`; a stage route with a dry run.

**i18n and access.** English and French; stages as words.

**Telemetry.** `deck_stage_changed`, `roster_review_opened`. Reserved for I-39.

**Rollout.** `decks.stages`, with slice 3.

**Open questions.** Archive merge; resting and the plan; a December card; a public section; given away; an idea stage.

### Definition of done

A player retires a deck after a preview that says 14 copies become free, sees those copies free in search and the deck gone from the acquisition plan, rests another that keeps its copies, opens the review with facts and denominators, applies two verdicts in one batch, undoes them, and restores a deck from the shelf.

---
