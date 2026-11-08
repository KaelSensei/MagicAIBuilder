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
