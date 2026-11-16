# Format rules

> **Kind:** core. **Glossary:** [CONTEXT.md, Format rules](../../../CONTEXT.md#format-rules).
> **Decisions:** [ADR 0001](../../../docs/adr/0001-modular-monolith-by-bounded-context.md),
> [ADR 0002](../../../docs/adr/0002-module-entry-points-index-server-client.md),
> [ADR 0009](../../../docs/adr/0009-legality-is-a-report-and-the-server-owns-rules.md).

## Responsibilities

- The construction checks of a side deck: the planar, scheme or Attraction deck a player brings
  beside a Commander deck ([I-103](../../../docs/product/specs/i103-planar-scheme-and-attraction-decks-beside-the-commander-deck.md),
  requirement 3).
- Every rule is a pure function that cites its Comprehensive Rules number and reports; it never
  refuses an edit (ADR 0009).

Not owned here yet: the Commander deck's own rules (colour identity, copy limits, pairing,
companion, banlist, Game Changers, brackets) still live under `src/lib/deck/` and
`src/lib/constants/brackets.ts`; [architecture.md](../../../docs/engineering/architecture.md)
lists their move. The side zones belong to `deck-building` (I-103 slice 1).

## Public API

| Export                        | Entry      | Purpose                                                | Used by     |
| ----------------------------- | ---------- | ------------------------------------------------------ | ----------- |
| `checkSideDeck`               | `index.ts` | Checks one side deck against every rule of its kind    | Nothing yet |
| `SideDeck`, `SideDeckReport`… | `index.ts` | The side deck, its option, and the report's rule lines | Nothing yet |

## Invariants

| Rule                                                                                  | Source              | Test                        |
| ------------------------------------------------------------------------------------- | ------------------- | --------------------------- |
| A planar deck: ten or more planes and phenomena, two phenomena at most, no repeats    | CR 901.3            | `domain/side-decks.test.ts` |
| A single communal planar deck: 40 or ten per player, two phenomena per player at most | CR 901.15a          | `domain/side-decks.test.ts` |
| A scheme deck: twenty or more schemes, two copies of a name at most, for any option   | CR 904.3, 904.12–13 | `domain/side-decks.test.ts` |
| An Attraction deck: ten or more Attractions, no repeats, each legal in Commander      | CR 717.2a, 100.7    | `domain/side-decks.test.ts` |
| A card that does not fit the kind fails the type rule and counts toward nothing       | I-103 1.2           | `domain/side-decks.test.ts` |
| Planeswalkers are not planes: the type line is read at its long dash                  | CR 205.1a           | `domain/side-decks.test.ts` |

## Persistence and providers

None. The checks read the card lines they are given; the Commander status of an Attraction is
Scryfall's, stored by the caller.

## Testing

Solitary tests for each rule in `domain/side-decks.test.ts`; `entry-points.test.ts` pins the
public API.

## Known gaps

- Nothing calls `checkSideDeck` yet: the side zones (I-103 slice 1) and the route that runs the
  check on the server come first.
