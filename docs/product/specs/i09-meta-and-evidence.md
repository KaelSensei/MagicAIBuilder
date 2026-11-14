# I-09: Meta And Evidence

**Status:** Building  
**Priority:** Next  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

recommendations combine community patterns and competitive evidence without hiding uncertainty.

### Goals

- A recommendation is never presented as universal truth: the user can see where it came from, how fresh it is and what its limitations are.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-09-01

As a player looking at a recommendation, I want inclusion, Lift and a model's suggestion labelled apart, so that a popular card is not presented as a fact about my deck.

#### US-09-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-09-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-09-01 Happy path

Given a signed-in player and the English locale
When a row from EDHREC says inclusion or Lift, the cohort when the source has it, and the freshness.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-09-02 Happy path

Given a signed-in player and the English locale
When a missing denominator is said, not treated as zero.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-09-03 Happy path

Given a signed-in player and the English locale
When a data-sourced cut is not labelled as the copilot's cut.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-09-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-09-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-09-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: On for public and private decks. No flag. Tournament win rates stay blocked on TopDeck's terms.

#### AC-09-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-09-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-09-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The source sits on the row. A refresh the player did not ask for does not skip the cache.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

The EDHREC feed and the one Spellbook lookup per deck stay the sources. No local Lift is computed from the top-20 feed. `/api/combos` stays rate-limited.

### Analytics and telemetry

