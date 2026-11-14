# I-08: Share, Compare And Learn

**Status:** Building  
**Priority:** Next  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

public decks help players learn and improve while owners keep control of their work.

### Goals

- A user can discover, inspect, compare and safely fork a deck without leaking private data or losing attribution.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-08-01

As a player publishing a deck, I want other people to read, compare and fork it without seeing my notes or my budget, so that sharing is not a leak.

#### US-08-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-08-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-08-01 Happy path

Given a signed-in player and the English locale
When a public response contains only the public field list.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-08-02 Happy path

Given a signed-in player and the English locale
When a fork copies the primer only when the owner allowed it.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-08-03 Happy path

Given a signed-in player and the English locale
When a card note is public only when its own switch is on, and that switch defaults off.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-08-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-08-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-08-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Public read is signed-out. Forking while signed out goes through I-72's sign-up and returns to the deck. Publishing is signed-in.

#### AC-08-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-08-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-08-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

Seeking feedback asks one question. The primer editor shows source and preview. The 2,000-character cap is visible before the player hits it.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Public and share reads use the existing allowlists. Notes stay off those lists until the switch exists. No new write route for visitors.

### Analytics and telemetry

`deck_forked {primer_copied: yes or no, signed_in: yes or no}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Public read is signed-out. Forking while signed out goes through I-72's sign-up and returns to the deck. Publishing is signed-in.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

The primer length cap is still undecided. I-83 will not write the primer until it is.

### Sources

- https://edhrec.com/articles/digital-deckbuilding-archidekt-card-packages-and-edhrec-staples
- https://netrunnerdb.com/en/decklist/6092a490-4d1a-4f83-b9eb-440e7d07c657
- https://archidekt.com/features

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-08-101

As a player, I want the product to extend side-by-side comparison from owned decks to public decks., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-100 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Extend side-by-side comparison from owned decks to public decks.

#### AC-08-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-102

As a player, I want the product to fork a public deck with clear attribution and a clean ownership boundary., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-103 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Fork a public deck with clear attribution and a clean ownership boundary.

#### AC-08-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-103

As a player, I want the product to show "why this deck differs" using curve, budget and color identity., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Show "why this deck differs" using curve, budget and color identity.

#### AC-08-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-104

As a player, I want the product to extend the comparison explanation with card-role differences., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Extend the comparison explanation with card-role differences.

#### AC-08-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-105

As a player, I want the product to persist authenticated, deduplicated abuse reports for public decks without exposing moderation data publicly., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-112 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Persist authenticated, deduplicated abuse reports for public decks without exposing moderation data publicly.

#### AC-08-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-106

As a player, I want the product to provide a restricted moderation review queue API with auditable decisions., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Provide a restricted moderation review queue API with auditable decisions.

#### AC-08-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-117 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-107

As a player, I want the product to add the public-deck report action and moderator review interface before opening broader social features., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-118 Happy path

Given a signed-in operator
When the player uses this behaviour
Then the behaviour holds: Add the public-deck report action and moderator review interface before opening broader social features.

#### AC-08-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-120 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-108

As a player, I want the product to build a lightweight following feed only if discovery data shows repeated use., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-121 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Build a lightweight following feed only if discovery data shows repeated use.

#### AC-08-122 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-123 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-109

As a player, I want the product to keep private decks and share tokens out of search indexes., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-124 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Keep private decks and share tokens out of search indexes.

#### AC-08-125 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-126 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-110

As a player, I want the product to provide a structured primer template covering game plan, mulligans, win conditions, key interactions and budget alternatives., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-127 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Provide a structured primer template covering game plan, mulligans, win conditions, key interactions and budget alternatives.

#### AC-08-128 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-129 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-111

As a player, I want the product to render published primers with safe Markdown headings, lists and navigation., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-130 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Render published primers with safe Markdown headings, lists and navigation.

#### AC-08-131 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-132 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-112

As a player, I want the product to add explicit sequencing guidance to the structured primer template., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-133 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Add explicit sequencing guidance to the structured primer template.

#### AC-08-134 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-135 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-113

As a player, I want the product to let an owner mark a public deck as "seeking feedback" and ask a focused question instead of only exposing a generic comment box., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-136 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Let an owner mark a public deck as "seeking feedback" and ask a focused question instead of only exposing a generic comment box.

#### AC-08-137 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-138 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-114

As a player, I want the product to add in-product notifications for replies, mentions, follows and changes to explicitly watched decks, with per-event controls., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-139 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Add in-product notifications for replies, mentions, follows and changes to explicitly watched decks, with per-event controls.

#### AC-08-140 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-141 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-115

As a player, I want the product to persist private folders for saved public decks without claiming ownership or exposing decks that later become private., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-142 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Persist private folders for saved public decks without claiming ownership or exposing decks that later become private.

#### AC-08-143 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-144 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-116

As a player, I want the product to add folder management to the community UI., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-145 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Add folder management to the community UI.

#### AC-08-146 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-147 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-117

As a player, I want the product to decide whether decks from followed builders should share the saved-deck folder model., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-148 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Decide whether decks from followed builders should share the saved-deck folder model.

#### AC-08-149 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-150 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-118

As a player, I want the product to persist reusable community card packages with stable author attribution and private-by-default publishing controls., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-151 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Persist reusable community card packages with stable author attribution and private-by-default publishing controls.

#### AC-08-152 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-153 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-119

As a player, I want the product to preview package additions against deck color identity, singleton and ban rules., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-154 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Preview package additions against deck color identity, singleton and ban rules.

#### AC-08-155 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-156 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-120

As a player, I want the product to apply a reviewed package diff without silently replacing existing cards., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-157 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Apply a reviewed package diff without silently replacing existing cards.

#### AC-08-158 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-159 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-121

As a player, I want the product to apply only individually ready package rows, even when a blocked row shares the same printing identifier (#861)., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-160 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Apply only individually ready package rows, even when a blocked row shares the same printing identifier (#861).

#### AC-08-161 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-162 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-122

As a player, I want the product to reserve package copy capacity only for ready rows, so rejected rows do not prevent later valid additions within the existing limits (#863)., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-163 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Reserve package copy capacity only for ready rows, so rejected rows do not prevent later valid additions within the existing limits (#863).

#### AC-08-164 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-165 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-123

As a player, I want the product to return only public fields from GET /api/deck/[id]., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-166 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Return only public fields from GET /api/deck/[id]. For a public deck, src/app/api/deck/[id]/route.ts returned every Deck and DeckCard column except shareToken to any caller, signed in or not, including folderId, budget, manualBracket, shareEnabled, the owner's userId and each card's notes. Shipped in #1312: every viewer but the owner gets the fields of PUBLIC_DECK_SELECT (src/lib/deck/public-deck-select.ts), the visibility rule sits in the query, and the response types derive from the allowlist; the owner's view is unchanged. I-36 slice 1 makes one public projection the rule for every public surface. The missing rate limit is an I-05 item.

#### AC-08-167 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-168 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-08-124

As a player, I want the product to return only the fields the share view needs from GET /api/share/[token]., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-169 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Return only the fields the share view needs from GET /api/share/[token]. src/app/api/share/[token]/route.ts loaded the deck with include: { cards: true } and stripped only shareToken, so a link holder received userId, budget, manualBracket, folderId, each card's notes and every column added later. Shipped in #1325: the route reads SHARED_DECK_SELECT (src/lib/deck/shared-deck-select.ts), which lists only what the share page renders, and the share types derive from it. A private deck is still readable at its token. "Fork this deck" on a private deck's share page still fails, because the fork route requires a public deck. I-38 records the same defect.

#### AC-08-170 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-171 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-08-125

As a player, I want the product to keep French share links out of crawlers too., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-172 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Keep French share links out of crawlers too. src/app/robots.ts disallows /share/, /builder/ and /collection/, but French pages are served under /fr/ (localePrefix: "as-needed" in src/i18n/routing.ts), and none of the French paths is disallowed. A French share page relies on its noindex tag alone. Found by the I-56 spec, whose gift page needs the rule under both prefixes.

#### AC-08-173 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-174 Edge

Given the French locale
When the new controls render
Then they come from the French catalogue and are not hard-coded English

#### US-08-126

As a player, I want the product to remove or bind the social image route., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-175 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Remove or bind the social image route. src/app/api/og/route.tsx renders a 1200×630 image from free-text title, commander and colors query parameters for any caller, and no page or test references it, so anyone can print arbitrary text under the product's name. I-36 slice 2 replaces it with an image built only from stored deck data.

#### AC-08-176 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-177 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-127

As a player, I want the product to decide the primer's length limit together with its template., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-178 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Decide the primer's length limit together with its template. The server caps Deck.description, which holds the primer, at 2,000 characters (src/lib/validation/deck.ts, mirrored by maxLength in src/components/deck/DeckDescriptionEditor.tsx). The six-section template's own headings and prompts use 382 of them in English and 463 in French. I-37's split primer editor and I-36's video sections assume longer primers.

#### AC-08-179 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-180 Edge

Given the French locale
When the new controls render
Then they come from the French catalogue and are not hard-coded English

#### US-08-128

As a player, I want **L1, low (security audit, 2026-11-10):** build a fork from the public fields only., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-181 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then **L1, low (security audit, 2026-11-10):** build a fork from the public fields only. src/app/api/decks/[id]/fork/route.ts loads the whole public deck, and src/lib/deck/fork.ts copies budget, manualBracket and every card's notes into the new deck and the 201 response, past PUBLIC_DECK_SELECT. Notes cannot be saved today (I-01); once they can, this becomes medium. Fix branch in flight: fix/api-small-hardening, no PR yet.

#### AC-08-182 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-183 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-08-129

As a player, I want **L6, low (security audit, 2026-11-10):** bound the commander discovery query., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-184 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then **L6, low (security audit, 2026-11-10):** bound the commander discovery query. src/app/api/community/commanders/[slug]/decks/route.ts loads every public deck for the slug with all its votes and ratings, then keeps 50 in memory, with no rate limit and no cache. Aggregate the scores in SQL with LIMIT 50, and add s-maxage.

#### AC-08-185 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-186 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-130

As a player, I want the product to a per-deck switch "Allow my primer to be copied", off by default for new public decks (D-93); a fork always keeps the attribution link., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-187 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: A per-deck switch "Allow my primer to be copied", off by default for new public decks (D-93); a fork always keeps the attribution link. buildForkData copies description on every fork (src/lib/deck/fork.ts, after #1336). Moxfield has "Allow Primer to be Duplicated" (code, 2026-05-14). Added 2026-11-11.

#### AC-08-188 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-189 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-131

As a player, I want the product to packages may hold colour-generic slots ("one basic of each colour", "the colour pair's signet"), resolved against the commander's identity in the apply preview, and show a price band from I-32's market., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-190 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Packages may hold colour-generic slots ("one basic of each colour", "the colour pair's signet"), resolved against the commander's identity in the apply preview, and show a price band from I-32's market. Archidekt's default packages "automatically adjust to the color identity of your selected commander" with a "$" band (EDHREC, 2024-02-07). CardPackageCard stores fixed Scryfall IDs (prisma/schema.prisma). Added 2026-11-11.

#### AC-08-191 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-192 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-08-132

As a player, I want the product to a public deck lists the public forks it inspired, beside its "forked from" credit., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-193 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: A public deck lists the public forks it inspired, beside its "forked from" credit. NetrunnerDB shows "Derived from" and "Inspiration for" on decklists (decklist, published 2018-07-05, seen 2026-11-10). Added 2026-11-11.

#### AC-08-194 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-195 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-133

As a player, I want the product to whether a published I-79 table set takes likes and comments is decided here, with I-79 slice 11 (neighbour change from I-79, 2026-11-11)., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-196 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Whether a published I-79 table set takes likes and comments is decided here, with I-79 slice 11 (neighbour change from I-79, 2026-11-11).

#### AC-08-197 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-198 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-134

As a player, I want the product to once card notes save (I-01), a per-note switch "Show on the public page", off by default., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-199 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Once card notes save (I-01), a per-note switch "Show on the public page", off by default. A public note uses the public projection. A private note never does.

#### AC-08-200 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-201 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-08-135

As a player, I want the product to later, and not scheduled: hide the Considering zone on a public deck., so that public decks help players learn and improve while owners keep control of their work.

#### AC-08-202 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Later, and not scheduled: hide the Considering zone on a public deck. Archidekt's board shows that request at 27 points, seen 2026-11-11 (features). The evidence is thin.

#### AC-08-203 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-08-204 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: public decks help players learn and improve while owners keep control of their work.

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

## I-08: Share, Compare And Learn

**Outcome:** public decks help players learn and improve while owners keep control of their work.

**Status:** Building
**Priority:** Next

### Already shipped

- Public profiles and public/private decks.
- Shareable read-only deck pages.
- Community discovery by commander.
  - It orders decks by community votes. Whether it keeps that order or aligns with [I-75](i75-finding-public-decks.md)'s browse page on recency, under the boundary that popularity is not advice, is owner decision [D-83](../owner-decisions.md#product-scope-and-non-goals) (2026-11-10); the shipped order stays until then.
- Ratings, reviews, votes, follows and threaded comments.
- Deck duplication and snapshots.
- Side-by-side comparison for two owned decks, including card and summary differences.

### Remaining scope

- [x] Extend side-by-side comparison from owned decks to public decks.
- [x] Fork a public deck with clear attribution and a clean ownership boundary.
- [x] Show "why this deck differs" using curve, budget and color identity.
- [x] Extend the comparison explanation with card-role differences.
- [x] Persist authenticated, deduplicated abuse reports for public decks without exposing moderation data publicly.
- [x] Provide a restricted moderation review queue API with auditable decisions.
- [x] Add the public-deck report action and moderator review interface before opening broader social features.
- [ ] Build a lightweight following feed only if discovery data shows repeated use.
- [x] Keep private decks and share tokens out of search indexes.
- [x] Provide a structured primer template covering game plan, mulligans, win conditions, key interactions and budget alternatives.
- [x] Render published primers with safe Markdown headings, lists and navigation.
- [x] Add explicit sequencing guidance to the structured primer template.
- [x] Let an owner mark a public deck as "seeking feedback" and ask a focused question instead of only exposing a generic comment box.
- [ ] Add in-product notifications for replies, mentions, follows and changes to explicitly watched decks, with per-event controls.
  - [I-63](i63-one-notification-system.md) slices 1 to 4 deliver this item: one inbox and one settings page, with replies and follows as the first producers. I-08 keeps the events, and mentions and watched decks wait for I-08 to build them. Today `NotificationPreference` stores the four switches with a settings page that nothing links and nothing reads (status note, sixth pass).
- [x] Persist private folders for saved public decks without claiming ownership or exposing decks that later become private.
- [x] Add folder management to the community UI.
- [ ] Decide whether decks from followed builders should share the saved-deck folder model.
- [x] Persist reusable community card packages with stable author attribution and private-by-default publishing controls.
- [x] Preview package additions against deck color identity, singleton and ban rules.
- [x] Apply a reviewed package diff without silently replacing existing cards.
- [x] Apply only individually ready package rows, even when a blocked row shares the same printing identifier (#861).
- [x] Reserve package copy capacity only for ready rows, so rejected rows do not prevent later valid additions within the existing limits (#863).
- [x] Return only public fields from `GET /api/deck/[id]`. For a public deck, `src/app/api/deck/[id]/route.ts` returned every `Deck` and `DeckCard` column except `shareToken` to any caller, signed in or not, including `folderId`, `budget`, `manualBracket`, `shareEnabled`, the owner's `userId` and each card's `notes`. Shipped in #1312: every viewer but the owner gets the fields of `PUBLIC_DECK_SELECT` (`src/lib/deck/public-deck-select.ts`), the visibility rule sits in the query, and the response types derive from the allowlist; the owner's view is unchanged. [I-36](i36-creator-and-embed-toolkit.md) slice 1 makes one public projection the rule for every public surface. The missing rate limit is an I-05 item.
- [x] Return only the fields the share view needs from `GET /api/share/[token]`. `src/app/api/share/[token]/route.ts` loaded the deck with `include: { cards: true }` and stripped only `shareToken`, so a link holder received `userId`, `budget`, `manualBracket`, `folderId`, each card's `notes` and every column added later. Shipped in #1325: the route reads `SHARED_DECK_SELECT` (`src/lib/deck/shared-deck-select.ts`), which lists only what the share page renders, and the share types derive from it. A private deck is still readable at its token. "Fork this deck" on a private deck's share page still fails, because the fork route requires a public deck. [I-38](i38-trust-safety-and-user-rights.md) records the same defect.
- [ ] Keep French share links out of crawlers too. `src/app/robots.ts` disallows `/share/`, `/builder/` and `/collection/`, but French pages are served under `/fr/` (`localePrefix: "as-needed"` in `src/i18n/routing.ts`), and none of the French paths is disallowed. A French share page relies on its `noindex` tag alone. Found by the I-56 spec, whose gift page needs the rule under both prefixes.
  - [ ] Keep localized private pages out of robots (fix branch `fix/robots-localized-private-paths` queued, 2026-11-11).
- [ ] Remove or bind the social image route. `src/app/api/og/route.tsx` renders a 1200×630 image from free-text `title`, `commander` and `colors` query parameters for any caller, and no page or test references it, so anyone can print arbitrary text under the product's name. [I-36](i36-creator-and-embed-toolkit.md) slice 2 replaces it with an image built only from stored deck data.
- [ ] Decide the primer's length limit together with its template. The server caps `Deck.description`, which holds the primer, at 2,000 characters (`src/lib/validation/deck.ts`, mirrored by `maxLength` in `src/components/deck/DeckDescriptionEditor.tsx`). The six-section template's own headings and prompts use 382 of them in English and 463 in French. I-37's split primer editor and I-36's video sections assume longer primers.
- [ ] **L1, low (security audit, 2026-11-10):** build a fork from the public fields only. `src/app/api/decks/[id]/fork/route.ts` loads the whole public deck, and `src/lib/deck/fork.ts` copies `budget`, `manualBracket` and every card's `notes` into the new deck and the 201 response, past `PUBLIC_DECK_SELECT`. Notes cannot be saved today (I-01); once they can, this becomes medium. Fix branch in flight: `fix/api-small-hardening`, no PR yet.
  - [x] Build a fork from the public fields only: budget, the bracket override and card notes no longer reach the fork (#1336, 2026-11-10). The primer is still copied on every fork; whether it should be is [D-93](../owner-decisions.md#community-and-moderation).
- [ ] **L6, low (security audit, 2026-11-10):** bound the commander discovery query. `src/app/api/community/commanders/[slug]/decks/route.ts` loads every public deck for the slug with all its votes and ratings, then keeps 50 in memory, with no rate limit and no cache. Aggregate the scores in SQL with `LIMIT 50`, and add `s-maxage`.
  - Delivered by [I-75](i75-finding-public-decks.md) slice 2 (re-pointed 2026-11-10): the route reads I-75's search projection through its query contract, with keyset pages, a statement timeout, a CDN cache and a rate limit, and the commander page becomes a preset of that query.
- [ ] A per-deck switch "Allow my primer to be copied", off by default for new public decks ([D-93](../owner-decisions.md#community-and-moderation)); a fork always keeps the attribution link. `buildForkData` copies `description` on every fork (`src/lib/deck/fork.ts`, after #1336). Moxfield has "Allow Primer to be Duplicated" (code, 2026-05-14). Added 2026-11-11.
- [ ] Packages may hold colour-generic slots ("one basic of each colour", "the colour pair's signet"), resolved against the commander's identity in the apply preview, and show a price band from I-32's market. Archidekt's default packages "automatically adjust to the color identity of your selected commander" with a "$" band ([EDHREC](https://edhrec.com/articles/digital-deckbuilding-archidekt-card-packages-and-edhrec-staples), 2024-02-07). `CardPackageCard` stores fixed Scryfall IDs (`prisma/schema.prisma`). Added 2026-11-11.
- [ ] A public deck lists the public forks it inspired, beside its "forked from" credit. NetrunnerDB shows "Derived from" and "Inspiration for" on decklists ([decklist](https://netrunnerdb.com/en/decklist/6092a490-4d1a-4f83-b9eb-440e7d07c657), published 2018-07-05, seen 2026-11-10). Added 2026-11-11.
- [ ] Whether a published [I-79](i79-table-sets.md) table set takes likes and comments is decided here, with I-79 slice 11 (neighbour change from I-79, 2026-11-11).
- [ ] Once card notes save (I-01), a per-note switch "Show on the public page", off by default. A public note uses the public projection. A private note never does.
- [ ] Later, and not scheduled: hide the Considering zone on a public deck. Archidekt's board shows that request at 27 points, seen 2026-11-11 ([features](https://archidekt.com/features)). The evidence is thin.
      **Twelfth pass, 2026-11-11:** a primer draft filled from stored reports is [I-83](i83-a-primer-draft-filled-from-the-decks-own-reports.md). It does not write this primer, and it does not raise the 2,000-character cap.

**2026-11-09:** MagicAIBuilder's social layer is evaluative: stars, votes, reviews, feedback questions and attributed forks. Moxfield's is broadcast: unique view counts, likes, a follow feed and embeddable decks, and TappedOut sells a blog widget. Creators value broadcast features, because a view count and an embed make a deck link worth posting. No embed route exists under `src/app` and the schema has no view counter. Embeds, public view counts, `[[Card]]` links in primers and video in primers are tracked in [I-36](i36-creator-and-embed-toolkit.md); notifications stay in this initiative. Archidekt's deck help requests (July 2026) add an expiry, a browse page and notifications to what "seeking feedback" does here.

**2026-11-09 (evening):** the deck reports and moderation queue checked above stay shipped. [I-38](i38-trust-safety-and-user-rights.md) now owns moderation beyond decks: reports on comments, reviews, profiles, packages and share links, signed-out notices, hide and restore actions, statements of reasons, appeals and blocking. Today a moderator can only mark a deck report reviewed or dismissed.

### Enrichment (2026-11-11)

**User story.** As a player publishing a deck, I want other people to read, compare and fork it without seeing my notes or my budget, so that sharing is not a leak.

**Acceptance.**

- A public response contains only the public field list.
- A fork copies the primer only when the owner allowed it.
- A card note is public only when its own switch is on, and that switch defaults off.

**UX.** Seeking feedback asks one question. The primer editor shows source and preview. The 2,000-character cap is visible before the player hits it.

**Data and API.** Public and share reads use the existing allowlists. Notes stay off those lists until the switch exists. No new write route for visitors.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `deck_forked {primer_copied: yes or no, signed_in: yes or no}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Public read is signed-out. Forking while signed out goes through I-72's sign-up and returns to the deck. Publishing is signed-in.

