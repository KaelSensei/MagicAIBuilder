# I-06: Collection And Purchase Planning

**Status:** Building  
**Priority:** Next  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

the player knows which cards they own, which printing to use and what the deck will cost to build.

### Goals

- Importing or editing a deck produces a trustworthy owned, missing and estimated-cost view without conflating card identity with printing identity.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-06-01

As a player with cards in a box, I want the deck to show what I own, what I marked proxy, and what I still have to buy, so that the total is not a guess.

#### US-06-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-06-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-06-01 Happy path

Given a signed-in player and the English locale
When a missing printing is distinct from an owned one and from an unpriced one.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-06-02 Happy path

Given a signed-in player and the English locale
When a card the player marked proxy is named on the total and left out of collection value.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-06-03 Happy path

Given a signed-in player and the English locale
When the acquisition plan across decks does not count a copy twice.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-06-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-06-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-06-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in. Guests see a single deck's missing list from the cards in the session, with no collection. No flag.

#### AC-06-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-06-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-06-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

Owned, proxy and missing are three labels on the row. The plan is a list the player can copy, not a checkout.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Ownership is printing-level. Prices stay the stored USD amount until I-96 shows EUR beside it. The plan route stays private.

### Analytics and telemetry

`acquisition_plan_opened {scope: one_deck or all, unpriced: zero or some}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in. Guests see a single deck's missing list from the cards in the session, with no collection. No flag.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Whether the plan's one currency is USD or the player's market is I-32's choice, not a conversion.

### Sources

- https://manabox.app/guides/decks/faq/
- https://www.reddit.com/r/Moxfield/comments/1xsc215/
- https://hearthstone.blizzard.com/en-us/blog/20056279
- https://archidekt.com/features

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-06-101

As a player, I want the product to track the actual owned printing, not only the oracle card., so that the player knows which cards they own, which printing to use and what the deck will cost to build.

#### AC-06-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Track the actual owned printing, not only the oracle card.

#### AC-06-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-06-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-06-102

As a player, I want the product to prefer owned printings during direct add and import flows; the shared printing selector prioritizes owned editions and can filter to owned-only (#978), but automatic import matching remains open., so that the player knows which cards they own, which printing to use and what the deck will cost to build.

#### AC-06-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Prefer owned printings during direct add and import flows; the shared printing selector prioritizes owned editions and can filter to owned-only (#978), but automatic import matching remains open.

#### AC-06-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-06-105 Edge

Given a list where one name does not resolve
When the player confirms
Then the unresolved name is shown first and nothing is written until they accept that list

#### US-06-103

As a player, I want the product to complete deck/collection reconciliation without mutating ownership accidentally; the unsafe deck-sidebar Reset action has been removed., so that the player knows which cards they own, which printing to use and what the deck will cost to build.

#### AC-06-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Complete deck/collection reconciliation without mutating ownership accidentally; the unsafe deck-sidebar Reset action has been removed.

#### AC-06-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-06-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-06-104

As a player, I want the product to add region-aware price providers, starting with a clearly selected market., so that the player knows which cards they own, which printing to use and what the deck will cost to build.

#### AC-06-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Add region-aware price providers, starting with a clearly selected market.

#### AC-06-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-06-111 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-06-105

As a player, I want the product to support a synchronized "proxy now / buy later" workflow across devices., so that the player knows which cards they own, which printing to use and what the deck will cost to build.

#### AC-06-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Support a synchronized "proxy now / buy later" workflow across devices. **Corrected 2026-11-09:** the per-deck choice, proxy now included, has been stored on the server since migration 20261102144500_add_acquisition_intents (src/app/api/decks/[id]/acquisition-intent/route.ts, src/hooks/useAcquisitionIntent.ts). Still open: the cross-deck acquisition plan (src/lib/collection/acquisition-plan.ts) does not read these choices, and a proxy is a choice on one deck's shopping list, not card state in the collection.

#### AC-06-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-06-114 Edge

Given a card the player marked as a proxy
When ownership and the deck total are shown
Then the card is labelled proxy and is not counted as a physical copy the player owns

#### US-06-106

As a player, I want the product to consider mobile scanning only after the web data model supports printing-level ownership., so that the player knows which cards they own, which printing to use and what the deck will cost to build.

#### AC-06-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Consider mobile scanning only after the web data model supports printing-level ownership.

#### AC-06-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-06-117 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-06-107

As a player, I want the product to extend exact-printing usage beyond private decks to saved lists or acquisition plans; deck usage is now visible from the collection., so that the player knows which cards they own, which printing to use and what the deck will cost to build.

#### AC-06-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Extend exact-printing usage beyond private decks to saved lists or acquisition plans; deck usage is now visible from the collection.

#### AC-06-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-06-120 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-06-108

As a player, I want the product to add explicit, persistent acquire state; the read-only cross-deck plan is now visible in the collection UI., so that the player knows which cards they own, which printing to use and what the deck will cost to build.

#### AC-06-121 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Add explicit, persistent acquire state; the read-only cross-deck plan is now visible in the collection UI.

#### AC-06-122 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-06-123 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-06-109

As a player, I want the product to export or deep-link the acquisition plan to supported regional sellers while preserving printing, condition and finish choices., so that the player knows which cards they own, which printing to use and what the deck will cost to build.

#### AC-06-124 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Export or deep-link the acquisition plan to supported regional sellers while preserving printing, condition and finish choices.

#### AC-06-125 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-06-126 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-06-110

As a player, I want the product to break deck and acquisition cost down by vendor, category and price band instead of a single subtotal, once a region-aware provider is selected., so that the player knows which cards they own, which printing to use and what the deck will cost to build.

#### AC-06-127 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Break deck and acquisition cost down by vendor, category and price band instead of a single subtotal, once a region-aware provider is selected. Archidekt already offers this breakdown from its deck price overlay.

#### AC-06-128 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-06-129 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-06-111

As a player, I want the product to track proxies as explicit card state rather than only a PDF export and a per-deck shopping-list choice., so that the player knows which cards they own, which printing to use and what the deck will cost to build.

#### AC-06-130 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Track proxies as explicit card state rather than only a PDF export and a per-deck shopping-list choice. ManaBox treats proxy and signed copies as first-class collection data, and the synchronized proxy workflow above depends on the same model.

#### AC-06-131 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-06-132 Edge

Given a card the player marked as a proxy
When ownership and the deck total are shown
Then the card is labelled proxy and is not counted as a physical copy the player owns

#### US-06-112

As a player, I want the product to each missing card offers three paths: an owned substitute in the same role from I-76's slot engine (slice 10), a proxy only when the deck's I-15 sheet allows proxies, or the acquisition plan., so that the player knows which cards they own, which printing to use and what the deck will cost to build.

#### AC-06-133 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Each missing card offers three paths: an owned substitute in the same role from I-76's slot engine (slice 10), a proxy only when the deck's I-15 sheet allows proxies, or the acquisition plan. Hearthstone's "Suggest a Card" replaces a missing card "with a card from your collection" (Blizzard, 2016-03-08). Neighbour change from I-76, 2026-11-11.

#### AC-06-134 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-06-135 Edge

Given a card the player marked as a proxy
When ownership and the deck total are shown
Then the card is labelled proxy and is not counted as a physical copy the player owns

#### US-06-113

As a player, I want **Owner decision, 2026-11-10: make the "Collection only" search toggle work.** collectionOnly (src/lib/deck/types.ts) toggles in SearchFilters.tsx, but no code filters by it (decided)., so that the player knows which cards they own, which printing to use and what the deck will cost to build.

#### AC-06-136 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **Owner decision, 2026-11-10: make the "Collection only" search toggle work.** collectionOnly (src/lib/deck/types.ts) toggles in SearchFilters.tsx, but no code filters by it (decided). It reads the same owned counts as I-76 slice 4, and I-16's per-deck card pool and I-37 slice 17's markers extend it.

#### AC-06-137 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-06-138 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-06-114

As a player, I want **Owner decision, 2026-11-10:** the owned/buy badges are among the orphaned deck fields to re-mount (see I-01)., so that the player knows which cards they own, which printing to use and what the deck will cost to build.

#### AC-06-139 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **Owner decision, 2026-11-10:** the owned/buy badges are among the orphaned deck fields to re-mount (see I-01).

#### AC-06-140 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-06-141 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-06-115

As a player, I want the product to let the player mark a tag, including the proxy mark, as excluded from the deck total, and name that tag on the total., so that the player knows which cards they own, which printing to use and what the deck will cost to build.

#### AC-06-142 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Let the player mark a tag, including the proxy mark, as excluded from the deck total, and name that tag on the total. Archidekt's board, seen 2026-11-11, has "Set certain color tags to not be included in a deck's price" at 73 points (features). A proxy the player marked is excluded once the proxy-state item above ships. The total never drops a card silently.

#### AC-06-143 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-06-144 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-06-116

As a player, I want the product to keep edited collection quantities on screen after a save (fix branch fix/collection-quantity-response queued, 2026-11-11)., so that the player knows which cards they own, which printing to use and what the deck will cost to build.

#### AC-06-145 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Keep edited collection quantities on screen after a save (fix branch fix/collection-quantity-response queued, 2026-11-11).

#### AC-06-146 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-06-147 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-06-117

As a player, I want the product to keep both partner commanders in the acquisition plan (fix branch fix/acquisition-plan-partner-commanders queued, 2026-11-11)., so that the player knows which cards they own, which printing to use and what the deck will cost to build.

#### AC-06-148 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Keep both partner commanders in the acquisition plan (fix branch fix/acquisition-plan-partner-commanders queued, 2026-11-11).

#### AC-06-149 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-06-150 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: the player knows which cards they own, which printing to use and what the deck will cost to build.

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

## I-06: Collection And Purchase Planning

**Outcome:** the player knows which cards they own, which printing to use and what the deck will cost to build.

**Status:** Building
**Priority:** Next

### Already shipped

- Collection tracking and ownership badges.
- Missing-card list, budget checks and shopping list.
- Basic-land defaults, bulk ownership actions and CSV export.
- Card prices and multi-format exports.
- Quantity-aware deck reconciliation that preserves surplus collection copies.
- Shopping-list prioritization, line totals, copied budget summaries and safe CSV escaping.
- Bulk collection additions now count each missing printing once across duplicate deck rows.
- Deck collection summaries allocate owned copies and proxies once per printing, so remaining quantities and costs stay accurate.
- The deck sidebar no longer offers a misleading Reset action that subtracts shared, globally owned cards; ownership changes are made from collection management.
- Deck collection and shopping-list totals now distinguish known-price subtotals from missing copies without a price instead of presenting an incomplete zero-dollar estimate.
- The shopping list stores a proxy-now or buy-later choice per signed-in player, deck and printing on the server (`AcquisitionIntent`, migration `20261102144500_add_acquisition_intents`), so the choice follows the account across devices, without mutating deck or collection ownership; buy-now copy and CSV exclude deferred cards. **Correction 2026-11-09:** this line and the scope below said the choice persisted only in the same browser.
- A private, read-only acquisition-plan API aggregates required copies across owned decks and subtracts collection quantities without changing ownership.
- The collection page now displays that cross-deck acquisition plan on demand, including missing quantities, contributing decks, a known-price subtotal, unpriced-copy disclosure, and refresh/retry states.
- The cross-deck plan exports a generic CSV of missing quantities with Scryfall printing IDs and known prices; owned copies are excluded.
- Collection cards now link to private decks using that exact printing, including the deck zone and quantity, without loading usage for every card up front.
- The collection acquisition plan can focus on one owned deck or all decks, keeping its summary and CSV export scoped to the selected view.
- The printing selector now puts exact owned editions first, shows combined regular and foil quantities, and offers an optional owned-only filter with an empty state (#978); choosing an edition remains an explicit action.
- The acquisition plan now shows a known-price subtotal for each missing printing and marks unpriced printings on their own rows.
- Each missing printing in the acquisition plan now links to the player's contributing decks, so the player can inspect where it is needed.
- Acquisition-plan rows now show the required copy count beside each contributing deck, making shared demand understandable without changing the aggregate purchase quantity (#1054).
- Missing-printing rows now also show already-owned copies, clarifying how much remains to acquire without changing ownership or the plan calculation (#1056).
- Commander-slot cards are included in the cross-deck acquisition plan even when their stored zone is not main; sideboard cards remain excluded (#1104).

### Remaining scope

- [ ] Track the actual owned printing, not only the oracle card.
- [ ] Prefer owned printings during direct add and import flows; the shared printing selector prioritizes owned editions and can filter to owned-only (#978), but automatic import matching remains open.
  - **2026-11-10:** partly out of date. Text and URL import (`src/components/deck/ImportDialog.tsx`, `src/components/deck/ImportFromUrlTab.tsx`) already send every card row, Sideboard and Considering included, through `addCard` (`src/lib/deck/store.ts`), which silently takes the first owned printing with the same name. The command-zone slots go through `setCommander`, `setPartner` and `setCompanion`, which do not, and neither does `addToMaybeboard`, the direct add to Considering. No notice tells the player which printing was taken. [I-57](i57-printing-preferences-everywhere.md) makes owned-first one visible step of a printing rule applied at every entry point.
- [ ] Complete deck/collection reconciliation without mutating ownership accidentally; the unsafe deck-sidebar Reset action has been removed.
- [ ] Add region-aware price providers, starting with a clearly selected market.
- [ ] Support a synchronized "proxy now / buy later" workflow across devices. **Corrected 2026-11-09:** the per-deck choice, proxy now included, has been stored on the server since migration `20261102144500_add_acquisition_intents` (`src/app/api/decks/[id]/acquisition-intent/route.ts`, `src/hooks/useAcquisitionIntent.ts`). Still open: the cross-deck acquisition plan (`src/lib/collection/acquisition-plan.ts`) does not read these choices, and a proxy is a choice on one deck's shopping list, not card state in the collection.
- [ ] Consider mobile scanning only after the web data model supports printing-level ownership.
- [ ] Extend exact-printing usage beyond private decks to saved lists or acquisition plans; deck usage is now visible from the collection.
- [ ] Add explicit, persistent acquire state; the read-only cross-deck plan is now visible in the collection UI.
- [ ] Export or deep-link the acquisition plan to supported regional sellers while preserving printing, condition and finish choices.
- [ ] Break deck and acquisition cost down by vendor, category and price band instead of a single subtotal, once a region-aware provider is selected. Archidekt already offers this breakdown from its deck price overlay.
- [ ] Track proxies as explicit card state rather than only a PDF export and a per-deck shopping-list choice. ManaBox treats proxy and signed copies as first-class collection data, and the synchronized proxy workflow above depends on the same model.
  - [ ] Mark many deck cards as proxies at once, and leave proxies out of collection value and spare counts. ManaBox does both ([FAQ](https://manabox.app/guides/decks/faq/), seen 2026-11-10); "Mark as Proxies" was asked at Moxfield ([r/Moxfield](https://www.reddit.com/r/Moxfield/comments/1xsc215/), 2026-11-10). Added 2026-11-11.
- [ ] Each missing card offers three paths: an owned substitute in the same role from [I-76](i76-complete-this-deck-from-my-collection.md)'s slot engine (slice 10), a proxy only when the deck's I-15 sheet allows proxies, or the acquisition plan. Hearthstone's "Suggest a Card" replaces a missing card "with a card from your collection" ([Blizzard](https://hearthstone.blizzard.com/en-us/blog/20056279), 2016-03-08). Neighbour change from I-76, 2026-11-11.
- [ ] **Owner decision, 2026-11-10: make the "Collection only" search toggle work.** `collectionOnly` (`src/lib/deck/types.ts`) toggles in `SearchFilters.tsx`, but no code filters by it ([decided](../owner-decisions.md#decided-on-2026-11-10)). It reads the same owned counts as [I-76](i76-complete-this-deck-from-my-collection.md) slice 4, and I-16's per-deck card pool and I-37 slice 17's markers extend it.
- [ ] **Owner decision, 2026-11-10:** the owned/buy badges are among the orphaned deck fields to re-mount (see I-01).
- [ ] Let the player mark a tag, including the proxy mark, as excluded from the deck total, and name that tag on the total. Archidekt's board, seen 2026-11-11, has "Set certain color tags to not be included in a deck's price" at 73 points ([features](https://archidekt.com/features)). A proxy the player marked is excluded once the proxy-state item above ships. The total never drops a card silently.
- [ ] Keep edited collection quantities on screen after a save (fix branch `fix/collection-quantity-response` queued, 2026-11-11).
- [ ] Keep both partner commanders in the acquisition plan (fix branch `fix/acquisition-plan-partner-commanders` queued, 2026-11-11).

**2026-11-09:** prices come only from Scryfall's `prices.usd` field. No code reads Scryfall's EUR or MTGO ticket prices, and nothing converts currency. Moxfield shows USD, EUR and tix; Archidekt shows per-vendor totals from TCGplayer, Card Kingdom, Cardmarket and Cardhoarder; ManaBox shows four sources with currency conversion. [I-32](i32-seller-handoff-and-affiliate-carts.md) takes the seller side of the regional-price and seller deep-link items above: disclosed affiliate links, a price source with display rights for a chosen region, multi-vendor prices and buy-this-deck carts on the seller's own site. I-06 keeps ownership, printing identity and the acquisition plan that I-32 hands off. [I-33](i33-marketplace-ladder.md) records what lies beyond a hand-off, and the marketplace stays a non-goal.

### Enrichment (2026-11-11)

**User story.** As a player with cards in a box, I want the deck to show what I own, what I marked proxy, and what I still have to buy, so that the total is not a guess.

**Acceptance.**
- A missing printing is distinct from an owned one and from an unpriced one.
- A card the player marked proxy is named on the total and left out of collection value.
- The acquisition plan across decks does not count a copy twice.

**UX.** Owned, proxy and missing are three labels on the row. The plan is a list the player can copy, not a checkout.

**Data and API.** Ownership is printing-level. Prices stay the stored USD amount until I-96 shows EUR beside it. The plan route stays private.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `acquisition_plan_opened {scope: one_deck or all, unpriced: zero or some}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in. Guests see a single deck's missing list from the cards in the session, with no collection. No flag.

**Open questions.** Whether the plan's one currency is USD or the player's market is I-32's choice, not a conversion.

### Definition of done

Importing or editing a deck produces a trustworthy owned, missing and estimated-cost view without conflating card identity with printing identity.

---

