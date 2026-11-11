# Spec: Decks A Screen Reader Can Play From (I-24)

> **Initiative:** [I-24 in the roadmap](../roadmap.md) · **Status:** Later — 2027 · **Researched:** 2026-11-08
> **Owns:** assistive-technology-first deck output. **Does not own:** general UI accessibility, which is an acceptance threshold on every I-13 slice.

## Overview

A blind player can own a Commander deck and cannot read it. This initiative makes the deck's complete contents — names, costs, full Oracle text, zones, tokens — reachable through the assistive technology the player already uses, and exportable so it travels to a table.

## What the market does

Nothing in the deckbuilding category serves this. The accessibility work in Magic is being done by players, not by tools.

- A blind player has adapted cards since 2020 using **NFC tags** that let a phone's screen reader read out a full card when the card is brought near. That system carried him to the National Modern Championship in Soria, December 2024.
- **Braille failed** for a structural reason worth recording: it thickens cards, making decks hard to shuffle, and marked cards read as signalling in sanctioned play — a disqualification risk.
- **Accessible Arena**, a fan-made mod by a blind player, adds screen-reader support and keyboard navigation to almost all of MTG Arena. Wizards ships no accessible client itself; that is the community's standing request.

**The read.** The adaptation layer is the phone's screen reader, and the missing input is **structured deck text a screen reader can move through**. Every deckbuilding site, this one included, emits lists designed to be looked at. None emits one designed to be heard. The gap is small in engineering terms and entirely uncontested.

## Current state in this codebase

- Plain-text and multi-format exports exist (I-10); proxy PDF export exists (I-06). Both are visual artifacts.
- Mana symbols render as Scryfall SVGs and as coloured pills. Their text alternatives have never been audited for a screen reader reading a 100-card list aloud — "W U B R G" read as five letters is not the same as "one white, one blue".
- `docs/rules/` carries the comprehensive rules reference, and localized Oracle text is already available where Scryfall provides it.
- I-04 and I-13 carry general accessibility work. This initiative is the **output**, not the chrome.

## Functional requirements

1. **An export shaped to be heard.** Structured headings per zone, one card per block, full Oracle text included, and mana costs spelled in words rather than symbols alone.
2. **Text alternatives everywhere.** Every mana symbol, every bracket indicator, every legality badge carries an alternative that reads correctly in a sentence — in both supported locales.
3. **The deck view is operable.** End-to-end keyboard and screen-reader operation of the deck view, asserted by automated tests rather than claimed in a changelog.
4. **Serve the player's own tools.** No bundled audio player, no in-house reader, no proprietary format. The output targets screen readers already in use.
5. **No separate degraded page.** The accessible path is the same deck, exported differently — not a stripped parallel site that drifts.

## Non-goals

- Building a screen reader, a voice interface, or an audio player.
- NFC tag generation or physical card adaptation.
- Claiming conformance to a standard without an audit. Say what was tested and by whom.
- Replacing the proxy PDF, which serves a different need.

## Testing strategy

- **Automated:** the deck view passes an accessibility scan with zero violations at the level I-13's thresholds require; every interactive element has a visible focus state.
- **Semantic:** the export's heading structure is well-formed and zone transitions are announced.
- **Content:** a mana cost renders as readable words in both locales; a symbol-only alternative fails the test.
- **Human:** at least one assistive-technology user reviews a slice before it is called done. This requirement is not optional and not replaceable by a scanner.

## Delivery slices

| #   | Slice                                                                            | Depends on |
| --- | -------------------------------------------------------------------------------- | ---------- |
| 1   | Audit the deck view with a screen reader and record what fails                   | —          |
| 2   | Text alternatives for mana, bracket and legality indicators, both locales        | 1          |
| 3   | Screen-reader export with zone headings and full Oracle text                     | 2          |
| 4   | Keyboard and screen-reader operation of the deck view, with automated assertions | 2          |
| 5   | Review with an assistive-technology user, and act on it                          | 3, 4       |

