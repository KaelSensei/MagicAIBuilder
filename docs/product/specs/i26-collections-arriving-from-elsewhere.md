# Spec: Collections Arriving From Elsewhere (I-26)

> **Initiative:** [I-26 in the roadmap](../roadmap.md) · **Status:** Later — 2027 · **Researched:** 2026-11-08
> **Depends on:** I-06 printing-level ownership. Importing at Oracle level discards exactly what makes I-16 and I-06 trustworthy.

## Overview

Every collection feature in the product assumes a populated collection. Nobody types twenty thousand cards. This initiative gets a collection **in**, at printing level, from the apps that already hold it.

## What the market does

The sweep found collection-to-deck ranking in five products — SuperBrew, DeckFinder, ManaBuilder, MTG Agents, ManaForge. All of them share one precondition, and it is the same one this product has: the collection must arrive from somewhere.

Where collections actually live:

- **ManaBox** — the scanner most paper players use. Free, offline card database, camera scanning, CSV export. It is the de facto on-ramp for paper collections.
- **Moxfield**, **Deckbox**, **Archidekt** — collection features alongside deckbuilding, with CSV export.
- **Spreadsheets** — still the largest single format, and the reason a tolerant CSV importer matters more than any single app integration.
- **MTG Arena** — a different inventory with wildcards; ManaForge reads it, and the product's non-goals exclude it.

**The constraint that shapes this spec.** Camera scanning is already a stated non-goal: it is a native-camera capability, ManaBox owns it, and I-06 defers it behind printing-level ownership anyway. Import is therefore not one path among several — it is the **only** honest way this product gets a populated collection.

## Current state in this codebase

- `src/lib/collection/parse.ts`, `printing-csv.ts`, `acquisition-csv.ts` — CSV handling exists, oriented to **export**.
- Deck import has a mature preview discipline (I-10): unresolved names disclosed before confirmation, duplicates surfaced, zones labelled, and confirmation disabled when nothing resolves. That discipline is the model to copy here.
- Collection ownership is tracked, with the printing-level model still open in I-06.
- **Missing:** any collection import, from any source.

## Functional requirements

1. **Accept the real formats.** CSV exports from the major collection apps, plus a generic mapping for spreadsheets. Column mapping is explicit and reviewable, not guessed silently.
2. **Map to printing identity.** Set code, collector number, finish and language where the source provides them. A row that resolves only to an Oracle card is reported as ambiguous, not assigned a printing.
3. **Preview before writing**, with matched rows, unmatched rows and duplicates — the same disclosure the deck import preview already performs.
4. **Never merge silently.** An ambiguous printing is listed for the player to resolve or skip. Guessing here corrupts cost calculations everywhere downstream.
5. **Record provenance.** Each import stores its source app and date, so a collection's history is readable later.
6. **Re-import reconciles.** A second import of the same source updates quantities rather than duplicating rows, and says what it changed.

## Data notes

- An import is a reviewable transaction: a staged set of rows, a preview, then an explicit commit. A half-applied import is worse than a refused one.
- Store the raw source row alongside the resolved printing. When a mapping later proves wrong, the original is still there to re-resolve.

## Non-goals

- Camera or barcode scanning, in any form.
- MTG Arena inventory and wildcards.
- Continuous sync with another app. One-way, player-initiated import. Sync implies conflict resolution, which is a different initiative.
- Writing collections back out to those apps. Export already exists and is not this initiative's concern.

## Testing strategy

- **Fixtures per source.** A real exported CSV per supported app, committed as a fixture, with its expected resolution. Formats change; fixtures are how that is noticed.
- **Ambiguity:** a row resolving to several printings appears in the preview as ambiguous and writes nothing on commit unless resolved.
- **Idempotence:** importing the same file twice leaves quantities unchanged and reports zero additions.
- **Atomicity:** an import failing midway leaves the collection exactly as it was.
- **Scale:** a 20 000-row file previews within the route's deadline, or streams with progress.

## Delivery slices

| #   | Slice                                                       | Depends on |
| --- | ----------------------------------------------------------- | ---------- |
| 0   | **I-06 printing-level ownership** — blocking                | —          |
| 1   | Generic CSV import with explicit column mapping and preview | 0          |
| 2   | Printing resolution with ambiguity reporting                | 1          |
| 3   | Commit as an atomic transaction, with provenance recorded   | 2          |
| 4   | Per-app fixtures and presets, starting with ManaBox         | 2          |
| 5   | Re-import reconciliation with a change report               | 3          |

Slice 4 is where this initiative earns its keep: a ManaBox preset turns "export, map twelve columns, hope" into one action for the largest group of paper players.

## Open questions

- How much mapping should be automatic? Auto-detecting a known app's header row is a large convenience and a quiet source of wrong imports. Detect, then **show what was detected** and require confirmation.
- Foils, signed cards, proxies and condition: ManaBox tracks proxy and signed state as first-class data. I-06's model must decide whether those travel, or the import silently flattens a distinction the player cares about.
- Is there a legal or terms-of-service constraint on consuming another app's export on the player's behalf? The player owns their data and initiates the transfer, which is the defensible position — but it should be checked, not assumed.

## Feature contract (Light, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.


This file is light because the initiative is Later or Parked and is not in I-80 to I-98. The scenarios below are the bar for when it is promoted. They are not a promise to build it next.

### Summary and problem

a player can bring a collection out of the app that already holds it, at printing level, without retyping it.

### Goals

- A collection exported from another app lands at printing level with its unmatched rows disclosed, and a second import reconciles instead of duplicating.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-26-01

As a player, I want the outcome of I-26, so that the work in this file is the reason to build it.

#### US-26-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-26-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-26-01 Happy path

Given a signed-in player and the English locale
When a collection exported from another app lands at printing level with its unmatched rows disclosed, and a second import reconciles instead of duplicating.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-26-02 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-26-03 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-26-04 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Follows the initiative priority. Guest and signed-in behaviour is the moved record's.

#### AC-26-05 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-26-06 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-26-01 without a pointer
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

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-26: Collections Arriving From Elsewhere

**Spec:** [`specs/i26-collections-arriving-from-elsewhere.md`](i26-collections-arriving-from-elsewhere.md)

**Outcome:** a player can bring a collection out of the app that already holds it, at printing level, without retyping it.

**Status:** Later
**Priority:** Later — 2027
**Impact / effort:** High / medium
**Depends on:** I-06 printing-level ownership. Importing at Oracle level would discard exactly the information that makes I-16 and I-06 trustworthy.

Collections already live in ManaBox, Moxfield, Deckbox and in spreadsheets, and ManaBox is the scanner most paper players use. The sweep found collection-to-deck ranking in five products; the precondition for all of it is getting the collection in. The product's own non-goals exclude building a scanner, which makes import the only honest path to a populated collection.

### Scope

- [ ] Import from the CSV exports of the major collection apps, mapping to printing identity.
- [ ] Preview before writing: matched rows, unmatched rows, and duplicates, with the same disclosure discipline the deck import preview already uses.
- [ ] Never silently merge. An ambiguous printing is reported, not guessed.
- [ ] Record the source and date of an import, so a collection's provenance is readable later.
- [ ] Support re-import as reconciliation rather than duplication.

### Definition of done

A collection exported from another app lands at printing level with its unmatched rows disclosed, and a second import reconciles instead of duplicating.

---

