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