Slice 1 is cheap and will likely reshape slices 2 to 4. Do not plan past it in detail.

## Open questions

- Who reviews? A spec that requires a human reviewer and does not name how to find one is a spec that quietly drops the requirement. Commander accessibility communities exist and should be approached before slice 1, not after slice 4.
- Does the export belong in I-10's format contracts, with fixtures and round-trip tests, or is it a one-way artifact? One-way is simpler and probably right: nothing re-imports an audio-shaped list.
- Localized Oracle text is incomplete outside English. The export must state what it could not localise rather than silently mixing languages mid-deck.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.



### Summary and problem

a blind or low-vision player can read a complete deck — names, costs, full Oracle text, zones and tokens — through assistive technology, and take that reading to a table.

### Goals

- A deck's complete contents are reachable by screen reader and by keyboard, and an export exists that an assistive-technology user can read away from the site.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-24-01

As a player, I want a blind or low-vision player can read a complete deck — names, costs, full Oracle text, zones and tokens — through assistive technology, and take that reading to a table., so that this initiative's definition of done is met.

#### US-24-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-24-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-24-01 Happy path

Given a signed-in player and the English locale
When a deck's complete contents are reachable by screen reader and by keyboard, and an export exists that an assistive-technology user can read away from the site.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-24-02 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-24-03 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-24-04 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Follows the initiative priority. Guest and signed-in behaviour is the moved record's.

#### AC-24-05 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-24-06 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-24-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The flow is the one described in the moved record. Empty, loading and error states use a catalogue string, not a blank panel.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

See the moved record. No public route is added unless that record names one.

### Analytics and telemetry

No new event until the moved record names one.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Follows the initiative priority. Guest and signed-in behaviour is the moved record's.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

None beyond the moved record.

### Sources

- No external URL in the moved record. The record itself is the source for behaviour that is already in the code.

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-24-101

As a player, I want the product to an export shaped for screen readers: structured headings per zone, full Oracle text, costs spelled out rather than symbol-only., so that a blind or low-vision player can read a complete deck — names, costs, full Oracle text, zones and tokens — through assistive technology, and take that reading to a table.

#### AC-24-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: An export shaped for screen readers: structured headings per zone, full Oracle text, costs spelled out rather than symbol-only.

#### AC-24-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-24-102 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-24-102

As a player, I want the product to mana symbols carry text alternatives everywhere, including in the deck view., so that a blind or low-vision player can read a complete deck — names, costs, full Oracle text, zones and tokens — through assistive technology, and take that reading to a table.

#### AC-24-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Mana symbols carry text alternatives everywhere, including in the deck view.

#### AC-24-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-24-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-24-103

As a player, I want the product to make the deck view operable end to end by keyboard and screen reader, and assert it in tests rather than claiming it., so that a blind or low-vision player can read a complete deck — names, costs, full Oracle text, zones and tokens — through assistive technology, and take that reading to a table.

#### AC-24-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Make the deck view operable end to end by keyboard and screen reader, and assert it in tests rather than claiming it.

#### AC-24-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-24-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-24-104

As a player, I want the product to do not ship an audio player or a reader of our own., so that a blind or low-vision player can read a complete deck — names, costs, full Oracle text, zones and tokens — through assistive technology, and take that reading to a table.

#### AC-24-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Do not ship an audio player or a reader of our own. Serve the assistive technology the player already uses.

#### AC-24-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-24-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-24-105

As a player, I want the product to involve at least one assistive-technology user before calling any slice done., so that a blind or low-vision player can read a complete deck — names, costs, full Oracle text, zones and tokens — through assistive technology, and take that reading to a table.

#### AC-24-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Involve at least one assistive-technology user before calling any slice done.

#### AC-24-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-24-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-24-106

