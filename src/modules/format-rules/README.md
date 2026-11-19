# Format rules

> **Kind:** core. **Glossary:** [CONTEXT.md, Format rules](../../../CONTEXT.md#format-rules).
> **Decisions:** [ADR 0001](../../../docs/adr/0001-modular-monolith-by-bounded-context.md),
> [ADR 0002](../../../docs/adr/0002-module-entry-points-index-server-client.md),
> [ADR 0009](../../../docs/adr/0009-legality-is-a-report-and-the-server-owns-rules.md).

## Responsibilities

- The construction checks of a side deck: the planar, scheme or Attraction deck a player brings
  beside a Commander deck ([I-103](../../../docs/product/specs/i103-planar-scheme-and-attraction-decks-beside-the-commander-deck.md),
  requirement 3).
- The rulebreaker table: the commanders whose ability changes how their deck is built, keyed by
  Oracle id, with the typed exceptions each grants (CR 903.5e, 113.6n;
  [I-03](../../../docs/product/specs/i03-trustworthy-deck-feedback.md), the 2026-11-16 scope line).
- The deck size rule: the minimum and maximum a deck is held to, and where a count stands.
- Every rule is a pure function that cites its Comprehensive Rules number and reports; it never
  refuses an edit (ADR 0009).

Not owned here yet: the Commander deck's own rules (colour identity, copy limits, pairing,
companion, banlist, Game Changers, brackets) still live under `src/lib/deck/` and
`src/lib/constants/brackets.ts`; [architecture.md](../../../docs/engineering/architecture.md)
lists their move. The side zones belong to `deck-building` (I-103 slice 1).

## Public API

| Export                                                        | Entry      | Purpose                                                       | Used by                                                               |
| ------------------------------------------------------------- | ---------- | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| `checkSideDeck`                                               | `index.ts` | Checks one side deck against every rule of its kind           | Nothing yet                                                           |
| `SideDeck`, `SideDeckReport`…                                 | `index.ts` | The side deck, its option, and the report's rule lines        | Nothing yet                                                           |
| `RULEBREAKERS`, `RULEBREAKERS_VERSION`, `RULEBREAKERS_SOURCE` | `index.ts` | The rulebreaker table, its version and where it was read      | Tests                                                                 |
| `deckConstructionExceptions`                                  | `index.ts` | The exceptions a command zone's rulebreakers grant            | `lib/deck/color-identity.ts`, `lib/ai/generated-deck-construction.ts` |
| `isIdentityExempt`, `liftsMaximumDeckSize`                    | `index.ts` | Whether an exception admits a card, or lifts the maximum size | The same, `deckSizeRule`, and `deckCopyLimit` (`lib/deck/multiples`)  |
| `rulebreakerAdmission`, `RulebreakerAdmission`                | `index.ts` | Which rulebreaker admits a card, and through which exception  | `admittedByRulebreaker` (`lib/deck/color-identity.ts`), the editor    |
| `RulebreakerException`, `RulebreakerCardTest`                 | `index.ts` | The exceptions' shapes                                        | `lib/search/rulebreaker-scope.ts` (the search's identity clause)      |

Every colour-identity reader (the deck's violations and companion, the AI deck check, the AI
suggestion evidence, the card package preview) asks one question, `isOutsideDeckIdentity` in
`lib/deck/color-identity.ts`, which reads these exceptions.
| `deckSizeRule`, `deckSizeStatus` | `index.ts` | A deck's size rule, and whether a count is short, legal or over | `lib/deck/deck-size.ts`, `DeckStats`, the AI deck check |

## Invariants

| Rule                                                                                    | Source              | Test                                                                                |
| --------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------- |
| A planar deck: ten or more planes and phenomena, two phenomena at most, no repeats      | CR 901.3            | `domain/side-decks.test.ts`                                                         |
| A single communal planar deck: 40 or ten per player, two phenomena per player at most   | CR 901.15a          | `domain/side-decks.test.ts`                                                         |
| A scheme deck: twenty or more schemes, two copies of a name at most, for any option     | CR 904.3, 904.12–13 | `domain/side-decks.test.ts`                                                         |
| An Attraction deck: ten or more Attractions, no repeats, each legal in Commander        | CR 717.2a, 100.7    | `domain/side-decks.test.ts`                                                         |
| A card that does not fit the kind fails the type rule and counts toward nothing         | I-103 1.2           | `domain/side-decks.test.ts`                                                         |
| Planeswalkers are not planes: the type line is read at its long dash                    | CR 205.1a           | `domain/side-decks.test.ts`                                                         |
| A rulebreaker's exceptions apply only from the command zone, never from the 99          | CR 903.5e           | `lib/deck/rulebreaker-commanders.test.ts`                                           |
| Every table entry matches its recorded Oracle text (basic lands, lands, size, identity) | CR 903.5e           | `domain/rulebreakers.test.ts`                                                       |
| No exception changes legality or banned status                                          | CR 113.6n           | `lib/deck/rulebreaker-commanders.test.ts`, `lib/ai/generated-deck-legality.test.ts` |
| A deck with no maximum size keeps its minimum                                           | CR 903.5a, 903.5e   | `domain/deck-size.test.ts`                                                          |
| No maximum size lifts the 99 cap on basics and "any number" cards, never the singleton  | CR 903.5b, 903.5e   | `lib/deck/rulebreaker-copy-limit.test.ts`                                           |
| The described search's identity clause admits what the commander admits                 | CR 903.5e           | `lib/search/rulebreaker-search-scope.test.ts`                                       |
| An admission names the rulebreaker only for an off-identity card that it exempts        | CR 903.5c, 903.5e   | `domain/rulebreaker-admission.test.ts`, `lib/deck/rulebreaker-admission.test.ts`    |

## Persistence and providers

None. The checks read the card lines they are given; the Commander status of an Attraction is
Scryfall's, stored by the caller.

## Testing

Solitary tests for each rule in `domain/side-decks.test.ts`; `entry-points.test.ts` pins the
public API.

## Known gaps

- Nothing calls `checkSideDeck` yet: the side zones (I-103 slice 1) and the route that runs the
  check on the server come first.
- A stored `DeckCard` has no Oracle id, so `lib/deck` finds a commander in the rulebreaker table by
  its exact Oracle name until the column exists.
- Tolabow, Loch Rascal's chosen colour for instants and sorceries is recorded
  (`chosen-colour-for`) but never applied: a deck stores no such choice.
- A changeling card is every creature type, but the table reads the type line only, so Seluma
  and Valko do not admit an off-colour changeling.
- The search's `t:` term matches either face of a double-faced card, where the table reads the
  front face (CR 712.8a): a card whose back face alone is an Angel can show under Seluma and then
  be reported by the deck.
