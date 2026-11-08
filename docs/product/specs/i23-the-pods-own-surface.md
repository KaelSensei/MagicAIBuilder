# Spec: The Pod's Own Surface (I-23)

> **Initiative:** [I-23 in the roadmap](../roadmap.md) · **Status:** Later — 2027 · **Researched:** 2026-11-08
> **Depends on:** I-15 pod sheets. Built on I-22's contract if that ships first.

A 2027-horizon spec: scope and intent are firm, interface details are deliberately left open.

## Overview

The Rule 0 conversation does not happen on a deckbuilding site. It happens in a Discord server, thirty seconds before the first turn, or in the thread where the pod organises the evening. This initiative puts the two artifacts that conversation needs — the dated bracket and the consented Rule 0 sheet — where the conversation already is.

## What the market does

Discord is an established Magic surface, and bots already occupy the adjacent space.

| Bot                                 | What it does                                                                                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Otterly MTG**                     | Deck analysis explaining a deck's strength against the Commander power brackets, combo detection, Moxfield import, a "Recommander" suggestion tool, and a companion web builder |
| **Scry / Mana Grove**               | Finds cards by effect, and a `/bracket` command that returns a decklist's bracket                                                                                               |
| **MTG Commander bot** (open source) | Life tracking for four players, commander damage, Scryfall card search, dice, session management                                                                                |

The existence of three independent bots answering bracket and card questions is the evidence that the demand is real and that nobody needs convincing to install one.

**What none of them carries:** a pod's _declared_ agreement. Every bot classifies a deck from its list. I-15's sheet records what four people actually said they were bringing — speed, combos, extra turns, denial, proxies, house rules — and that artifact has no home in the place the agreement is made.

## Current state in this codebase

- No Discord integration, no bot, no OAuth link to a third-party identity beyond NextAuth's Google provider.
- `src/lib/deck/bracket.ts` and the Game Changers detection produce exactly the values a `/bracket` reply needs.
- Public deck pages and share tokens exist (I-08), with the rule that private decks and share tokens stay out of search indexes — the same discipline must extend to anything the bot can echo.

## Functional requirements

1. **Dated bracket on request.** A command returns a deck's bracket, its Game Changers, and the date of the data behind both.
2. **Consented sheets only.** The bot renders an I-15 sheet only where consent was given for that pod. An unconsented sheet is not merely hidden — the bot must be unable to fetch it.
3. **Explicit account linking.** A Discord identity is linked to a product account by a deliberate, revocable action. Revoking takes effect immediately.
4. **Read and report only.** No command mutates a deck, a collection, a sheet or ownership. The bot has no write path at all.
5. **The same uncertainty.** A bot reply carries the same source labels and freshness dates the web surface shows. A one-line reply must not sound more certain than the page it summarises.
6. **No private leakage.** A deck that is private stays unreachable through the bot, including by anyone who knows its id.

## Non-goals

- Life tracking, commander damage, dice or turn timers. Three bots already do it, and it is not this product.
- Deck building inside Discord.
- Card search. Scryfall's own bot and Mana Grove serve it.
- A presence in any other chat platform before this one is validated.

## Testing strategy

- **Permission:** every command, invoked for a deck the caller does not own and has no consent for, returns refusal — enumerated per command.
- **Consent:** revoking a pod consent makes the sheet unfetchable on the next call, not merely unrendered.
- **Parity:** a bracket reported by the bot equals the bracket the product shows for the same deck at the same moment.
- **Write isolation:** the bot's credentials are rejected by every mutating route.

## Delivery slices

| #   | Slice                                                      | Depends on      |
| --- | ---------------------------------------------------------- | --------------- |
| 1   | Account linking, revocable, with no command yet            | —               |
| 2   | `/bracket` returning bracket, Game Changers and data dates | 1               |
| 3   | Consented I-15 sheet rendering                             | 1, I-15 slice 3 |
| 4   | Private-deck isolation tests and the write-path assertion  | 2, 3            |

Slice 4 is not a cleanup pass: it is the slice that makes the first three safe to leave running, and it should not trail them by more than one PR.

## Open questions

- Build on I-22's public contract, or on a private internal one? Using I-22 makes this initiative its first real consumer and validates that contract before anyone external depends on it — a strong argument for sequencing I-22 first even though it is the larger piece.
- Does a bot create a support surface the project cannot staff? A bot that is down is a visible failure in someone's server. Worth an explicit decision about what "unmaintained" would look like before shipping.