`recommendation_shown {source: edhrec, spellbook or model, labelled: yes or no}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

On for public and private decks. No flag. Tournament win rates stay blocked on TopDeck's terms.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

A written clarification from TopDeck is still the only unblocker for match win rates.

### Sources

- https://www.reddit.com/r/EDH/comments/1vrt8ww/
- https://www.reddit.com/r/EDH/comments/1oxuhqy/
- https://github.com/SpaceCowMedia/commander-spellbook-site/releases/tag/v0.84.0
- https://www.reddit.com/r/Moxfield/comments/1wsnch7/
- https://topdeck.gg/developer-terms

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-09-101

As a player, I want the product to complete source, timestamp and sample-window disclosure across every external recommendation surface; EDHREC sample counts are shown where available, but the source does not provide a trustworthy sampling date range., so that recommendations combine community patterns and competitive evidence without hiding uncertainty.

#### AC-09-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Complete source, timestamp and sample-window disclosure across every external recommendation surface; EDHREC sample counts are shown where available, but the source does not provide a trustworthy sampling date range.

#### AC-09-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-09-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-09-102

As a player, I want the product to separate "popular" (inclusion), "contextual association" (EDHREC Lift: inclusion in this context divided by inclusion in the reference set of potential decks), "tournament observed" and "AI suggested"., so that recommendations combine community patterns and competitive evidence without hiding uncertainty.

#### AC-09-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Separate "popular" (inclusion), "contextual association" (EDHREC Lift: inclusion in this context divided by inclusion in the reference set of potential decks), "tournament observed" and "AI suggested". Lift is centered on 1. It is not a win rate and it is not a causal claim. Show the cohort and denominator when the source provides them, and say when they are missing. Do not calculate a local Lift figure from the top-20 feed: that figure needs the reference denominator, a compatible source and an access contract first. See the 8 November 2026 notes in competitive-landscape.md.

#### AC-09-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-09-105 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-09-103

As a player, I want the product to add source-health telemetry and contract tests for every scraper or external feed; EDHREC card-list shape now has focused regression coverage., so that recommendations combine community patterns and competitive evidence without hiding uncertainty.

#### AC-09-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Add source-health telemetry and contract tests for every scraper or external feed; EDHREC card-list shape now has focused regression coverage.

#### AC-09-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-09-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-09-104

As a player, I want the product to add trend views that respect EDHREC top-20 truncation bounds., so that recommendations combine community patterns and competitive evidence without hiding uncertainty.

#### AC-09-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Add trend views that respect EDHREC top-20 truncation bounds.

#### AC-09-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-09-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-09-105

As a player, I want the product to revisit richer tournament statistics only under terms that allow this product to show them., so that recommendations combine community patterns and competitive evidence without hiding uncertainty.

#### AC-09-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Revisit richer tournament statistics only under terms that allow this product to show them. Match-level cEDH data exists at TopDeck.gg; its terms are the block (see below).

#### AC-09-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-09-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-09-106

As a player, I want the product to adopt EDHREC's Lift semantics explicitly wherever a co-occurrence number is shown or ranked., so that recommendations combine community patterns and competitive evidence without hiding uncertainty.

#### AC-09-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Adopt EDHREC's Lift semantics explicitly wherever a co-occurrence number is shown or ranked. Lift is a ratio centred on 1 — inclusion in context divided by inclusion at large — and replaced Synergy on /commanders, /combos and /tags on 2026-10-01. Label it as Lift with its definition available on demand; do not relabel it as a synergy percentage or sort it as one.

#### AC-09-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-09-117 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-09-107

As a player, I want the product to re-check the Commander Spellbook integration against the per-deck and per-card combo endpoints added in v0.84.0 (2026-10-20), and cache identical card-list lookups so a much-viewed public deck cannot repeatedly hit the service., so that recommendations combine community patterns and competitive evidence without hiding uncertainty.

#### AC-09-118 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Re-check the Commander Spellbook integration against the per-deck and per-card combo endpoints added in v0.84.0 (2026-10-20), and cache identical card-list lookups so a much-viewed public deck cannot repeatedly hit the service. Show the prerequisites Spellbook lists with each combo, not only a card count: players' most-upvoted 2026 complaint about combo data is a "two-card" combo that needs a third card (407 points, August 2026; 262 points, November 2025). Shipped in #1324: one find-my-combos call per deck, a 6-hour cache keyed on the normalized card list, and each combo's other pieces, conditions, mana and Spellbook link in CombosPanel. The cache is per server instance, and only the first page of results is read.

#### AC-09-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-09-120 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-09-108

As a player, I want the product to stop /api/combos acting as an open proxy to Commander Spellbook., so that recommendations combine community patterns and competitive evidence without hiding uncertainty.

#### AC-09-121 Happy path

Given a downloaded deck and no network
When the player uses this behaviour
Then the behaviour holds: Stop /api/combos acting as an open proxy to Commander Spellbook. src/app/api/combos/route.ts forwarded any cards value to backend.commanderspellbook.com for any caller, with no cache and no rate limit, and fetchCombosForDeck in src/lib/combos/spellbook.ts called it once per distinct card, about 100 lookups per deck view, cached only in the browser's memory. Shipped in #1324: POST /api/combos takes a bounded deck list, allows 30 lookups a minute per address and 60 Spellbook calls a minute per instance, and serves repeats from its cache. The limits are per instance (M2).

#### AC-09-122 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-09-123 Edge

Given a card the player marked as a proxy
When ownership and the deck total are shown
Then the card is labelled proxy and is not counted as a physical copy the player owns

#### US-09-109

As a player, I want **L3, low (security audit, 2026-11-10):** honour ?refresh on GET /api/meta/[commanderSlug] only when it means true, and only for a signed-in user., so that recommendations combine community patterns and competitive evidence without hiding uncertainty.

#### AC-09-124 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **L3, low (security audit, 2026-11-10):** honour ?refresh on GET /api/meta/[commanderSlug] only when it means true, and only for a signed-in user. z.coerce.boolean() in src/app/api/meta/[commanderSlug]/route.ts reads refresh=false as true, so any anonymous caller can skip the 24-hour cache and make the server scrape EDHREC and MTGTop8 again. Fix branch in flight: fix/api-small-hardening, no PR yet.

#### AC-09-125 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-09-126 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-09-110

As a player, I want the product to label data-sourced cuts apart from the copilot's AI cuts., so that recommendations combine community patterns and competitive evidence without hiding uncertainty.

#### AC-09-127 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Label data-sourced cuts apart from the copilot's AI cuts. EDHREC Recs scores adds and cuts for a pasted list (cut scores came back on 2026-10-22), and Archidekt shows EDHREC's recommended cuts in its editor since March 2026. Apply I-03's rules-aware check to data-sourced recommendations, so a popular card that cannot work with this commander is filtered or labelled. A comment under Moxfield's editor preview asked for cuts beside recommendations (r/Moxfield, 2026-09-29, 1 point). The score is low. The job is the same as this item.

#### AC-09-128 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-09-129 Edge

Given a list where one name does not resolve
When the player confirms
Then the unresolved name is shown first and nothing is written until they accept that list

### UX states for this feature

The player-visible outcome is: recommendations combine community patterns and competitive evidence without hiding uncertainty.

| State            | What the player sees                                                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty            | A sentence that names what is missing and the next action. No invented row, author, price or score.                                                   |
| Loading          | A busy state that keeps the layout still. The previous confirmed content stays until the new content is ready.                                        |
| Error            | The catalogue message, what was not saved, and a retry. The last confirmed edit is still there.                                                       |
| Partial          | Known rows are shown. Unknown rows are labelled unknown. A short list is not padded to look finished.                                                 |
| Stale            | If this feature shows a date, the date is the one that was stored. A missing date is absent, not guessed.                                             |
| Guest            | A signed-out player sees only what the rollout allows. A control that needs an account explains that, and does not fail with a raw 401.               |
| Signed-in        | Writes go to that account only. Another player's notes, budget and collection are not in the response.                                                |
| English          | New controls use the `en` catalogue.                                                                                                                  |
| French           | New controls use the `fr` catalogue. A French URL does not show a hard-coded English control.                                                         |
| Dormant catalogs | `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` keep every new key and may reuse the English text until a person reviews them. They are not routed. |
| Keyboard         | The primary action and every new control can be reached without a pointer. Focus is visible and returns when a dialog closes.                         |
| Screen reader    | Each new control has an accessible name. A status change is announced in words, not only by colour.                                                   |
| Colour           | A warning and an error differ by text or icon as well as hue, in both themes.                                                                         |
| Success          | The completed action is confirmed in words. A second identical action does not duplicate the write.                                                   |

### Alternate paths

- The player cancels before confirming. Nothing is written.
- The player confirms, the request fails, and they retry. The retry uses the last confirmed state, not a mixture of the failed attempt and the old one.
- The player switches locale in the middle of the flow. The draft they already typed is kept. Chrome strings switch. Card names and oracle text stay the printing's language.
- Two writes overlap. Each field rolls back to its own last confirmed value. One failure does not undo the other field's success.

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-09: Meta And Evidence

**Outcome:** recommendations combine community patterns and competitive evidence without hiding uncertainty.

**Status:** Building
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
- [ ] Separate "popular" (inclusion), "contextual association" (EDHREC Lift: inclusion in this context divided by inclusion in the reference set of potential decks), "tournament observed" and "AI suggested". Lift is centered on 1. It is not a win rate and it is not a causal claim. Show the cohort and denominator when the source provides them, and say when they are missing. Do not calculate a local Lift figure from the top-20 feed: that figure needs the reference denominator, a compatible source and an access contract first. See the 8 November 2026 notes in [`competitive-landscape.md`](../competitive-landscape.md).
- [ ] Add source-health telemetry and contract tests for every scraper or external feed; EDHREC card-list shape now has focused regression coverage.
  - [x] Reject malformed MTGTop8 search results so a false empty feed cannot overwrite a valid tournament cache (#1094). Other source-health coverage remains open.
- [ ] Add trend views that respect EDHREC top-20 truncation bounds.
  - [x] Avoid inferring a rise or fall bound from a snapshot with fewer than 20 distinct cards (#1098). Broader trend-view disclosure remains open.
- [ ] Revisit richer tournament statistics only under terms that allow this product to show them. Match-level cEDH data exists at TopDeck.gg; its terms are the block (see below).
- [ ] Adopt EDHREC's Lift semantics explicitly wherever a co-occurrence number is shown or ranked. Lift is a ratio centred on 1 — inclusion in context divided by inclusion at large — and replaced Synergy on `/commanders`, `/combos` and `/tags` on 2026-10-01. Label it as Lift with its definition available on demand; do not relabel it as a synergy percentage or sort it as one.
- [x] Re-check the Commander Spellbook integration against the per-deck and per-card combo endpoints added in v0.84.0 (2026-10-20), and cache identical card-list lookups so a much-viewed public deck cannot repeatedly hit the service. Show the prerequisites Spellbook lists with each combo, not only a card count: players' most-upvoted 2026 complaint about combo data is a "two-card" combo that needs a third card ([407 points, August 2026](https://www.reddit.com/r/EDH/comments/1vrt8ww/); [262 points, November 2025](https://www.reddit.com/r/EDH/comments/1oxuhqy/)). Shipped in #1324: one `find-my-combos` call per deck, a 6-hour cache keyed on the normalized card list, and each combo's other pieces, conditions, mana and Spellbook link in `CombosPanel`. The cache is per server instance, and only the first page of results is read.
  - **Corrected 2026-11-10:** v0.84.0 is a release of Commander Spellbook's website repository; it added card pages and sitemaps built from the bulk export, not API endpoints ([release](https://github.com/SpaceCowMedia/commander-spellbook-site/releases/tag/v0.84.0)). The backend's v7.3.0 of the same day only tests that clients ignore unknown fields, and the per-deck lookup #1324 uses existed before. The shipped work stands; only the reason given for it was wrong.
- [x] Stop `/api/combos` acting as an open proxy to Commander Spellbook. `src/app/api/combos/route.ts` forwarded any `cards` value to `backend.commanderspellbook.com` for any caller, with no cache and no rate limit, and `fetchCombosForDeck` in `src/lib/combos/spellbook.ts` called it once per distinct card, about 100 lookups per deck view, cached only in the browser's memory. Shipped in #1324: `POST /api/combos` takes a bounded deck list, allows 30 lookups a minute per address and 60 Spellbook calls a minute per instance, and serves repeats from its cache. The limits are per instance (M2).
- [ ] **L3, low (security audit, 2026-11-10):** honour `?refresh` on `GET /api/meta/[commanderSlug]` only when it means true, and only for a signed-in user. `z.coerce.boolean()` in `src/app/api/meta/[commanderSlug]/route.ts` reads `refresh=false` as true, so any anonymous caller can skip the 24-hour cache and make the server scrape EDHREC and MTGTop8 again. Fix branch in flight: `fix/api-small-hardening`, no PR yet.
- [ ] Label data-sourced cuts apart from the copilot's AI cuts. EDHREC Recs scores adds and cuts for a pasted list (cut scores came back on 2026-10-22), and Archidekt shows EDHREC's recommended cuts in its editor since March 2026. Apply I-03's rules-aware check to data-sourced recommendations, so a popular card that cannot work with this commander is filtered or labelled. A comment under Moxfield's editor preview asked for cuts beside recommendations ([r/Moxfield](https://www.reddit.com/r/Moxfield/comments/1wsnch7/), 2026-09-29, 1 point). The score is low. The job is the same as this item.

### Blocked

- **Goldfish import:** blocked by its Cloudflare managed challenge; do not ship a parser that cannot work reliably.
- **Tournament win rate:** blocked by licence terms, not by missing data. MTGTop8 standings alone do not yield a win rate. Match-level cEDH data does exist: TopDeck.gg's API v2 returns each table's players in seat order and its winner. EDHTop16 computes a win rate (wins divided by wins, losses and draws) and shows each entry's record from TopDeck.gg data. Its GraphQL endpoint accepts only persisted queries, so it is not a usable public API (checked 2026-11-09). TopDeck.gg's [Developer Terms](https://topdeck.gg/developer-terms), effective 2026-10-27, forbid selling, licensing or otherwise commercializing API data (§7), and allow displaying public event data with a visible credit and link (§8.3, §6.1). Whether a paid product showing derived win rates counts as commercializing is unclear; a written clarification from TopDeck.gg is the cheapest unblocker. Reusing EDHTop16, cedhtools or cedhstats outputs likely inherits the same restriction. Casual pod logs ([I-35](i35-pod-game-log.md)) are a different population and do not unblock this item.

### Enrichment (2026-11-11)

**User story.** As a player looking at a recommendation, I want inclusion, Lift and a model's suggestion labelled apart, so that a popular card is not presented as a fact about my deck.

**Acceptance.**

- A row from EDHREC says inclusion or Lift, the cohort when the source has it, and the freshness.
- A missing denominator is said, not treated as zero.
- A data-sourced cut is not labelled as the copilot's cut.

**UX.** The source sits on the row. A refresh the player did not ask for does not skip the cache.

**Data and API.** The EDHREC feed and the one Spellbook lookup per deck stay the sources. No local Lift is computed from the top-20 feed. `/api/combos` stays rate-limited.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `recommendation_shown {source: edhrec, spellbook or model, labelled: yes or no}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** On for public and private decks. No flag. Tournament win rates stay blocked on TopDeck's terms.

