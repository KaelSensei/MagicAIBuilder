# Spec: A Third Locale, Chosen On Evidence (I-25)

> **Initiative:** [I-25 in the roadmap](../roadmap.md) · **Status:** Later — 2027 · **Researched:** 2026-11-08
> **Depends on:** I-11's activation rule, which already forbids routing a dormant catalogue.

## Overview

Nine catalogues sit dormant. I-11 already states the rule for activating one: navigation, warnings, dates, prices and card surfaces translated and tested as a single experience. This spec adds the part I-11 leaves open — **which** locale, and on what evidence.

## What the market does

The clearest finding of the 2026-11-08 sweep, and the one nobody seems to have acted on: **every AI deckbuilder found is English-only.** ManaTap, Farseek, DeckCheck, MTG Master, ManaForge, OffMeta, CardMystic, Find That Card, Imskir — not one advertises a second language.

The incumbents are barely better. Moxfield, Archidekt and EDHREC are English-first; ManaBox is the notable exception, advertising multiple languages alongside its offline database.

Meanwhile Scryfall already publishes localised card names, type lines and Oracle text for the major printing languages, so the card layer is not the obstacle — the interface and the review are.

**The read.** A non-English Commander market is the least contested expansion available to this product, and it already ships two reviewed locales while competitors ship one. The risk is not translation; it is activating a locale whose card data or prices cannot be represented honestly.

## Current state in this codebase

- English and French routed; a locale switcher and a catalogue parity guard exist.
- Localised card names, type lines, rules text and images where Scryfall provides them.
- Nine dormant catalogues — `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru`, `pt` — deliberately unrouted. A dormant prefix returns a 404 in English, which is already tested.
- Prices are USD throughout, formatted per locale, explicitly **not** relabelled as a local-market quote (#980, #1015).

The infrastructure is complete. What is missing is a decision and a review.

## Functional requirements

1. **Choose on stated evidence.** The selection records three things: the size of the Commander population in that language, the completeness of Scryfall's card data for it, and whether prices for that market can be shown without implying a quote. The record lives in this spec when the decision is made.
2. **Human review before routing.** No locale is routed on machine translation alone. I-11's rule stands.
3. **Test the locale as one experience** — dates, numbers, pluralisation, mana symbols and card text together, not field by field.
4. **State the limits.** Where Scryfall carries no card text in that language, say so on the surface rather than falling back silently to English mid-list.
5. **Prices stay honest.** Either represent the local market properly, or keep USD with its existing disclosure. Do not invent a conversion.

## Non-goals

- Activating several locales at once. The parity guard makes adding a catalogue cheap and reviewing it expensive; the review is the work.
- Right-to-left layout support, unless the chosen locale needs it — in which case it is a separate, larger initiative and must be said so before the choice is made.
- Localising player-authored content: primers, notes and comments stay in the language their author wrote them.

## Testing strategy

- **Parity:** the catalogue guard passes for the new locale with no missing keys.
- **Routing:** the locale resolves, and the previously dormant prefix stops returning the English 404.
- **Combined:** one test exercises a date, a number, a plural, a mana symbol and a card name together on one page in the new locale.
- **Fallback disclosure:** a card Scryfall does not carry in that language renders with its stated fallback, not a silent English substitution.

## Delivery slices

| #   | Slice                                                        | Depends on |
| --- | ------------------------------------------------------------ | ---------- |
| 1   | Record the choice and its evidence in this spec              | —          |
| 2   | Complete the catalogue and obtain human review               | 1          |
| 3   | Card-data coverage audit and the fallback disclosure surface | 1          |
| 4   | Route the locale and run the combined experience test        | 2, 3       |
| 5   | Price representation decision for that market                | 3          |

Slice 1 is a decision, not code, and it blocks everything. It is also the slice most likely to be skipped — which is how a half-translated locale reaches production.

## Open questions

- Which locale? The honest answer is that this spec cannot decide it from a competitive sweep alone; it needs the product's own traffic and the card-data audit from slice 3. Deciding from catalogue convenience — "Spanish is nearly done" — is exactly the failure I-11 was written to prevent.
- Does a third locale increase the review burden on every future feature? Yes, and permanently. That cost belongs in the slice-1 decision rather than being discovered in 2028.
