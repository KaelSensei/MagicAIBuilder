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
