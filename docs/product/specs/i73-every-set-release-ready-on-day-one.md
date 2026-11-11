# I-73: Every Set Release, Ready On Day One

> **Initiative:** I-73, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for slices 0 to 6, so that the first release after I-67 ships does not hold the card data; Later for slices 7 to 11; slice 12 waits for I-30 · **Paid:** content stays free; one paid candidate (requirement 9) · **Written 2026-11-10**
> **Research:** one dated note of 2026-11-10 on the 2026–2027 release calendar, Commander announcements, Scryfall's and MTGJSON's preview data, Wizards' Fan Content Policy and how other sites cover preview season, plus measurements made for this spec through Scryfall's API. The note is not committed, so every external fact links its own source in [Sources](#sources). Legal points are research, not legal advice; each goes to [`legal-questions.md`](../legal-questions.md) as a proposed question.
> **Owns:** the release calendar (`SetRelease` and its milestones); the one function that says whether a card is a preview, upcoming or released (`releaseStatus`), and the preview wording every surface uses; the release playbook as data, its checks and the owner's release page; the classification of release-day legality events for I-67's gate; the release dry run; the release digest event; Commander-lens set pages, if the owner approves them. **Does not own:** ingest, events and gates ([I-67](i67-one-card-data-pipeline.md)); the radar and its reasons ([I-18](i18-per-deck-radar-of-new-cards.md)); the precon catalogue and bundles ([I-17](i17-precon-path-and-tiered-upgrades.md)); rules versions ([I-48](i48-official-changes-reach-every-deck.md)); delivery and preferences ([I-63](i63-one-notification-system.md)); prices and alerts ([I-59](i59-prices-over-time-and-alerts.md)); the index policy ([I-34](i34-commander-data-reports.md)); guides ([I-28](i28-commander-deckbuilding-guide-by-bracket.md), [I-68](i68-archetype-guides.md)); the Comprehensive Rules import ([I-47](i47-rules-answers-for-this-deck.md)); budgets and the runbook ([I-71](i71-speed-uptime-and-recovery.md)); switches and `/ops` ([I-69](i69-operator-console-support-moderation-and-kill-switches.md)); entitlements ([I-30](i30-business-model-and-paid-tier.md)); the publishing calendar of which content ships when ([I-72](i72-growth-loops-referrals-creators-and-return.md)), which reads this one.
> **For the integrator:** I-34's roadmap item "A publishing calendar (gap sweep, 2026-11-10)" moves to [I-72](i72-growth-loops-referrals-creators-and-return.md) slices 7 and 8, which say which content ships when and read this spec's release calendar (slices 3 and 5) for set dates and milestones (wording aligned 2026-11-10). [Changes requested of other specs](#changes-requested-of-other-specs) lists each sentence to change.

## Overview

Wizards ships a Commander-relevant set every six to nine weeks. In 2027 it plans six, each reported to come with four Commander decks [1]–[3]. Each release touches ten initiatives at once: I-67 ingests the cards, I-18 finds new cards for a deck, I-17 lists the precons, I-48 handles official changes, I-34 publishes data pages, I-28 and I-68 keep guides current, I-63 notifies, I-59 tracks prices and I-71 keeps the site fast. Each reacts on its own. In the roadmap, the only line that plans for set releases is I-34's "publishing calendar" item.

Three things break on the next release, and no initiative owns them:

- **Preview cards are invisible or wrong.** Builder search adds `legal:commander` to every query, and Scryfall marks new cards `not_legal` until close to release. On 2026-11-10, the set browser for Marvel: Darkhold Destiny showed 5 of its 12 cards, the basic lands [9]. The AI copilot calls a preview card "not legal", with no date.
- **Card data would be held on the day the new cards become legal.** I-67 holds any file that carries more than 20 legality events and waits for the owner. Star Trek brings 467 new Oracle cards [9]. Scryfall turns them from `not_legal` to `legal` close to release, probably in one update; its documentation does not say when.
- **Nobody checks readiness.** The served Comprehensive Rules took effect on 2026-08-07. Wizards linked a 2026-11-06 version a week before Star Trek's release [16].

I-73 coordinates the release; it does not repeat other initiatives' work. It builds a calendar from I-67's data, one release status shared by every surface, a playbook kept as data with a check for each row, and a dry run on a past set. It also builds the few pieces nobody owns: the preview wording, the gate exception and the release digest.

## What the market does

**The calendar.** Release dates for 2026 come from Scryfall's set list. Dates for 2027 come from Wizards and two dated reports [1]–[4].

| Set                          | Release    | Kind             | Commander products                                                     | Source  |
| ---------------------------- | ---------- | ---------------- | ---------------------------------------------------------------------- | ------- |
| Lorwyn Eclipsed              | 2026-01-23 | Multiverse       | `ecc` on Scryfall                                                      | [4]     |
| Teenage Mutant Ninja Turtles | 2026-03-06 | Universes Beyond | None listed as a Commander set on Scryfall                             | [4]     |
| Secrets of Strixhaven        | 2026-04-24 | Multiverse       | `soc`                                                                  | [4]     |
| Marvel Super Heroes          | 2026-06-26 | Universes Beyond | `msc`                                                                  | [4]     |
| The Hobbit                   | 2026-08-14 | Universes Beyond | None listed as a Commander set on Scryfall                             | [4]     |
| Reality Fracture             | 2026-10-02 | Multiverse       | One deck, plus five Foundations Commander decks the same day           | [4][15] |
| Star Trek                    | 2026-11-13 | Universes Beyond | Four decks, each also in a Collector's Edition                         | [6][15] |
| Nauctis: The Sunken Realm    | 2027-02-05 | Multiverse       | Four decks per 2027 set, as reported (Wizards' own recap does not say) | [1][3]  |
| Marvel: Darkhold Destiny     | 2027-04-09 | Universes Beyond | `mdc` already on Scryfall, one card                                    | [2][4]  |
| Kamigawa: Titanbreach        | 2027-06-04 | Multiverse       | As above                                                               | [1][3]  |
| Unannounced                  | 2027-08-06 | Universes Beyond | As above                                                               | [2][3]  |
| Zhalfir                      | 2027-10-01 | Multiverse       | As above                                                               | [1][3]  |
| Unannounced                  | 2027-11-19 | Universes Beyond | As above                                                               | [2][3]  |

**One release, measured.** Scryfall stores a preview date on the cards a partner or Wizards revealed: 12 to 120 per set. The table is **computed** from those dates [5].

| Set                      | First preview | Median preview of new cards | Last preview | Release    | Last preview to release |
| ------------------------ | ------------- | --------------------------- | ------------ | ---------- | ----------------------- |
| The Hobbit               | 2026-07-20    | 2026-07-27                  | 2026-07-30   | 2026-08-14 | 15 days                 |
| Reality Fracture         | 2026-08-31    | 2026-09-12                  | 2026-09-17   | 2026-10-02 | 15 days                 |
| Reality Fracture decks   | 2026-09-16    | —                           | 2026-09-16   | 2026-10-02 | 16 days                 |
| Star Trek                | 2026-10-21    | 2026-10-24                  | 2026-10-30   | 2026-11-13 | 14 days                 |
| Marvel: Darkhold Destiny | 2026-10-09    | —                           | 2026-10-09   | 2027-04-09 | first look 182 days out |

- **Typical timeline (estimate from these sets).** A first look can come months ahead. Main previews start 23 to 32 days before release and end about two weeks before it. Decklists appear about two weeks before release. Prerelease events run in the week before release, and MTG Arena gets the set a few days before tabletop. For Star Trek, prerelease ran 6–12 November, Arena opened on 10 November and tabletop release was 13 November [6][7]. Wizards' own page lists the "Full Card Image Gallery" on 30 November, after the release [6], while Scryfall's last preview date is 30 October [5]. Two Wizards pages also disagree on the second Commander Party: 15–21 January [7] or 11–17 December [6]. A product cannot key its behaviour on a published calendar alone.
- **When cards become legal.** Star Trek's release notes permit its cards "at release" [8]. Scryfall listed all 311 Star Trek cards as legal in Commander on 2026-11-10, three days before release. It listed Darkhold Destiny's seven new cards as `not_legal` [9]. The Scryfall documentation read does not say on which day a set switches [10].
- **When the data arrives.** Scryfall "tries our best to input previews within 24 hours" [11]. During spoiler season a card may have no image or a low-resolution one, and `image_status` says which [12]. MTGJSON marks a set still in preview with `isPartialPreview` ("Preview sets do not have complete data") [14]. On 2026-11-10 it flagged Star Trek, Nauctis and Darkhold Destiny, and it already held the four Star Trek decklists [15]. Wizards' rules page linked Comprehensive Rules dated 2026-11-06 [16].

**Commander announcements since Wizards took over.** Wizards took over Commander on 2024-09-30 [17] and introduced brackets and the Game Changers list on 2025-02-11 [18]. On 2025-10-21 it said there would be "no bans or unbans for the remainder of this year" [19]. The 2026-02-09 announcement took effect the same day. It said Commander "gets to operate on its own schedule", is not limited to one update window a year, and would return "likely this summer in May or June" [20]. No Commander change was found after that date. The 2026-10-12 banned and restricted announcement has no tabletop Commander section and sets the next one for 2026-11-30 [21]. [I-48](i48-official-changes-reach-every-deck.md) holds the full dated history, including the 2025-04-22 update. The playbook therefore schedules no announcement: I-48 reacts on the day one appears.

**How others handle preview season.**

| Product           | What it does                                                                                                                                                                              | Source   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Scryfall          | Enters previews within 24 hours, names each card's preview source and date, and keeps new cards `not_legal` until close to release                                                        | [9]–[11] |
| EDHREC (data)     | Its Star Trek set page counted decks before release: The Borg Queen 1,512, Q, Stacking the Deck 1,312, Deep Space 9 in 4,883 decks (2026-11-10, three days before release)                | [24]     |
| EDHREC (articles) | Covered the 2027 reveal the day Wizards announced it. Published ten Star Trek articles from 5 to 10 November: a precon guide, set reviews (cEDH, commons, typal), commander rankings      | [23][27] |
| Archidekt         | Its card search endpoint returned the Darkhold Destiny preview card Hela, Mistress of Darkness, dated 2027-04-09, five months early. Whether its editor labels such cards was not checked | [25]     |
| Moxfield          | Not verified: its API answered HTTP 403                                                                                                                                                   | [26]     |

**The opening.** Every source read covers the set as a whole, and EDHREC counts the decks that already use it. None of the pages read dates when a preview card becomes legal. None tells a deck's owner which new cards fit that deck, or that a preview card in it is now legal. This describes the pages read on 2026-11-10, not proof of absence.

## Current state in this codebase

Verified on `dev` at `fee835d8` on 2026-11-10.

- **No release concept.** `ScryfallCard` (`src/lib/scryfall/types.ts`) has no `released_at`, `preview` or `game_changer` field. No set table exists. `src/components/search/SetAutocomplete.tsx` fetches `https://api.scryfall.com/sets` in the browser, keeps it for an hour, and hides sets with no cards, so Nauctis is hidden until its first preview.
- **Search hides previews.** `buildSearchQuery` and `buildSetSearchQuery` in `src/lib/scryfall/search.ts` append `legal:commander` to every query, so a `not_legal` preview card never appears in the builder.
- **The editor accepts previews silently.** `validateCardForDeck` (`src/lib/deck/validation.ts`) checks the stored `isBanned` flag, colour identity and copy limit. Outside the AI routes, no deck code reads a card's Scryfall `legalities`. A preview card pasted or imported is therefore accepted, with no mark.
- **The copilot says "not legal".** `commanderLegalityProblem` (`src/lib/ai/generated-deck-legality.ts`) maps every value other than `legal` to "not legal", and `suggestion-evidence.ts` sets `commanderLegal: false`. Neither says when a card becomes legal.
- **Spellbook's spoiler flag goes unread.** The recorded Commander Spellbook responses in `src/lib/combos/fixtures/find-my-combos-v1.ts` carry a `spoiler` field on each combo, and no code reads it.
- **Rules text is out of date.** `src/lib/rules/data/MagicCompRules-20260807.txt` is "effective as of August 7, 2026". [I-47](i47-rules-answers-for-this-deck.md) slice 1 plans the update to 2026-11-06.
- **Nothing runs on a schedule.** None of the three workflows (`ci`, `lighthouse`, `sonar`) has a `schedule:`, and no `vercel.json` exists. No precon catalogue exists: "precon" appears in `src/` only as `<PreconstructedDeckID>0` in `src/lib/deck/export.ts`. `NotificationPreference` is stored, and nothing is delivered.
- **What the specs plan, one by one.** I-67 emits `set.added` and `printing.added`. It holds a file with more than 20 legality events ([I-67 5.1](i67-one-card-data-pipeline.md#5-failure-and-fallback)) and reads a card spoiled after the last file live (5.2). I-18 runs on request and lists unreleased cards as a non-goal. I-59 5.2 labels a price "before release". I-63's table has a category "New cards for my decks", off in the app and by email. I-54 searches `is:commander legal:commander`, so it misses preview commanders. I-17's open question asks whether importing a whole set is a day-one need.
- **The gate collision, computed.** Star Trek, Star Trek Commander and Stardates hold 467 new Oracle cards; 197 of them can be a commander [9]. Reality Fracture held 286. On the day Scryfall switches them to legal, I-67 emits at least one `legality.changed` per card, holds the Oracle file and keeps the day before live. The new cards then read as not legal until the owner confirms the file.

## Functional requirements

### 1. Ground rules

1.1 **Card data comes only through I-67.** Nobody types a card, a decklist, a legality, a price or an image. The owner may enter only a date Wizards announced, with its URL (2.3).
1.2 **No model decides.** Release status, legality, bracket flags, candidates and digest contents come from code. No model writes text on a release surface.
1.3 **No card database.** No page per card, no set gallery and no list of a set's cards with images ([strategic boundaries](../roadmap.md#strategic-boundaries); [I-67 1.2](i67-one-card-data-pipeline.md#1-ground-rules)). A card is shown where a player's deck, commander or precon needs it. The set itself links to Scryfall.
1.4 **Only what Scryfall publishes.** No leak and no unofficial preview is ingested, linked or discussed.
1.5 Every release surface names its card-data date and each card's release status.

### 2. The release calendar

2.1 `SetRelease` has one row per Scryfall set of a type `SetAutocomplete` already treats as Commander-relevant. It is created from I-67's `set.added` and linked to `CardSet`, and a child set (such as `trc`) points to its parent.
2.2 Each set has these milestones, each with a date, a source (`observed` from data, `announced` with a URL, or `computed`) and the run that observed it:

| Milestone           | Rule                                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `announced`         | The set exists on Scryfall, or the owner entered it with Wizards' URL                                                                  |
| `previewStart`      | First new printing of the set in I-67                                                                                                  |
| `decklistsRevealed` | First MTGJSON "Commander Deck" for the set or a child set (I-67 slice 13)                                                              |
| `galleryComplete`   | First run where MTGJSON no longer flags the set `isPartialPreview`, or seven days with no new printing after `previewStart` (proposal) |
| `prerelease`        | Announced by Wizards; optional                                                                                                         |
| `legalSwitch`       | The run in which the set's new cards turn `legal` in Commander on Scryfall                                                             |
| `release`           | Scryfall's `released_at`                                                                                                               |
| `T-30`, `T+14`      | Computed from `release`                                                                                                                |

2.3 An observed date always drives behaviour. The owner page flags any observed date more than two days from the announced one.
2.4 Slice 3 seeds the 2027 sets in the market table as `announced`, each with its sources. Scryfall's data replaces those dates once the sets appear.
2.5 The release page shows the last Commander announcement and the next banned and restricted date Wizards stated, each with its URL. It never predicts a Commander change.

### 3. Release status of a card

3.1 `releaseStatus(card, today)` is a pure function over the card's earliest printing. It returns `preview` (release after today, Scryfall `not_legal`), `upcoming` (release after today, Scryfall `legal`) or `released`, with `releasesOn`. A reprint in a new set is `released`.
3.2 The legality verdict stays Scryfall's, read through I-67, or I-48's version for bans and Game Changers. The status changes only the wording. A `preview` card reads "Preview: legal in Commander from 5 February 2027", never "not legal" alone.
3.3 Builder search and the set browser get an "Include previews" switch, off by default. `previewQuery` replaces `legal:<format>` with `(legal:<format> or date>YYYY-MM-DD)`, using today's date, and adds `game:paper`. The query stays visible ([I-14](i14-verifiable-natural-language-search.md)). On 2026-11-10 the query without `game:paper` found all 12 Darkhold Destiny cards [9].
3.4 A preview card in a deck gets a warning in the legality group, with its release date and the card-data date. It never blocks saving. The warning clears at `legalSwitch` without a notice.
3.5 The copilot never puts a preview card in a generated deck or a suggestion. Its removal reason becomes "Preview, legal from <date>" ([I-02](i02-checkable-ai-copilot.md)).
3.6 A preview image is shown exactly as Scryfall serves it, with a "Preview image" label when `image_status` is `missing`, `placeholder` or `lowres`. It is never cropped, stretched or edited, which Scryfall's image rules forbid [12][13].

### 4. The playbook

4.1 The playbook is a reviewed data file in the repository, with one row per milestone, initiative and action. Each row names the slice that delivers it and a done condition that a check function reads, or that the owner ticks.
4.2 For each set, the release page shows every row as `done`, `due`, `late`, `skipped` (with a reason) or `not built`, the last when its slice has not shipped. The page therefore also shows what the next release will lack.
4.3 At `T-30` and on `release`, the owner gets one email listing late rows, through I-71's owner alerts. No player receives anything from the playbook.
4.4 First version:

| When                | Initiative (slice)               | Product behaviour                                                                                                    | Done when                                    |
| ------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| T-30                | I-73 (5)                         | The release page opens for the set, with the previous release's review                                               | Page lists the set                           |
| T-30                | I-67 (3, 11)                     | Daily runs and conformance checks pass                                                                               | No held or failed file in 7 days             |
| T-30                | I-73 (6), I-71 (8)               | Dry run passes; query and response budgets met on builder search, deck and commander pages                           | CI green; budgets met for 7 days             |
| T-30                | I-69 (4), I-71 (5)               | Scryfall's upstream switch works; runbook section "Scryfall down" reviewed                                           | Switch tested; review dated                  |
| `previewStart`      | I-73 (1, 2)                      | New cards carry the preview status; "Include previews" finds them                                                    | First preview printing labelled              |
| `previewStart`      | I-18 (1, 2), owner decision      | The radar accepts the preview corpus on request, labelled                                                            | Radar returns candidates from the set        |
| `previewStart`      | I-59 (3, 10)                     | New printings of tracked cards enter the reprint watch; early prices read "before release"                           | `ReprintEvent` rows for the set              |
| `decklistsRevealed` | I-67 (13), I-17 (1, 2), I-73 (9) | Each new precon gets a catalogue version: "decklist of <date>, product not yet released"; it opens as a working copy | One version per deck                         |
| `galleryComplete`   | I-18 (3, 5), I-73 (8)            | Radar candidates show bracket and Game Changer flags                                                                 | Flags on the fixture deck                    |
| `galleryComplete`   | I-63 (1–3, 10), I-73 (7)         | One release digest per opted-in player                                                                               | Events written once per player               |
| `galleryComplete`   | I-34 (1), I-73 (10)              | Commander-lens set page live, `noindex`                                                                              | Page answers 200, `noindex`                  |
| `release` − 7       | I-47 (1)                         | New Comprehensive Rules imported with a diff (Wizards linked the 2026-11-06 file a week before Star Trek)            | Owner ticks: served CR matches Wizards' page |
| `legalSwitch`       | I-67 (2), I-73 (4)               | The switch loads the same day and is not held                                                                        | Oracle file loaded on the switch day         |
| `release`           | I-73 (1)                         | Preview wording drops; deck warnings clear                                                                           | No `preview` card in the set                 |
| Any day             | I-48 (6)                         | Only if Wizards publishes a Commander change: draft, compare, publish                                                | I-48's own flow                              |
| `T+14`              | I-17 (3)                         | Upgrade bundles for each new precon, by the curator                                                                  | Bundles published, or skipped with a reason  |
| `T+14`              | I-28 (8), I-68                   | One review task per guide that may cite the set, closed by its named reviewer                                        | Tasks closed                                 |
| `T+14`              | I-34 (1)                         | Index policy applied to the set page with post-release data                                                          | Decision recorded                            |
| `T+14`              | I-73 (5)                         | Release review: late and unbuilt rows, data dates, incidents                                                         | Review saved                                 |

### 5. What players get

5.1 **New cards for your commander, on preview day.** Through I-18, on request for one deck, the corpus includes the set's printings with their status. The reasons available on day one come first: a Commander Spellbook combo with a card already in the deck, shown as a preview combo when Spellbook's `spoiler` field says so, and a role the deck lacks under [I-03](i03-trustworthy-deck-feedback.md). EDHREC inclusion is added as its counts grow; it had counts before release [24].
5.2 **Precons on decklist day.** Precon pages and the sealed diff from I-17 appear when MTGJSON publishes the list, labelled as a decklist from a product not yet released. Upgrade bundles follow by `T+14` if a curator exists.
5.3 **The release digest.** At `galleryComplete`, players who opted in get one event per set, `release.digest`, in I-63's category "New cards for my decks", off in the app and by email by default ([I-63 4.2](i63-one-notification-system.md#4-preferences-defaults-and-consent)). It lists each of the player's decks and how many new cards are legal in it, from I-18's legality filter only. Each deck links to the radar. It does not advertise the set, link to a shop or count down.
5.4 **Bracket and Game Changer impact.** Each radar candidate states whether it is a Game Changer under the version in force, named with its date, and which bracket floor it would trip if added: extra turns, mass land denial, or a two-card combo with the deck. I-48's `assessDeck` on the deck plus the card decides. Nothing predicts a future Game Changer or ban. If Wizards later lists a new card, I-48's notice covers it.
5.5 **Early prices.** I-59 tracks a new printing from its first price and labels it "before release" (I-59 5.2). On 2026-11-10 Star Trek cards had USD and EUR prices three days before release; Darkhold Destiny cards had none [9]. Alerts on preview cards follow I-59's allowance like any other alert.
5.6 **Guides.** No model rewrites a guide. A release opens review tasks only (4.4).

### 6. Commander-lens set pages (owner decision)

6.1 If the owner approves (open question 2), `/releases/[code]` shows one set through Commander. It lists new possible commanders, each with its colour identity and links to its commander page and Scryfall. It lists existing commanders that gain a two-card combo with a new card, citing Spellbook. It counts the new cards that share a typal commander's creature type, as counts only. It links the precons.
6.2 No card grid, full card list or price list. Images are limited to the new commanders' cards, unaltered and with the artist's name [13]. Images of Universes Beyond cards wait for the lawyer (open question 3).
6.3 The page is a new I-34 page kind. I-34's index policy decides: `noindex` before release and below its thresholds.
6.4 Sentences come from reviewed templates. The page is free and needs no account.

### 7. Operational readiness

7.1 **Release events at I-67's gate.** `isReleaseLegalitySwitch(event)` is true for a `not_legal` → `legal` event on a card whose earliest printing belongs to a set released within 21 days of the run, before or after (a proposal; open question 4). I-67 does not count those events toward its threshold of 20, and its run report lists them as a separate line.
7.2 **Dry run.** CI replays a release through I-67's harness and I-73. Until a live release has been recorded, synthetic fixtures rebuild Reality Fracture's timeline from its current objects: no cards, then the first previews of 2026-08-31, decklists on 2026-09-16, the last previews of 2026-09-17 and release on 2026-10-02. The fixture puts the legal switch three days before release, as observed for Star Trek, because Reality Fracture's switch day is not known. The assertions are milestones and their dates, labels, an unheld gate, one digest per opted-in player and the playbook checks. Slice 6 then records Nauctis's daily excerpts as the first real fixture.
7.3 **Scryfall late.** The product shows only what Scryfall has, and the release page says "waiting for Scryfall". If `legalSwitch` has not happened one day after `release`, the card reads "Released on <date>; Scryfall still lists it as not legal (data of <date>)", the verdict stays Scryfall's, and the owner is alerted. A held or failed file follows I-67 5.3, and a Scryfall outage follows I-69's upstream switch.
7.4 **MTGJSON late.** The decklist milestone and precon pages wait. No list is typed by hand.
7.5 **Load.** At `T-7`, slice 11 replays the read routes that release traffic hits on a preview deployment, never production: builder search through `/api/cache/search`, public deck pages and `/commanders/[slug]/decks`. It checks them against I-71 2.7's response budgets. The replay multiplies the busiest hour of the last 28 days; the multiplier is an estimate until one release has been measured (open question 6). The "Include previews" switch adds distinct search queries under Scryfall's 2-a-second limit, so the replay counts upstream calls too.
7.6 **Off switch.** The preview switch, the digest and set pages sit behind one I-69 kill switch, `release.previews`.

### 8. Calendar data for other initiatives

8.1 `GET /api/releases` returns each set's milestones to owner tools, cached for an hour. I-34 report refreshes, I-18's corpus and I-72's publishing calendar read it instead of keeping their own dates.

### 9. Free and paid

9.1 **Free, with no account where public:** release status and wording, the preview switch, warnings, precon pages, the radar on request, the digest with its counts, set pages, bracket flags and price labels ([I-30 1.1](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)).
9.2 **Paid candidate, medium:** an automatic radar, with reasons, for each of the player's decks at `previewStart` and again at `galleryComplete`, above a free allowance of decks the owner sets. It costs compute per player per set, which I-30 1.3 allows to be paid. I-30's market table records DeckCheck selling deck reports in every paid tier, and no free site read computes per-deck results during previews. It extends I-30's "Watching one's decks" row and needs [L-16](../legal-questions.md#l-16-does-a-paid-tier-fit-wizards-fan-content-policy) and [L-20](../legal-questions.md#l-20-is-a-paid-tool-over-scryfall-data-paywalling-it).
9.3 Never paid: legality, preview status, precon lists, set pages, guides. Alerts on preview cards above I-59's allowance are I-59 9.2's paid candidate; I-73 adds no second one.

## Data model / API

```text
SetRelease        setKey Int @id (I-67 CardSet.key), code, name, kind (multiverse|universesBeyond|commander|other),
                  parentSetKey?, releaseOn Date, state (announced|previewing|complete|released|reviewed)
ReleaseMilestone  setKey, kind (announced|previewStart|decklistsRevealed|galleryComplete|prerelease|legalSwitch|release),
                  on Date, source (observed|announced|computed), sourceUrl?, runId?          @@id([setKey, kind])
ReleaseCheck      setKey, itemId, state (notBuilt|due|done|late|skipped), checkedAt, note?   @@id([setKey, itemId])
```

- Playbook rows live in `src/lib/releases/playbook.ts` as typed data: `id`, `milestone`, `offsetDays`, `initiative`, `slice`, `action`, `check`.
- Pure functions in `src/lib/releases/`: `releaseStatus`, `previewQuery`, `detectMilestones(changes, release)` and `isReleaseLegalitySwitch(change, releases)`.
- I-67 consumer `releases`, reading `set.added`, `printing.added` and `legality.changed`. I-63 catalogue entry `release.digest` with payload `{ setKey, deckCounts: [{ deckId, legalNewCards }] }`, ids and numbers only.
- `GET /api/releases` (owner) and the page `/ops/releases` in I-69's shell. `/releases/[code]` exists only after slice 10.

## Non-goals

- A card database, card pages, a set gallery, a public release calendar or spoiler news.
- Leaks, rumours or previews Scryfall has not published.
- Hand-entered cards, lists, legality, dates of legality or prices.
- Predicting bans, Game Changers, prices or which cards will matter.
- Marketing email, countdowns or "spoiler season" campaigns. Nothing is timed by activity ([I-63 1.2](i63-one-notification-system.md#1-ground-rules)).
- MTG Arena or Magic Online release dates. The product's verdicts are for tabletop Commander.
- Preorders, sealed product sales or affiliate pushes at release ([I-32](i32-seller-handoff-and-affiliate-carts.md) and [I-33](i33-marketplace-ladder.md) are unchanged).
- Set reviews or rankings written by a model, or by the product at all.

## Testing strategy

- **Solitary, table-driven:** `releaseStatus` across preview, upcoming, released and reprints; `previewQuery` keeps every other query part and stays visible; `isReleaseLegalitySwitch` inside and outside the window and on a non-new card.
- **Milestones:** event fixtures produce each milestone once, with its date and source; a late Scryfall switch raises the 7.3 state; a disagreement of more than two days between announced and observed dates is flagged.
- **Contract:** no surface renders "not legal" alone for a `preview` card, across the editor warning, search results and the copilot; no release module imports an AI client.
- **Gate (sociable, with I-67's harness):** a fixture with 467 release switches loads; the same fixture with 21 other legality changes is held.
- **Dry run:** the Reality Fracture replay of 7.2 passes in CI with no network.
- **Digest:** one event per set per opted-in player; none for a player who opted out; the payload rejects names and URLs.
- **Images:** card images on release surfaces carry no CSS filter, crop or overlay that hides the artist line.

## Delivery slices

| #   | Slice                                                                                                                                          | Depends on                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 0   | Owner decisions: previews in the radar (I-18 non-goal), set pages yes or no, digest timing, the gallery and switch windows, the free allowance | — (owner; no code)                                                                      |
| 1   | `releaseStatus` and `previewQuery` as pure functions with fixtures; `ScryfallCard` gains `released_at` and `preview`                           | —                                                                                       |
| 2   | Preview wording: search and set-browser switch, editor warning, copilot reason, image label                                                    | 1                                                                                       |
| 3   | `SetRelease`, `ReleaseMilestone`, milestone detection as an I-67 consumer, the 2027 seed with sources                                          | 1; I-67 slice 4                                                                         |
| 4   | `isReleaseLegalitySwitch` and its use in I-67's gate and run report                                                                            | 3; I-67 slice 2                                                                         |
| 5   | Playbook file, `ReleaseCheck`, `/ops/releases`, the owner emails at `T-30` and `release`                                                       | 3; I-69 slice 7                                                                         |
| 6   | Dry run: synthetic Reality Fracture fixtures in CI; recording of Nauctis's excerpts                                                            | 3, 4, 5                                                                                 |
| 7   | Release digest event with per-deck counts                                                                                                      | 3; I-18 slice 2; I-63 slices 1 to 3 (slice 10 for email)                                |
| 8   | Bracket and Game Changer flags on radar candidates                                                                                             | I-18 slice 3; I-48 slice 2                                                              |
| 9   | Decklist milestone linked to I-17 catalogue versions, with the preview label                                                                   | 3; I-17 slice 1; I-67 slice 13                                                          |
| 10  | Commander-lens set page as an I-34 page kind                                                                                                   | **Blocked** on slice 0 and the lawyer's answer on images; 3; I-34 slice 1; I-18 slice 3 |
| 11  | Release-week replay against I-71's budgets on a preview deployment                                                                             | 5; I-71 slice 8                                                                         |
| 12  | Paid candidate: automatic radar for every deck above the allowance                                                                             | **Blocked** on the I-30 decision; 7; I-18 slice 5                                       |

Slices 1 and 2 can start today. Slice 4 must merge before the first release that I-67's scheduled run meets (I-67 slice 3). Otherwise that release holds the Oracle file on its switch day. Nauctis's previews should start in early January 2027, an estimate from the table above.

### Changes requested of other specs

| Spec                       | Today                                                       | Change to                                                                                                      |
| -------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| I-67 5.1                   | More than 20 legality or Game Changer events hold the file  | Events classified by I-73 slice 4 are reported and not counted                                                 |
| I-67 4.1 events table      | `set.added` read by I-18, I-17, I-57                        | I-73 also reads `set.added`, `printing.added` and `legality.changed`                                           |
| I-18 non-goals; 1.2        | "Spoiler-season coverage of unreleased cards" is a non-goal | If the owner agrees (slice 0): preview printings join the corpus, labelled by `releaseStatus`                  |
| I-18 slice 6               | Opt-in notifications                                        | The per-set digest is I-73 slice 7; slice 6 keeps notices for one deck                                         |
| Roadmap I-34 scope item    | "A publishing calendar (gap sweep, 2026-11-10)"             | Moves to I-72 slices 7 and 8, which read I-73 slices 3 and 5; I-34 keeps its report refreshes as playbook rows |
| I-54 catalogue and filters | `is:commander legal:commander`                              | An "Include previews" filter through `previewQuery`, off by default                                            |
| I-63 4.2 table             | "New cards for my decks", producer I-18                     | Producers I-18 and I-73                                                                                        |
| I-17 open question 3       | "Is per-set bulk import a day-one requirement?"             | Yes: I-67 slice 13 imports a set's decks at `decklistsRevealed`; I-73 slice 9 checks it                        |
| I-47 slice 1               | CR import and update to 2026-11-06                          | Also a playbook row: the owner compares the served CR with Wizards' page at each release                       |
| I-02 legality messages     | `commanderLegalityProblem` says "not legal"                 | A `preview` card's reason comes from I-73 slice 2                                                              |
| I-69 switch registry       | AI, upstream, maintenance and dark-launch switches          | Adds `release.previews` (kill), owned by I-73                                                                  |

## Open questions

1. **Previews in the radar and search?** Owner decision [D-81](../owner-decisions.md#product-scope-and-non-goals). This reverses an I-18 non-goal. The recommendation is yes, labelled, and off by default in search, because a deck-aware view on preview day is the gap the market leaves.
2. **Set pages at all?** Owner decision [D-82](../owner-decisions.md#product-scope-and-non-goals). They add original Commander data, but they come close to a set gallery. Without them, the release still works through decks, precons and the digest.
3. **For the lawyer, now in `legal-questions.md` (research, not legal advice):** (a) and (d) are [L-49](../legal-questions.md#l-49-universes-beyond-card-images-and-preview-cards-under-the-fan-content-policy), (b) is [L-50](../legal-questions.md#l-50-a-public-set-page-of-commanders-and-counts-against-scryfalls-repackaging-clause) and (c) is an addition to L-14.
   - (a) May the product show Universes Beyond card images, which contain a partner's IP such as Star Trek or Marvel, through Scryfall? The Fan Content Policy asks fans not to use other people's IP without permission [22]. This pairs with [L-19](../legal-questions.md#l-19-the-card-back-card-art-and-artist-credit).
   - (b) Does a public set page of commanders and computed counts "simply repackage" Scryfall data [13]? This pairs with [L-21](../legal-questions.md#l-21-proxying-repackaging-and-our-own-api-terms-scryfall).
   - (c) Is a digest that names a new commercial product prospection, even when opted in? This pairs with [L-14](../legal-questions.md#l-14-are-notices-the-player-turned-on-prospection).
   - (d) The Fan Content Policy says nothing about officially previewed cards before release [22]. Is showing them, as Scryfall does, within Wizards' terms?
4. **When does Scryfall switch legality?** Star Trek was legal three days before release [9]. Ask Scryfall, and observe Nauctis. The 21-day window is a proposal.
5. **What marks a complete gallery?** MTGJSON's flag, seven quiet days, or Wizards' own date, which fell after release for Star Trek [6]?
6. **How much load?** No traffic figure for release weeks was researched. Set the replay multiplier from Speed Insights after one release.
7. **Who curates precon bundles by `T+14`?** This is I-17's open question. Without a curator, the row is skipped every release.

## Sources

1. Wizards of the Coast, Jubilee Finnegan, "Everything Announced for the Magic Multiverse in 2027", 2026-07-17. https://magic.wizards.com/news/announcements/everything-announced-for-the-magic-multiverse-in-2027 (read 2026-11-10)
2. Star City Games, "Magic: The Gathering Set Release Schedule For 2027", 2026-10-09. https://articles.starcitygames.com/magic-the-gathering/magic-the-gathering-set-release-schedule-for-2027/ (read 2026-11-10)
3. Popverse, report on the MagicCon Amsterdam panel, 2026-07-18. https://www.thepopverse.com/gaming-magic-the-gathering-2027-sets-commander-decks-magiccon-amsterdam (read 2026-11-10)
4. Scryfall API, [`/sets`](https://api.scryfall.com/sets), read 2026-11-10.
5. Computed for this spec on 2026-11-10 from `preview.previewed_at` on every printing returned by Scryfall searches `e:<code>` with `unique=prints`, `include_extras` and `include_variations`, for `hob`, `fra`, `frc`, `trk`, `trc`, `msh`, `sos` and `mdd`, for example [`e:trk`](https://api.scryfall.com/cards/search?q=e%3Atrk&unique=prints&include_extras=true).
6. Wizards of the Coast, "Collecting Star Trek", 2026-10-20. https://magic.wizards.com/en/news/feature/collecting-star-trek (read 2026-11-10)
7. Wizards Play Network, "Star Trek dates and details", page dated 2026-10-28. https://wpn.wizards.com/news/star-trek-dates-and-details (read 2026-11-10)
8. Wizards of the Coast, Eric Levine, "Star Trek Release Notes", 2026-10-30, last modified 2026-11-04. https://magic.wizards.com/en/news/feature/star-trek-release-notes (read 2026-11-10)
9. Scryfall API searches run 2026-11-10: [`e:trk legal:commander`](https://api.scryfall.com/cards/search?q=e%3Atrk+legal%3Acommander) (311 of 311), [`set:mdd legal:commander`](https://api.scryfall.com/cards/search?q=set%3Amdd+legal%3Acommander) (5), [`(legal:commander or date>2026-11-10) set:mdd`](https://api.scryfall.com/cards/search?q=%28legal%3Acommander+or+date%3E2026-11-10%29+set%3Amdd) (12), [`(e:trk or e:trc or e:sds) not:reprint`](https://api.scryfall.com/cards/search?q=%28e%3Atrk+or+e%3Atrc+or+e%3Asds%29+not%3Areprint&unique=cards) (467), [`(e:trk or e:trc) is:commander not:reprint`](https://api.scryfall.com/cards/search?q=%28e%3Atrk+or+e%3Atrc%29+is%3Acommander+not%3Areprint&unique=cards) (197), [`(e:fra or e:frc) not:reprint`](https://api.scryfall.com/cards/search?q=%28e%3Afra+or+e%3Afrc%29+not%3Areprint&unique=cards) (286); prices and legalities read from the returned card objects.
10. Scryfall, [Card Objects](https://scryfall.com/docs/api/cards): `preview.previewed_at`, `preview.source`, `preview.source_uri` and the legality values, read 2026-11-10.
11. Scryfall, [FAQs](https://scryfall.com/docs/faqs), "What is Scryfall's spoiler policy?", read 2026-11-10.
12. Scryfall, [Card Imagery](https://scryfall.com/docs/api/images), "Image Statuses", read 2026-11-10.
13. Scryfall, [API documentation](https://scryfall.com/docs/api), "Use of Scryfall Data and Images", read 2026-11-10.
14. MTGJSON, [Set data model](https://mtgjson.com/data-models/set/), `isPartialPreview`, read 2026-11-10.
15. MTGJSON, [`SetList.json`](https://mtgjson.com/api/v5/SetList.json) (version `5.3.0+20261110`, last modified 2026-11-10 06:13 UTC) and [`DeckList.json`](https://mtgjson.com/api/v5/DeckList.json), read 2026-11-10.
16. Wizards of the Coast, [Comprehensive Rules page](https://magic.wizards.com/en/rules), linking `MagicCompRules 20261106.txt`, read 2026-11-10.
17. Wizards of the Coast, "On the Future of Commander", 2024-09-30. https://magic.wizards.com/en/news/announcements/on-the-future-of-commander (read 2026-11-10)
18. Wizards of the Coast, Gavin Verhey, "Introducing Commander Brackets Beta", 2025-02-11. https://magic.wizards.com/en/news/announcements/introducing-commander-brackets-beta (read 2026-11-10)
19. Wizards of the Coast, Gavin Verhey, "Commander Brackets Beta Update – October 21, 2025", 2025-10-21. https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025 (read 2026-11-10)
20. Wizards of the Coast, "Commander Banned and Restricted Announcement", 2026-02-09. https://magic.wizards.com/en/news/announcements/commander-banned-and-restricted-february-9-2026 (read 2026-11-10)
21. Wizards of the Coast, "Banned and Restricted Announcement – October 12, 2026", 2026-10-12. https://magic.wizards.com/en/news/announcements/banned-and-restricted-october-12-2026 (read 2026-11-10)
22. Wizards of the Coast, [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy), last updated 2017-11-15, read 2026-11-10.
23. EDHREC, [articles tagged Star Trek](https://edhrec.com/articles/tag/star-trek), first page, read 2026-11-10.
24. EDHREC, [Star Trek set page](https://edhrec.com/sets/trk), read through its JSON (`json.edhrec.com/pages/sets/trk.json`) on 2026-11-10.
25. Archidekt, card search endpoint, [`nameSearch=Hela, Mistress of Darkness`](https://archidekt.com/api/cards/v2/?nameSearch=Hela%2C%20Mistress%20of%20Darkness), read 2026-11-10.
26. Moxfield, card search API, `api2.moxfield.com/v2/cards/search`; answered HTTP 403 (tried 2026-11-10).
27. EDHREC, Josh Nelson, "MagicCon Amsterdam Reveals What 2027 Looks Like for Magic", 2026-07-17. https://edhrec.com/articles/magiccon-amsterdam-reveals-what-2027-looks-like-for-magic/ (read 2026-11-10)

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

on preview day a player sees which new cards fit one deck, each labelled "Preview: legal in Commander from 5 February 2027"; on the day Scryfall turns a set legal, the card data loads without waiting for the owner; and the owner sees, for each release, which rows of a playbook kept as data are done, late or not built yet.

### Goals

- On a replayed release, a preview card reads "Preview: legal in Commander from 5 February 2027" in search, the editor and the copilot; on the day its set turns legal, the Oracle file loads without the owner's confirmation; and the release page lists every playbook row as done, due, late, skipped or not built.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-73-01

As a player browsing a set that is not out yet, I want a preview card labelled with the date it becomes legal, so that the editor does not call it simply illegal.

#### US-73-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-73-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-73-01 Happy path

Given a signed-in player and the English locale
When search, the editor and the copilot use one status: legal, preview with a date, or not legal.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-73-02 Happy path

Given a signed-in player and the English locale
When a preview card can be added and is labelled.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-73-03 Happy path

Given a signed-in player and the English locale
When a release-day legality change does not trip the card-data hold by itself.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-73-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-73-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-73-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: On for guests and signed-in players. The same label everywhere. No flag that hides previews in one surface and not another.

#### AC-73-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-73-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-73-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The label is on the card row. The set page, if D-82 allows one, is not this slice.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Status is a pure function of the printing's legality and the set's release date, from I-67 once that load exists, and from the search response until then.

### Analytics and telemetry

`preview_card_added {labelled: yes}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

On for guests and signed-in players. The same label everywhere. No flag that hides previews in one surface and not another.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

When Scryfall flips a set to legal is observed, not assumed. Universes Beyond images are a lawyer question.

### Sources

- https://magic.wizards.com/news/announcements/everything-announced-for-the-magic-multiverse-in-2027

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-73: Every Set Release, Ready On Day One

**Spec:** [`specs/i73-every-set-release-ready-on-day-one.md`](i73-every-set-release-ready-on-day-one.md)

**Outcome:** on preview day a player sees which new cards fit one deck, each labelled "Preview: legal in Commander from 5 February 2027"; on the day Scryfall turns a set legal, the card data loads without waiting for the owner; and the owner sees, for each release, which rows of a playbook kept as data are done, late or not built yet.

**Status:** Next
**Priority:** Next for slices 0 to 6, so that the first release after I-67's scheduled run does not hold the card data; Later for slices 7 to 11; slice 12, the automatic radar, waits for I-30. Release status, wording, precon pages and the digest stay free
**Impact / effort:** High / medium
**Depends on:** nothing for slice 1; I-67 slice 4 for the release calendar (slice 3); I-67 slice 2 for the gate exception (slice 4); I-69 slice 7 for the release page (slice 5); slices 3 to 5 for the dry run (slice 6); I-18 slice 2 and I-63 slices 1 to 3 for the digest (slice 7); I-18 slice 3 and I-48 slice 2 for bracket flags (slice 8); I-17 slice 1 and I-67 slice 13 for decklist day (slice 9); D-82, the lawyer's answer on images, I-34 slice 1 and I-18 slice 3 for set pages (slice 10); I-71 slice 8 for the release-week replay (slice 11); I-30's decision and I-18 slice 5 for the automatic radar (slice 12).

Wizards ships a Commander-relevant set every six to nine weeks, and six are planned for 2027, each reported with four Commander decks ([Wizards, 2026-07-17](https://magic.wizards.com/news/announcements/everything-announced-for-the-magic-multiverse-in-2027)). Each release touches ten initiatives, and each reacts on its own; until this pass the only roadmap line that planned for releases was I-34's publishing calendar, which now belongs to [I-72](i72-growth-loops-referrals-creators-and-return.md). Three things break on the next one. Preview cards are invisible or wrong: on 2026-11-10 the set browser showed 5 of Marvel: Darkhold Destiny's 12 cards, the editor accepts a preview with no mark, and the copilot calls it "not legal" with no date. Card data would be held on the day the new cards turn legal: I-67 holds a file with more than 20 legality events, and Star Trek's three sets bring 467 new Oracle cards. Nobody checks readiness: the served Comprehensive Rules date from 2026-08-07, while Wizards linked a 2026-11-06 version a week before Star Trek's release. I-73 coordinates and does not repeat other initiatives' work; it builds the few pieces nobody owns: one release status, the preview wording, the gate exception, the playbook and the digest.

### Scope

- [ ] Slice 0, no code: previews in the radar and search ([D-81](../owner-decisions.md#product-scope-and-non-goals)), Commander-lens set pages ([D-82](../owner-decisions.md#product-scope-and-non-goals)), the digest timing, the gallery and legal-switch windows and the free allowance.
- [ ] **Preview cards, found 2026-11-10 (checked on `origin/dev` at `fee835d8`).** Builder search hides them: `buildSearchQuery` and `buildSetSearchQuery` (`src/lib/scryfall/search.ts`) add `legal:commander` to every query, and Scryfall marks new cards `not_legal` until close to release. The editor accepts them without a label: `validateCardForDeck` (`src/lib/deck/validation.ts`) checks the stored banned flag, colour identity and copies, and no deck code outside the AI routes reads Scryfall's legalities. The copilot calls them "not legal" with no date: `commanderLegalityProblem` (`src/lib/ai/generated-deck-legality.ts`) maps every value but `legal` to "not legal", and `suggestion-evidence.ts` sets `commanderLegal: false`. Done means: `releaseStatus` and `previewQuery` as pure functions (slice 1), then an "Include previews" switch off by default, an editor warning that never blocks a save, the copilot's reason `Preview, legal from <date>` ([I-02](i02-checkable-ai-copilot.md) points here) and a label on preview images Scryfall marks low-resolution or missing (slice 2).
- [ ] `SetRelease` and its milestones, detected from I-67's events, with the 2027 sets seeded from their sources (slice 3); `isReleaseLegalitySwitch`, so that a set's release-day switch is reported on its own line and not counted toward I-67's threshold of 20 (slice 4), merged before I-67 slice 3's scheduled run meets its first release.
- [ ] The playbook as typed data with a check per row, `/ops/releases` in I-69's console, and owner emails at T-30 and on release day (slice 5); a dry run that replays Reality Fracture's timeline in CI with no network, then Nauctis's recorded excerpts (slice 6).
- [ ] Later: one release digest per opted-in player in I-63's "New cards for my decks" (slice 7); Game Changer and bracket-floor flags on radar candidates (slice 8); a precon catalogue version on decklist day (slice 9); Commander-lens set pages, if D-82 says yes and L-49 and L-50 allow (slice 10); a release-week replay against I-71's budgets on a preview deployment (slice 11); an automatic radar for each deck above a free allowance, after I-30's decision (slice 12).

### Engineering enablers

- No surface renders "not legal" alone for a `preview` card, across the editor warning, search results and the copilot, and no release module imports an AI client.
- A fixture with 467 release switches loads through I-67's gate, and the same fixture with 21 other legality changes is held.
- The Reality Fracture replay passes in CI with no network.
- The digest writes one event per set per opted-in player, none for a player who opted out, and its payload rejects names and URLs.

**Paid-tier angle:** release status and wording, the preview switch, warnings, precon pages, the radar on request, the digest, set pages, bracket flags and price labels stay free, with no account where public. One candidate, rated medium: an automatic radar for each of the player's decks when previews start and again when the gallery is complete, above a free allowance the owner sets, which needs I-30, L-16 and L-20. Legality, preview status and precon lists are never paid.

### Enrichment (2026-11-11)

**User story.** As a player browsing a set that is not out yet, I want a preview card labelled with the date it becomes legal, so that the editor does not call it simply illegal.

**Acceptance.**
- Search, the editor and the copilot use one status: legal, preview with a date, or not legal.
- A preview card can be added and is labelled.
- A release-day legality change does not trip the card-data hold by itself.

**UX.** The label is on the card row. The set page, if D-82 allows one, is not this slice.

**Data and API.** Status is a pure function of the printing's legality and the set's release date, from I-67 once that load exists, and from the search response until then.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `preview_card_added {labelled: yes}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** On for guests and signed-in players. The same label everywhere. No flag that hides previews in one surface and not another.

**Open questions.** When Scryfall flips a set to legal is observed, not assumed. Universes Beyond images are a lawyer question.

### Definition of done

On a replayed release, a preview card reads "Preview: legal in Commander from 5 February 2027" in search, the editor and the copilot; on the day its set turns legal, the Oracle file loads without the owner's confirmation; and the release page lists every playbook row as done, due, late, skipped or not built.

---

