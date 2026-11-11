# I-04: UX Stability And Visual Quality

**Status:** Next  
**Priority:** Now  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

the product feels as reliable and polished as the tools players already use.

### Goals

- The editor remains visually stable while the user searches, hovers, moves cards, saves and navigates between zones on desktop and mobile.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-04-01

As a player who types, drags and uses a keyboard, I want the editor to stay still and give me my typing undo back, so that the page does not fight the browser.

#### US-04-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-04-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-04-01 Happy path

Given a signed-in player and the English locale
When ctrl or Cmd+Z inside a text field undoes typing, not a deck edit.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-04-02 Happy path

Given a signed-in player and the English locale
When a dialog traps focus and returns it when it closes.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-04-03 Happy path

Given a signed-in player and the English locale
When a drag does not move the layout of the card under the pointer.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-04-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-04-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-04-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: On for everyone. The single-key switch stays on by default until a player turns it off, and that choice is local to the browser.

#### AC-04-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-04-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-04-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

One dialog closes at a time. Touch targets that are already 40 px stay that size. A modifier used to add a category must not steal a browser or assistive-technology key.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

No schema change. Shortcuts stay in the existing hook until I-37's registry replaces it.

### Analytics and telemetry

`editor_shortcut_blocked {reason: typing, ime or switch_off}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

On for everyone. The single-key switch stays on by default until a player turns it off, and that choice is local to the browser.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

Revert a change that blocks typing undo, traps focus, or moves the layout during a drag.

### Open questions

Remapping of single keys waits on I-37's registry.

### Sources

- https://www.reddit.com/r/EDH/comments/1r863kj/

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-04-101

As a player, I want the product to bound collection loading to 15 seconds and show a localized retry rather than an endless spinner or a false empty state; retain cached cards after failed refreshes (#1013)., so that the product feels as reliable and polished as the tools players already use.

#### AC-04-100 Happy path

Given a downloaded deck and no network
When the player uses this behaviour
Then the behaviour holds: Bound collection loading to 15 seconds and show a localized retry rather than an endless spinner or a false empty state; retain cached cards after failed refreshes (#1013).

#### AC-04-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-04-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-04-102

As a player, I want the product to time out stalled acquisition-plan loading after 15 seconds and expose its existing localized retry action without losing close/filter cancellation (#995)., so that the product feels as reliable and polished as the tools players already use.

#### AC-04-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Time out stalled acquisition-plan loading after 15 seconds and expose its existing localized retry action without losing close/filter cancellation (#995).

#### AC-04-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-04-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-04-103

As a player, I want the product to fix profile and deck loading states so no request appears to hang indefinitely., so that the product feels as reliable and polished as the tools players already use.

#### AC-04-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Fix profile and deck loading states so no request appears to hang indefinitely.

#### AC-04-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-04-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-04-104

As a player, I want the product to use route-level skeletons and cached session/profile data where safe., so that the product feels as reliable and polished as the tools players already use.

#### AC-04-109 Happy path

Given a downloaded deck and no network
When the player uses this behaviour
Then the behaviour holds: Use route-level skeletons and cached session/profile data where safe.

#### AC-04-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-04-111 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-04-105

As a player, I want the product to remove React refresh loops, hover jitter, layout shifts and unstable card previews., so that the product feels as reliable and polished as the tools players already use.

#### AC-04-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Remove React refresh loops, hover jitter, layout shifts and unstable card previews.

#### AC-04-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-04-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-04-106

As a player, I want the product to make warning panels collapsible and dismissible, with accessible close controls., so that the product feels as reliable and polished as the tools players already use.

#### AC-04-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Make warning panels collapsible and dismissible, with accessible close controls.

#### AC-04-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-04-117 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-04-107

As a player, I want the product to keep the color identity banner subtle: official mana symbols, restrained background and stable dimensions., so that the product feels as reliable and polished as the tools players already use.

#### AC-04-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Keep the color identity banner subtle: official mana symbols, restrained background and stable dimensions.

#### AC-04-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-04-120 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-04-108

As a player, I want the product to make card zoom intentional in "View all cards" contexts, not a global hover effect., so that the product feels as reliable and polished as the tools players already use.

#### AC-04-121 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Make card zoom intentional in "View all cards" contexts, not a global hover effect.

#### AC-04-122 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-04-123 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-04-109

As a player, I want the product to explain the empty EDHREC missing-card filter when all popular cards are already in the deck; removing the filter restores the list., so that the product feels as reliable and polished as the tools players already use.

#### AC-04-124 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Explain the empty EDHREC missing-card filter when all popular cards are already in the deck; removing the filter restores the list.

#### AC-04-125 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-04-126 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-04-110

As a player, I want the product to keep EDHREC recommendation add actions visible without hover, with a 40 px touch target and keyboard focus outline (#1058)., so that the product feels as reliable and polished as the tools players already use.

#### AC-04-127 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Keep EDHREC recommendation add actions visible without hover, with a 40 px touch target and keyboard focus outline (#1058).

#### AC-04-128 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-04-129 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-04-111

As a player, I want the product to make keyboard shortcuts safe while typing and for assistive technology., so that the product feels as reliable and polished as the tools players already use.

#### AC-04-130 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Make keyboard shortcuts safe while typing and for assistive technology. src/hooks/useKeyboardShortcuts.ts handled Ctrl/Cmd shortcuts before it checked whether the focus was in a text field, so Ctrl+Z in a card note undid the last deck change instead of the typing. / and ? stayed silent in text fields, but no setting turned them off or remapped them, which WCAG 2.1.4 (Level A) requires of single-character shortcuts that work outside a focused control. I-37 slice 3 adds the shortcut registry.

#### AC-04-131 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-04-132 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-04-112

As a player, I want the product to preserve the established dark/light design language while improving hierarchy, spacing and responsive behavior., so that the product feels as reliable and polished as the tools players already use.

#### AC-04-133 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Preserve the established dark/light design language while improving hierarchy, spacing and responsive behavior.

#### AC-04-134 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-04-135 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-04-113

As a player, I want the product to add visual regression coverage for the Deck Editor, banner, warning panel and card hover states., so that the product feels as reliable and polished as the tools players already use.

#### AC-04-136 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Add visual regression coverage for the Deck Editor, banner, warning panel and card hover states.

#### AC-04-137 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-04-138 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-04-114

As a player, I want **Accessibility bundle 1, dialogs (WCAG 4.1.2, 2.4.3, 2.1.2, 2.4.11).** src/components/ui/Modal.tsx has no role="dialog", aria-modal or label, no focus trap and no focus restore, and its global Escape listener closes the Export and Proxy dialogs together., so that the product feels as reliable and polished as the tools players already use.

#### AC-04-139 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **Accessibility bundle 1, dialogs (WCAG 4.1.2, 2.4.3, 2.1.2, 2.4.11).** src/components/ui/Modal.tsx has no role="dialog", aria-modal or label, no focus trap and no focus restore, and its global Escape listener closes the Export and Proxy dialogs together. src/components/playtest/PlaytestModal.tsx and src/components/collection/AddToCollectionDialog.tsx leave focus on the page underneath, and the close buttons in ImportDialog.tsx and PrintingSelectorModal.tsx have no name. Rebuild Modal on @radix-ui/react-dialog, which seven dialogs already use. Fix branch in flight: fix/a11y-dialog-focus.

#### AC-04-140 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-04-141 Edge

Given a card the player marked as a proxy
When ownership and the deck total are shown
Then the card is labelled proxy and is not counted as a physical copy the player owns

#### US-04-115

As a player, I want **Accessibility bundle 4, forms and status messages (1.3.1, 3.3.2, 1.3.5, 4.1.3, 2.2.1).** The builder search, the search filters, the import, bulk-edit and export text boxes, the life tracker, snapshots, the wizard and the comment forms are named only by a placeholder or by a caption not tied to the field (src/components/search/SearchBar.tsx, src/components/search/SearchFilters.tsx and others)., so that the product feels as reliable and polished as the tools players already use.

#### AC-04-142 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **Accessibility bundle 4, forms and status messages (1.3.1, 3.3.2, 1.3.5, 4.1.3, 2.2.1).** The builder search, the search filters, the import, bulk-edit and export text boxes, the life tracker, snapshots, the wizard and the comment forms are named only by a placeholder or by a caption not tied to the field (src/components/search/SearchBar.tsx, src/components/search/SearchFilters.tsx and others). The sign-in and sign-up fields have no autoComplete. Search results, import feedback and the sign-in and deck-list errors are not announced, and toasts vanish after 3 seconds (src/hooks/useToast.ts).

#### AC-04-143 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-04-144 Edge

Given a list where one name does not resolve
When the player confirms
Then the unresolved name is shown first and nothing is written until they accept that list

#### US-04-116

As a player, I want **Accessibility bundle 5, keyboard, visible focus and target size (2.1.1, 2.4.7, 1.4.13, 2.5.7, 2.5.8).** Each search result is two nested buttons, and Enter starts a dnd-kit drag (src/components/card/DraggableCard.tsx, src/components/card/CardImage.tsx)., so that the product feels as reliable and polished as the tools players already use.

#### AC-04-145 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **Accessibility bundle 5, keyboard, visible focus and target size (2.1.1, 2.4.7, 1.4.13, 2.5.7, 2.5.8).** Each search result is two nested buttons, and Enter starts a dnd-kit drag (src/components/card/DraggableCard.tsx, src/components/card/CardImage.tsx). The Duplicate and Delete buttons sit inside the deck card's link (src/components/deck/HomeDeckCard.tsx). Card previews open on hover only. Several controls stay invisible or lose their focus ring when focused, and the view toggles and review stars are under 24 px.

#### AC-04-146 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-04-147 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-04-117

As a player, I want the product to scan the builder for accessibility automatically., so that the product feels as reliable and polished as the tools players already use.

#### AC-04-148 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Scan the builder for accessibility automatically. No axe tool is in the repo (no jest-axe, vitest-axe, axe-core or @axe-core/playwright), and Lighthouse CI checks accessibility only on /, /fr and /auth/signin, so the builder is never scanned. Add @axe-core/playwright to the Docker E2E gate for the builder, the playtest and the public deck page, and use role queries in unit tests.

#### AC-04-149 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-04-150 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: the product feels as reliable and polished as the tools players already use.

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

## I-04: UX Stability And Visual Quality

**Outcome:** the product feels as reliable and polished as the tools players already use.

**Status:** Next
**Priority:** Now

### Product work

- [x] Bound collection loading to 15 seconds and show a localized retry rather than an endless spinner or a false empty state; retain cached cards after failed refreshes (#1013).
- [x] Time out stalled acquisition-plan loading after 15 seconds and expose its existing localized retry action without losing close/filter cancellation (#995).
- [ ] Fix profile and deck loading states so no request appears to hang indefinitely.
  - [x] Clear decks from the previous Moxfield profile before loading another one, so a failed reload cannot leave an old deck importable (#1098). Broader profile loading ownership remains open.
  - [x] Ignore superseded Moxfield profile responses after a newer load fails, rather than restoring stale import choices (#1100). Broader profile loading ownership remains open.
  - [x] End the indefinite My Decks skeleton for signed-out visitors after session resolution (#1011). Profile latency and other loading ownership remain open.
  - [x] Show an accessible, responsive editor-shaped skeleton while the initial deck data loads (#1009). Profile latency and other loading ownership remain open.
  - [x] Treat temporary public-deck API, network and invalid-response failures as retryable rather than a false 404; bound the fetch to 15 seconds (#993). Authentication latency and broader loading ownership remain open.
  - [x] Bound public-profile API fetches to 15 seconds and show the existing retryable route error for temporary failures rather than a false 404 (#989). Authentication latency and the underlying profile API remain open.
  - [x] Ignore superseded deck-list responses so an older failure cannot override a successful retry (#984).
  - [x] Warn when a failed refresh leaves cached decks visible, with a localized retry action (#985). Initial loading ownership and profile latency remain open.
  - [x] Distinguish failed deck-list loading from a missing deck on direct builder navigation, with a localized retry action (#974). Initial loading ownership remains open.
  - [x] Show a recoverable error when an individual deck fetch fails on direct builder navigation, then retry that deck without exposing its incomplete listing stub (#976). Broader loading ownership remains open.
  - [x] Report failed manual deck refresh without changing the current deck, and suppress late failure feedback after deletion (#923). Dedicated visual retry states and broader loading ownership remain open.
  - [x] Notify the player when individual deck opening fails instead of logging silently (#911). The direct-builder retry state is covered by #976; manual-refresh retry UX remains open.
  - [x] Bound individual server deck fetches to 15 seconds, keeping the deadline through JSON reading and leaving guest loading local (#909). Broader UI retry and profile latency work remain open.
  - [x] Abort stalled deck-list requests after 15 seconds so the existing error and retry state can appear.
  - [x] Keep the user initialization eight-second deadline active through response-body loading and JSON validation, not only until headers arrive. Database latency and broader profile loading work remain open.
  - [x] Stop a stalled session from leaving the deck library on a skeleton, and keep the last profile when a refresh fails (#1271, promoted to `main` in #1273). Broader profile loading ownership remains open.
- [ ] Use route-level skeletons and cached session/profile data where safe.
  - [x] Show a localized, accessible route-level loading skeleton for public profiles (#987). Cached profile data and other route loading states remain open.
  - [x] Show a localized, accessible route-level loading skeleton for public decks, sharing the visual fallback with public profiles (#991). Cached data and other route loading states remain open.
- [ ] Remove React refresh loops, hover jitter, layout shifts and unstable card previews.
  - [x] Ignore superseded meta-history responses and invalidate pending results on reset, preventing old trend data or errors from resurfacing.
  - [x] Pin the card preview so hover does not move the editor layout, and keep the commander banner box stable while warnings open and close (#1270, #1271). Broader hover and refresh-loop work remains open. The EDHREC follow-up lesson on tooltips and tablet layout is tracked under I-13.
- [x] Make warning panels collapsible and dismissible, with accessible close controls.
- [x] Keep the color identity banner subtle: official mana symbols, restrained background and stable dimensions.
- [x] Make card zoom intentional in "View all cards" contexts, not a global hover effect.
- [x] Explain the empty EDHREC missing-card filter when all popular cards are already in the deck; removing the filter restores the list.
- [x] Keep EDHREC recommendation add actions visible without hover, with a 40 px touch target and keyboard focus outline (#1058).
- [x] Make keyboard shortcuts safe while typing and for assistive technology. `src/hooks/useKeyboardShortcuts.ts` handled Ctrl/Cmd shortcuts before it checked whether the focus was in a text field, so Ctrl+Z in a card note undid the last deck change instead of the typing. `/` and `?` stayed silent in text fields, but no setting turned them off or remapped them, which WCAG 2.1.4 (Level A) requires of single-character shortcuts that work outside a focused control. [I-37](i37-editor-depth.md) slice 3 adds the shortcut registry.
  - [x] Leave Ctrl/Cmd+Z to a focused text field, so a card note or the search bar keeps its own undo; checkboxes and other non-text controls keep deck undo (#1309). The off switch and remapping for `/` and `?`, and the shortcut registry, remain open.
  - [x] Add a "Single-key shortcuts" switch to the shortcut list, on by default and kept in `localStorage`, and a "Shortcuts" button in the builder toolbar so the list stays reachable when `?` is off. With the switch off, keys without Ctrl/Cmd do nothing on the page. Plain keys are left to a focused select, combobox, listbox, menu or other key-reading widget, Enter to a focused button or link, and every key to an IME composition (#1320). Remapping and the shortcut registry are I-37 slice 3's. Not checked in a browser or with a screen reader.
- [ ] Preserve the established dark/light design language while improving hierarchy, spacing and responsive behavior.
  - Players now spot and reject interfaces that look AI-made, and they defend shallow access to filters and sorts. I-13 records this as a design constraint from EDHREC's October 2026 redesign backlash.
- [ ] Add visual regression coverage for the Deck Editor, banner, warning panel and card hover states.
  - [x] Keep the commander banner box stable while warnings open and close, and open a fixed card preview without moving the card row (#1270). Screenshot coverage of the warning panel and hover states remains open.
- [ ] **Accessibility bundle 1, dialogs (WCAG 4.1.2, 2.4.3, 2.1.2, 2.4.11).** `src/components/ui/Modal.tsx` has no `role="dialog"`, `aria-modal` or label, no focus trap and no focus restore, and its global Escape listener closes the Export and Proxy dialogs together. `src/components/playtest/PlaytestModal.tsx` and `src/components/collection/AddToCollectionDialog.tsx` leave focus on the page underneath, and the close buttons in `ImportDialog.tsx` and `PrintingSelectorModal.tsx` have no name. Rebuild `Modal` on `@radix-ui/react-dialog`, which seven dialogs already use. Fix branch in flight: `fix/a11y-dialog-focus`.
  - [x] Give the shared modal and the playtest real dialog semantics and focus (#1340, 2026-11-10), the bundle the 2026-11-10 status note called in flight. Whether every dialog finding of the bundle is closed was not re-checked.
- [ ] **Accessibility bundle 4, forms and status messages (1.3.1, 3.3.2, 1.3.5, 4.1.3, 2.2.1).** The builder search, the search filters, the import, bulk-edit and export text boxes, the life tracker, snapshots, the wizard and the comment forms are named only by a placeholder or by a caption not tied to the field (`src/components/search/SearchBar.tsx`, `src/components/search/SearchFilters.tsx` and others). The sign-in and sign-up fields have no `autoComplete`. Search results, import feedback and the sign-in and deck-list errors are not announced, and toasts vanish after 3 seconds (`src/hooks/useToast.ts`).
- [ ] **Accessibility bundle 5, keyboard, visible focus and target size (2.1.1, 2.4.7, 1.4.13, 2.5.7, 2.5.8).** Each search result is two nested buttons, and Enter starts a dnd-kit drag (`src/components/card/DraggableCard.tsx`, `src/components/card/CardImage.tsx`). The Duplicate and Delete buttons sit inside the deck card's link (`src/components/deck/HomeDeckCard.tsx`). Card previews open on hover only. Several controls stay invisible or lose their focus ring when focused, and the view toggles and review stars are under 24 px.
- [ ] Scan the builder for accessibility automatically. No axe tool is in the repo (no `jest-axe`, `vitest-axe`, `axe-core` or `@axe-core/playwright`), and Lighthouse CI checks accessibility only on `/`, `/fr` and `/auth/signin`, so the builder is never scanned. Add `@axe-core/playwright` to the Docker E2E gate for the builder, the playtest and the public deck page, and use role queries in unit tests.

**2026-11-10:** a read-only accessibility audit of `dev` at `65e6230` read the code against WCAG 2.2 AA and grouped its findings into six bundles. Bundles 1, 4 and 5 are above. Bundles 2, 3 and 6 decide what a screen reader hears, so they sit under [I-24](i24-decks-a-screen-reader-can-play-from.md). The audit did not repeat known items: single-key shortcuts (above), I-13's contrast work and I-24's mana-cost labels.

**Twelfth pass, 2026-11-11:** Archidekt's primary developer, replying on 19 February 2026 to a request for Shift-drag between categories, said a modifier must not "overwrite anything the browser is supposed to be doing" for accessibility ([r/EDH](https://www.reddit.com/r/EDH/comments/1r863kj/)). Modifier-drags in I-37 stay behind that check. A reading view with no hover is [I-93](i93-a-reading-mode-for-the-table.md), not a second theme.

### Enrichment (2026-11-11)

**User story.** As a player who types, drags and uses a keyboard, I want the editor to stay still and give me my typing undo back, so that the page does not fight the browser.

**Acceptance.**
- Ctrl or Cmd+Z inside a text field undoes typing, not a deck edit.
- A dialog traps focus and returns it when it closes.
- A drag does not move the layout of the card under the pointer.

**UX.** One dialog closes at a time. Touch targets that are already 40 px stay that size. A modifier used to add a category must not steal a browser or assistive-technology key.

**Data and API.** No schema change. Shortcuts stay in the existing hook until I-37's registry replaces it.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `editor_shortcut_blocked {reason: typing, ime or switch_off}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** On for everyone. The single-key switch stays on by default until a player turns it off, and that choice is local to the browser.

**Open questions.** Remapping of single keys waits on I-37's registry.

**Kill criteria.** Revert a change that blocks typing undo, traps focus, or moves the layout during a drag.

### Definition of done

The editor remains visually stable while the user searches, hovers, moves cards, saves and navigates between zones on desktop and mobile.

---