As a player, I want **Accessibility bundle 2, names and text alternatives (WCAG 1.1.1, 4.1.2, 2.4.6, 3.1.2).** On mobile the logo link has no name (src/components/layout/Header.tsx)., so that a blind or low-vision player can read a complete deck — names, costs, full Oracle text, zones and tokens — through assistive technology, and take that reading to a table.

#### AC-24-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **Accessibility bundle 2, names and text alternatives (WCAG 1.1.1, 4.1.2, 2.4.6, 3.1.2).** On mobile the logo link has no name (src/components/layout/Header.tsx). The buttons that remove a commander, partner or companion are read as "times" (src/components/deck/ColorIdentityBanner.tsx, src/components/deck/MainZoneContent.tsx). The Game Changer and Banned markers are hidden from screen readers (src/components/card/CardListItem.tsx), ⚡ is read as "high voltage", and the read-only star rating is not announced (src/components/community/StarRating.tsx). Some names stay English on /fr, such as "Fork deck" and the playtest counter buttons.

#### AC-24-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-24-117 Edge

Given the French locale
When the new controls render
Then they come from the French catalogue and are not hard-coded English

#### US-24-107

As a player, I want **Accessibility bundle 3, toggle, disclosure and popup state (4.1.2, 2.1.1, 1.3.1).** Segmented controls in ten files show their selected state only by colour, with no aria-pressed, and disclosures in eight files have no aria-expanded., so that a blind or low-vision player can read a complete deck — names, costs, full Oracle text, zones and tokens — through assistive technology, and take that reading to a table.

#### AC-24-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **Accessibility bundle 3, toggle, disclosure and popup state (4.1.2, 2.1.1, 1.3.1).** Segmented controls in ten files show their selected state only by colour, with no aria-pressed, and disclosures in eight files have no aria-expanded. The header, user and locale menus, the playtest hand menu and the set autocomplete lack popup state, arrow keys or Escape with focus return. @radix-ui/react-tabs and Radix DropdownMenu are installed but unused.

#### AC-24-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-24-120 Edge

Given the French locale
When the new controls render
Then they come from the French catalogue and are not hard-coded English

#### US-24-108

As a player, I want **Accessibility bundle 6, page structure, obscured focus and reduced motion (1.3.1, 2.4.1, 2.4.11, 2.3.3).** No page has a skip link (src/app/[locale]/layout.tsx)., so that a blind or low-vision player can read a complete deck — names, costs, full Oracle text, zones and tokens — through assistive technology, and take that reading to a table.

#### AC-24-121 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **Accessibility bundle 6, page structure, obscured focus and reduced motion (1.3.1, 2.4.1, 2.4.11, 2.3.3).** No page has a skip link (src/app/[locale]/layout.tsx). The builder and share pages have no <main>. The builder's only <h1> sits inside the rename button, and its stats panels have no headings. On mobile the builder's tab bar hides focused controls at the bottom of each panel. Framer Motion ignores prefers-reduced-motion. Moving the <h1> changes e2e/accessibility.authed.spec.ts, which finds it through its parent.

#### AC-24-122 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-24-123 Edge

Given the French locale
When the new controls render
Then they come from the French catalogue and are not hard-coded English

### UX states for this feature

The player-visible outcome is: a blind or low-vision player can read a complete deck — names, costs, full Oracle text, zones and tokens — through assistive technology, and take that reading to a table.

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

## I-24: Decks A Screen Reader Can Play From

**Spec:** [`specs/i24-decks-a-screen-reader-can-play-from.md`](i24-decks-a-screen-reader-can-play-from.md)

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

**2026-11-10:** bundles 2, 3 and 6 above come from the accessibility audit recorded under [I-04](i04-ux-stability-and-visual-quality.md). They fix today's app and need not wait for this initiative's 2027 slot; the screen-reader export and deck view build on them.

### Definition of done

A deck's complete contents are reachable by screen reader and by keyboard, and an export exists that an assistive-technology user can read away from the site.

---

