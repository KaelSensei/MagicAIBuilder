# Spec: Verification As A Public Surface (I-22)

> **Initiative:** [I-22 in the roadmap](../roadmap.md) · **Status:** Later — 2027 · **Researched:** 2026-11-08
> **Depends on:** I-02's claim typing. **Owns:** the external verdict contract. **Does not own:** recommendations, which never travel through this surface.

A 2027-horizon spec. Its requirements are deliberately less detailed than a Next-horizon spec: committing to interface details eighteen months early produces precision that ages rather than guides.

## Overview

The product's differentiator is a deterministic verdict nobody else publishes. Inside the product it is a feature. Exposed as a contract other tools depend on, it becomes a position: a Discord bot, a tournament organiser or a competing builder can ask "is this list legal, and by which rule" and get an answer with its rule and its data date attached.

## What the market does

The sweep of 2026-11-08 found six products generating Commander decks — ManaTap, Farseek, DeckCheck, MTG Master, ManaForge, CommanderSalt — and **none publishing a verification API**. Several validate internally; DeckCheck documents that its AI output varies between runs.

Related surfaces that do exist:

- **Scryfall** publishes card data as free infrastructure every competitor consumes. It is the proof that an openly consumed contract becomes the category's reference point.
- **Commander Spellbook** publishes combo data openly and is consumed by this product already.
- **Moxfield** went the other way: no public API, Cloudflare in front of programmatic requests. The sweep recorded third-party tools moving to paste and CSV as a result.

The opening is the unclaimed middle: nobody is the place you send a list to find out whether it is legal and why.

## Current state in this codebase

- A **versioned read-only external API under `/api/v1`** already exists — the surface is an extension, not a new system.
- `src/lib/deck/bracket.ts`, colour-identity and legality validation, banlist and Game Changers detection are already deterministic and already tested.
- The verdict is currently **applied**, not **described**: there is no internal shape carrying "this judgement, by this rule, from data dated X". I-02 slice 1 creates it, which is why this initiative depends on it.

## Functional requirements

1. **Submit a list, receive a verdict.** Decklist plus format in; legality, colour identity, singleton, banlist, Game Changers and bracket inputs out.
2. **Never a bare boolean.** Every judgement carries the rule that produced it and the date of the data behind it. A verdict a consumer cannot explain to their own user is not worth exposing.
3. **Versioned, with an overlap.** A new contract version does not retire the previous one on the same day; consumers need a window.
4. **Authenticated and quotaed**, per consumer, with the quota documented rather than discovered by hitting it.
5. **Verification only.** No card suggestions, no generated text, no AI output of any kind crosses this boundary. The surface is valuable precisely because it is deterministic.
6. **Identical to what players see.** The same list submitted to the API and opened in the product produces the same verdict. A divergence is a defect, and a test must be able to catch it.

## Non-goals

- Recommendations, generation or any model output.
- Write access of any kind. Nothing outside the product mutates a deck.
- A free unlimited tier. Scryfall can absorb anonymous load; this product cannot, and pretending otherwise ends in an outage.
- Becoming a card-data source. Scryfall owns that, and the existing strategic boundary says so.

## Testing strategy

- **Parity:** a fixture corpus of lists produces identical verdicts through the API and through the internal path. This test is the point of the initiative.
- **Contract:** every judgement in a response carries a rule and a data date; one that does not fails.
- **Versioning:** a request pinned to version n keeps its shape after n+1 ships.
- **Isolation:** no route in this surface can write — asserted against the Prisma client, as I-16's read-only route requires.

## Delivery slices

| #   | Slice                                                                 | Depends on |
| --- | --------------------------------------------------------------------- | ---------- |
| 0   | **I-02 slice 1** — claims typed internally with rule and date         | blocking   |
| 1   | Verdict shape, internal, with the parity test against the player path | 0          |
| 2   | `/api/v1` endpoint, single version, authenticated                     | 1          |
| 3   | Quota, documentation, and the read-only assertion                     | 2          |
| 4   | Version negotiation and an overlap window                             | 2          |

## Open questions

- Who are the first consumers? Building a public contract before one real consumer exists is how APIs acquire the wrong shape. I-23's Discord surface is the natural first client, and building it _on_ this contract would validate the shape before anyone external depends on it.
- Does publishing the verdict invite competitors to consume the differentiator rather than buy it? Probably — and that is also how Scryfall became indispensable. Worth deciding deliberately rather than by default.
