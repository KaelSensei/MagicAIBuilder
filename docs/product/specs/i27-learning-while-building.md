# Spec: Learning While Building (I-27)

> **Initiative:** [I-27 in the roadmap](../roadmap.md) · **Status:** Later — 2027 · **Researched:** 2026-11-08
> **Owns:** authored explanations attached to warnings. **Does not own:** the warnings themselves, which stay in I-03.

## Overview

The product tells a new player their deck breaks colour identity. It does not tell them what colour identity _is_. This initiative attaches a short, authored, sourced explanation to every warning class, reachable in one action, without leaving the deck.

## What the market does

The beginner audience is the largest in Commander and the worst served by tooling. The sweep found two separate worlds that never meet:

- **Tools assume the vocabulary.** EDHREC, Moxfield, Archidekt, the bracket calculators and every AI builder present inclusion rates, Lift, brackets and salt to someone presumed to already know what they mean. DeckCheck's DTI and PowerTune are proprietary scales explained in a support page, not at the point of use.
- **Teaching lives in media.** Tolarian Community College and Commanders Quarters built large audiences explaining this in video; the competitive-landscape document already identifies them as the beginner-influence channel. Written guidance lives in articles on Draftsim, RateMyDecks and PreconForge.

**The gap is the join, again.** Nobody explains the rule _at the moment the rule fires_. A player who has just been told their deck is illegal is the most motivated learner in Magic, and every tool sends them to a search engine.

This product is unusually well placed, and not because of ambition: the assets already exist.

## Current state in this codebase

- `.agents/skills/mtg-rules` and `.agents/skills/mtg-learn` — rules and learning skills already in the repository.
- `docs/rules/` — the comprehensive rules reference, with its dated version.
- I-03 already ships: explanations and next actions for legality warnings, the rule or calculation behind a legality warning shown on demand, and hard errors separated from strategic suggestions.
- `docs/product/user-guide.md` exists.

So I-03 already explains **what the product computed**. This initiative explains **the rule of the game behind it** — a different question, and the one a beginner is actually asking.

## Functional requirements

1. **One explanation per warning class**, not per card: colour identity, singleton, format legality, banlist, Game Changers, companion rules, bracket inputs, deck size.
2. **One action away.** Reachable from the warning itself, inline, without navigation that loses the deck state.
3. **Authored and deterministic.** Written by a person, stored as content, reviewed. **The model never generates rules text** — this is the same boundary I-02 draws around legality, applied to teaching.
4. **Sourced and versioned.** Where an explanation quotes the comprehensive rules, it cites the rule number and the rules version it was written against.
5. **Never a gate.** No lesson blocks a build, no tutorial interrupts, nothing must be dismissed before continuing. The existing onboarding modal — which currently covers the landing page and breaks an e2e test — is the anti-pattern to avoid repeating.
6. **Both locales**, following I-11's rule: an explanation that is not reviewed in a locale is not shown in it.

## Non-goals

- A course, a curriculum, or progress tracking.
- Generating rules explanations with the LLM.
- Replacing the comprehensive rules reference. This links to it; it does not restate it.
- Teaching deckbuilding strategy. The rules are objective; strategy is the copilot's job and is labelled as reasoning.
- Any interruption of an experienced player's flow.

## Testing strategy

- **Coverage:** every warning class the product can raise has an explanation; a class without one fails the test. This is what stops the content drifting behind the code.
- **Determinism:** explanations come from stored content; no provider call occurs on this path.
- **Citation:** an explanation quoting a rule carries a rule number and a rules version.
- **Non-blocking:** with explanations present, every build flow completes without opening one.
- **Locale:** an unreviewed locale shows no explanation rather than an English one.

## Delivery slices

| #   | Slice                                                                                     | Depends on |
| --- | ----------------------------------------------------------------------------------------- | ---------- |
| 1   | Content model, with the coverage test over warning classes                                | —          |
| 2   | Authored explanations for the hard legality classes — colour identity, singleton, banlist | 1          |
| 3   | In-place reveal from the warning, non-blocking                                            | 2          |
| 4   | Rule citations with the rules version                                                     | 2          |
| 5   | Bracket and Game Changers explanations                                                    | 3          |
| 6   | French review and locale gating                                                           | 2          |

