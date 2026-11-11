# I-03: Trustworthy Deck Feedback

**Status:** Building  
**Priority:** Now  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

the player understands what is wrong with a deck and what action would improve it.

### Goals

- A player can answer three questions from the editor: "What is invalid?", "Why is it flagged?" and "What should I do next?"

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-03-01

As a player reading a warning, I want the rule or the source named on the warning, so that I can fix the deck or ignore a preference without guessing.

#### US-03-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-03-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-03-01 Happy path

Given a signed-in player and the English locale
When every warning names a rule number, a ban list date, or an external source with its freshness.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-03-02 Happy path

Given a signed-in player and the English locale
When a Game Changer count uses the current list, not the flag stored when the card was added.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-03-03 Happy path

Given a signed-in player and the English locale
When no new score appears without that name.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-03-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-03-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-03-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: On for everyone, including guests and public decks. No flag.

#### AC-03-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-03-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-03-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The warning is next to the card or the deck total. Colour is not the only difference between a warning and an error.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Warnings are computed on read from card data and the rules version. Stored flags are not the authority. No new public route.

### Analytics and telemetry

`warning_shown {class, has_source: yes or no}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

On for everyone, including guests and public decks. No flag.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

Stop adding scores if a warning still cannot name its rule or its source.

### Open questions

Whether the bracket number moves entirely to I-77's audit is that initiative's decision. This one keeps the warning text.

### Sources

- https://www.reddit.com/r/EDH/comments/1rl9bfa/

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-03: Trustworthy Deck Feedback

**Outcome:** the player understands what is wrong with a deck and what action would improve it.

**Status:** Building
**Priority:** Now

### Already shipped

- Commander color identity and format legality.
- The editor rejects a generic Partner replacement for an existing Father & son pair without changing the saved partner (#1086).
- Deck create and update APIs reject the exact same card ID in commander and partner slots (#1088).
- Banlist and Game Changers detection.
- Bracket scoring across six dimensions. I-28 slice 2, in `fix/official-bracket-definitions`, drops the tutor term, so this becomes five once it merges (noted 2026-11-11, from I-77).
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
  - [ ] Pair commanders only as their partner abilities allow: Doctor's companion, Partner with [name], Partner—X (Survivors, Father & son), Background, Friends forever, either order, and a card with two pairing abilities (fix branch `fix/commander-pairing-variants` queued, 2026-11-11).
- [ ] Version the Game Changers list and bracket rules as dated data rather than code. The list has held at 53 cards since 2026-02-09 and Wizards still labels the brackets beta, so a resumed update cadence should be a data change with an effective date, not a release.
  - **2026-11-10:** [I-48](i48-official-changes-reach-every-deck.md) slice 1 owns this item: a `CommanderRulesVersion` seeded from the five dated lists and one "version in force" reader for the bracket score, the stats, the companion check and `/rules/game-changers`. It waits for I-28 slice 2. I-48 slice 2 then stops trusting the `isGameChanger` and `isBanned` flags stored when each card was added.
- [ ] Flag cards whose rules text cannot work with this deck's commander, as a deterministic rules check labelled apart from recommendations. Examples players cite: Arcane Signet and similar mana sources that produce only the commander's colours, under a colourless commander; a card that names a creature type the commander is not, such as Roaming Throne in a Go-Shintai deck, where "Shrine" is not a creature type. Read the condition from Oracle text and the commander's colour identity and type line, never from a model. Players raise this as EDHREC's main failure: ["Remember…take edhrec suggestions with a Grain of salt"](https://www.reddit.com/r/EDH/comments/1rl9bfa/) reached 368 points on r/EDH in March 2026, and replies in that thread name both cards. The same check filters or labels the data-sourced recommendations in I-09.
  - [x] Flag Arcane Signet, Command Tower and Path of Ancestry under a colourless commander (CR 903.4, 106.5), as a deterministic, labelled rules check (#1328, 2026-11-10). The creature-type case, such as Roaming Throne under Go-Shintai, stays open.
- [ ] Treat snow-covered basics as basic lands everywhere: copy limits, land counts and every check that names basics (fix branch `fix/snow-covered-basics-are-basic` queued, 2026-11-11).
- [ ] Every bracket estimate shows its floors, terms, cards and certainty, links a frozen audit, and states its accuracy against a constant guess ([I-77](i77-a-bracket-estimate-players-can-audit.md); added 2026-11-11). I-77 answers "Why is it flagged?" for the estimate.

**2026-11-10, seventh pass:** [I-65](i65-how-this-deck-wins.md) is computed feedback in this initiative's sense. It maps the ways a deck can win, with roles, finders, protection and common answers, states facts and counts, and names no fault. This initiative is its closest home; it stays separate because it owns the route model that I-15, I-28, I-02, I-31 and I-54 read. Whether the bracket score's `scoreWinSpeed`, which counts single-label `winCondition` cards, moves to route data is decided here with I-28 and the power meter, from a before-and-after report on fixture decks (I-65 open question 4).

**2026-11-11, eleventh pass:** the audit view, the accuracy statement and the change process for `scoreBracket` belong to [I-77](i77-a-bracket-estimate-players-can-audit.md); this initiative keeps the score. I-77 publishes the estimate as a sum of official floors and heuristic terms, freezes it behind a link and benchmarks it against labelled decks, the way I-70 judges I-02's output.

### Enrichment (2026-11-11)

**User story.** As a player reading a warning, I want the rule or the source named on the warning, so that I can fix the deck or ignore a preference without guessing.

**Acceptance.**
- Every warning names a rule number, a ban list date, or an external source with its freshness.
- A Game Changer count uses the current list, not the flag stored when the card was added.
- No new score appears without that name.

**UX.** The warning is next to the card or the deck total. Colour is not the only difference between a warning and an error.

**Data and API.** Warnings are computed on read from card data and the rules version. Stored flags are not the authority. No new public route.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `warning_shown {class, has_source: yes or no}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** On for everyone, including guests and public decks. No flag.

**Open questions.** Whether the bracket number moves entirely to I-77's audit is that initiative's decision. This one keeps the warning text.

**Kill criteria.** Stop adding scores if a warning still cannot name its rule or its source.

### Definition of done

A player can answer three questions from the editor: "What is invalid?", "Why is it flagged?" and "What should I do next?"

---