**Open questions.** The primer length cap is still undecided. I-83 will not write the primer until it is.

### Fourteenth pass (2026-11-14)

Archidekt's update of 2026-11-12 says deck comparison gained more export options on each section. A comment by Not_Too_Happy at 2026-11-12T22:37:06Z asks for a colour filter, so the writer does not "wade through all my blue stuff" while stealing from another blink deck ([news 28409148](https://archidekt.com/news/28409148)). Comparison of two decks is already shipped. This pass adds the filter and the export as acceptance on that surface. It adds no slice.

#### US-08-14-01

As a player comparing two blue decks, I want to hide one colour for a moment, so that the cards I am moving are the ones on screen.

#### US-08-14-02

As a player, I want each section of the comparison exported as text, so that I can take the "only in the other deck" list somewhere else without copying by hand.

**Passing.** A colour filter hides rows of the other colours in the comparison view. The hidden count is on screen. Clearing the filter shows every row again. No card is removed from either deck. Each section, "in both", "only in this deck" and "only in the other", has a copy action whose text is the quantity and the name of the rows in that section, and nothing else.

**Non-passing.** The filter deletes cards. The export includes a price, a note or a URL the comparison does not show. The export is a file sent to a seller. That handoff is I-32.

**Acceptance.** The filter is view state. The copy action reads the rows the view has not hidden. English and French labels name the section. A colour filter uses a word as well as a pip, so colour is not the only signal.

**Open question.** The comment asks to filter while "stealing" cards into the open deck. Moving a card from a comparison into the open deck is an add, and I-01's recovery applies. Whether the comparison itself grows an "add this row" control, or the player copies the name into search, stays open. Recommended: copy the text, and let the editor's existing add do the write, so comparison stays read-only.

### Definition of done

A user can discover, inspect, compare and safely fork a deck without leaking private data or losing attribution.

---