Slice 1 is deliberately first: a coverage test that fails when a new warning class ships without an explanation is what keeps this initiative from decaying into half-written help text.

## Open questions

- Who writes them? This is content work with a refresh cadence, and content without an owner dates — `design-system.md` is the cautionary example already in this repository. If nobody owns it, do not start it.
- Does the comprehensive rules version need to be surfaced to the player, or only recorded? Recording it is the minimum; surfacing it may be noise for the beginner this initiative is for.
- Is there an audience overlap with I-15's Rule 0 sheets? A player learning what "extra turns" means and a pod declaring it are the same vocabulary, and sharing the content would keep one definition rather than two.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.



### Summary and problem

a new Commander player can understand _why_ the product flags something, in the moment, without leaving the deck.

### Goals

- Every warning class the product raises can be explained in place, from an authored, sourced note, without leaving the deck.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-27-01

As a player, I want a new Commander player can understand _why_ the product flags something, in the moment, without leaving the deck., so that this initiative's definition of done is met.

#### US-27-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-27-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-27-01 Happy path

Given a signed-in player and the English locale
When every warning class the product raises can be explained in place, from an authored, sourced note, without leaving the deck.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-27-02 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-27-03 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-27-04 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Follows the initiative priority. Guest and signed-in behaviour is the moved record's.

#### AC-27-05 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-27-06 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-27-01 without a pointer
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

#### US-27-101

As a player, I want the product to attach a short, sourced explanation to each warning class — colour identity, singleton, bracket inputs, companion rules — reachable in one action from the warning., so that a new Commander player can understand _why_ the product flags something, in the moment, without leaving the deck.

#### AC-27-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Attach a short, sourced explanation to each warning class — colour identity, singleton, bracket inputs, companion rules — reachable in one action from the warning.

#### AC-27-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-27-102 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-27-102

As a player, I want the product to link to the comprehensive rules reference where a rule is quoted, with its rules version., so that a new Commander player can understand _why_ the product flags something, in the moment, without leaving the deck.

#### AC-27-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Link to the comprehensive rules reference where a rule is quoted, with its rules version.

#### AC-27-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-27-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-27-103

As a player, I want the product to keep explanations deterministic and authored., so that a new Commander player can understand _why_ the product flags something, in the moment, without leaving the deck.

#### AC-27-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Keep explanations deterministic and authored. Do not generate rules text with the model.

#### AC-27-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-27-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-27-104

As a player, I want the product to never block or gate a build behind a lesson., so that a new Commander player can understand _why_ the product flags something, in the moment, without leaving the deck.

#### AC-27-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Never block or gate a build behind a lesson.

#### AC-27-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-27-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a new Commander player can understand _why_ the product flags something, in the moment, without leaving the deck.

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

## I-27: Learning While Building

**Spec:** [`specs/i27-learning-while-building.md`](i27-learning-while-building.md)

**Outcome:** a new Commander player can understand _why_ the product flags something, in the moment, without leaving the deck.

**Status:** Later
**Priority:** Later — 2027
**Impact / effort:** Medium / medium

The beginner audience is the largest in Commander and the one the category serves worst: tier lists and optimisers assume the vocabulary. The repository already carries `mtg-rules` and `mtg-learn` skills and a comprehensive rules reference, and I-03 already explains warnings. This initiative connects assets the project already owns rather than acquiring new ones.

### Scope

- [ ] Attach a short, sourced explanation to each warning class — colour identity, singleton, bracket inputs, companion rules — reachable in one action from the warning.
- [ ] Link to the comprehensive rules reference where a rule is quoted, with its rules version.
  - [I-47](i47-rules-answers-for-this-deck.md) slices 1 and 2 give each rule a versioned address, such as `/rules/comprehensive?rule=903.9a`, and a citation contract; the I-47 spec asks I-27's slice 4 to reuse both.
- [ ] Keep explanations deterministic and authored. Do not generate rules text with the model.
- [ ] Never block or gate a build behind a lesson.

### Definition of done

Every warning class the product raises can be explained in place, from an authored, sourced note, without leaving the deck.

---