**Open questions.** A written clarification from TopDeck is still the only unblocker for match win rates.

### Fourteenth pass (2026-11-14)

Mana Grove's pricing page, read 2026-11-14, includes "combo detections" in the free plan at 10 a month, and unlimited detections from the Starter plan up ([pricing](https://themanagrove.com/pricing)). The one Spellbook lookup per deck that this initiative already shows is evidence about the player's list. I-30 requirement 1.7, added the same day, says that lookup stays free. This section is the case.

#### US-09-14-01

As a player, I want the combos in this deck listed without a remaining-detections count, so that a monthly allowance is not sitting on a fact.

**Passing.** The combo panel renders for a signed-in player and for a guest reading a public deck. It shows the lines the lookup returned, the date of the lookup, and no allowance. A failed lookup says the lookup failed and leaves the last confirmed lines in place.

**Non-passing.** A counter of detections remaining. A panel that hides lines until a plan is paid. A second combo database built to avoid the allowance. Combos still come from Commander Spellbook through the one lookup.

**Acceptance.** No entitlement check on the combo route. The template test fails if the panel's strings include "detections remaining" or "upgrade to see combos".

**Open question.** None beyond I-30's. If Spellbook itself starts requiring a paid key, that is a new source problem for I-67 and I-09, and this pass did not read such a requirement. Commander Spellbook's home page, fetched the same day, returned a title and no changelog.

### Definition of done

A recommendation is never presented as universal truth: the user can see where it came from, how fresh it is and what its limitations are.

---
