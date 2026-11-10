---
status: accepted
date: 2026-11-10
decision-makers: Project owner; clean-code programme coordinator
---

# Report legality on the deck, and let the server own the rules

## Context and Problem Statement

A deck under construction is often illegal for a while: 97 cards, a card outside the commander's
colour identity, a banned card the player is about to replace. Players build decks this way, and
the product supports it. A careless application of DDD would make `addCard` throw when the deck
breaks a Commander rule, which would break the builder.

At the same time, the rules must be enforced by someone the player cannot bypass. Today that is
mostly the browser. The deck audit of `dev` at `872f08ff` (2026-11-10) found:

- **The server stores what the browser computed.** `POST /api/decks/[id]/cards` accepts
  `isGameChanger`, `isBanned`, `colorIdentity`, the type line, the oracle text and the price from
  the request body (`src/lib/validation/card.ts:56-57`). `src/lib/deck/legality.ts` says so in its
  header: the browser sets the `isBanned` flag, "so it records what the client believed".
- **No server-side copy limit.** Card writes accept a `quantity` from 1 to 99 for any card
  (`src/lib/validation/card.ts:62,74`). The singleton rule exists only in the client store.
- **No server-side command-zone check.** `PATCH /api/decks/[id]` accepts any `pairingType` value
  without checking it against the two cards; the only server rule is "not the same Oracle card in
  both slots" (`sharesOracleIdentity` in `src/lib/deck/commander-pairing.ts`).
  Eligibility, pairing, Background and companion checks run in the client store. The AI build path
  checks them properly (`src/lib/ai/generated-deck-legality.ts`), so two policies exist.
- **Stats and the bracket score are computed only in the browser.** No route handler calls
  `scoreBracket` or `computeDeckStats`; `POST /api/ai/suggest` takes the bracket and the Game
  Changer count from the request body.
- **Rules are duplicated with different meanings.** Colour identity is implemented in at least five
  places, some checking the main zone only and some every zone; the Game Changer count is computed
  four different ways.
- **One server-side report already exists.** `GET /api/decks/[id]/legality` returns a
  `DeckLegalityVerdict` (`checked` with violations, or `unsupported_format`) computed by
  `checkDeckLegality` from card data the server fetches from Scryfall, ignoring the client's flags.

Which rules may reject a change, which are only reported, and who is the authority for each?

## Decision Drivers

- A player must be able to hold an illegal deck while building it.
- A rule must not be bypassable by a modified browser or a direct API call.
- Feedback in the builder must be instant.
- Each rule must be written once.

## Considered Options

- Legality is a report computed by the server from pure, shared rule functions; the browser previews
  with the same functions; the server re-validates every command and rejects only true invariant
  breaches.
- Keep the rules in the browser and trust its results.
- Reject illegal edits: make Commander rules aggregate invariants that throw.
- Compute everything on the server only, with no browser preview.

## Decision Outcome

Chosen option: "legality is a report, and the server owns the rules", because it is the only
option that lets a player hold an illegal deck, keeps the rules authoritative and written once, and
still gives instant feedback.

The rules:

1. **Legality is a report.** Commander legality (deck size, singleton, colour identity, banlist,
   commander eligibility and pairing, companion condition) is reported on the deck as a verdict
   with violations. This binds the server: a write is never refused for a legality reason.
2. **Invariants are not legality.** Only true invariants reject a command: a positive integer
   quantity, a known zone, the structure of the command zone (at most one commander, one second
   commander and one companion), and ownership. These are checked by the server on every write.
3. **The rules are written once,** as pure functions in the `format-rules` context
   (`src/modules/format-rules/domain/`, exported through its `index.ts`), each citing its
   Comprehensive Rules number ([ADR 0006](0006-comment-and-documentation-standard.md)).
4. **The server computes the report.** The authoritative verdict, the stats and the bracket score
   are computed on the server, from card data the server fetched itself, never from flags sent by
   the browser.
5. **The browser may preview** the report with the same pure functions, imported from
   `format-rules`, for instant feedback. A new rule is never re-implemented in the browser.
6. **The browser keeps its current checks as player feedback.** Three checks in the deck store
   (`src/lib/deck/store.ts`) stop an edit before it is sent: the copy clamp (no more copies than
   `maxQuantity` allows), the companion check (a card without the companion keyword, or Lutri in
   Commander, cannot fill the companion slot) and the "already in the deck" check (a considered
   card is not moved into the deck when a card of that name is already there). They are
   feedback, not authority. A refactor pull request never changes them; they may later call the
   `format-rules` functions, with the same behaviour. Removing or changing them is an owner
   decision (OD-06).
7. **The server re-validates every command,** including AI-generated decks and card-package
   applications, through the same functions.
8. **Each move of a rule to the server is a behaviour change.** It gets its own `fix/` pull
   request with a Red test first, never inside a refactor
   ([definition-of-done.md](../engineering/definition-of-done.md)).

### Consequences

- Good, because players keep the freedom to build through illegal intermediate states, and the
  report explains what is wrong.
- Good, because a modified client or a direct API call can no longer store a false Game Changer
  or banned flag, or an impossible command-zone structure; a fifth copy of a card is stored and
  reported as a violation instead of being hidden.
- Good, because one function per rule ends the divergent copies (colour identity scope, Game Changer
  counts).
- Good, because the AI copilot reads the server's report instead of numbers the browser sent.
- Bad, because the server needs card data it trusts for every write, which means Scryfall lookups
  or a trusted cache on the write path, with latency and a failure mode when Scryfall is down.
- Bad, because the pure rule functions must be isomorphic (no `fetch`, no Prisma), so card data has
  to be loaded before the rules run, by a use case.
- Bad, because the migration is a series of behaviour changes, each needing its own Red test and
  review, not a single refactor.
- Neutral: the browser and the server answer different questions. The browser's checks may stop an
  edit to help the player; the server reports and never refuses on legality. Until OD-06 is
  decided, a player can be stopped in the builder by a check the server would only report.

### Confirmation

- dependency-cruiser keeps `format-rules/domain/` free of IO ([ADR 0007](0007-architecture-enforcement-in-stages.md)).
- Route tests show that a forged flag is ignored and recomputed, that a broken invariant is
  rejected, and that a legality violation is stored and reported.
- Review questions: "Does this change make the server reject a write for a legality reason?",
  "Is any new rule re-implemented in the browser?" and "Does this refactor change the browser's
  copy clamp, companion check or duplicate check?"

## Pros and Cons of the Options

### Keep the rules in the browser

- Good, because it is today's code and costs nothing.
- Bad, because any client can store anything, and every consumer (bracket, stats, share view, AI)
  inherits the client's beliefs.

### Reject illegal edits

- Good, because the stored deck would always be legal.
- Bad, because it breaks deck building: a player cannot add the 98th card of a 100-card deck if the
  deck must always be legal, nor swap a banned card in two steps. Most Commander rules are reportable
  properties of a deck, not invariants of the aggregate.

### Server only, no browser preview

- Good, because there is exactly one place where rules run.
- Bad, because every drag, add or quantity change would wait for a round trip before the builder can
  show a warning.

## More Information

- [CONTEXT.md](../../CONTEXT.md#format-rules): the terms, with their Comprehensive Rules numbers.
- [architecture.md](../engineering/architecture.md#bounded-contexts): the format-rules context.
- Vaughn Vernon, [Effective Aggregate Design](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_1.pdf),
  2011 (model true invariants in consistency boundaries).
- Comprehensive Rules 903.3 to 903.5 (deck construction), in the edition the app ships,
  `src/lib/rules/data/MagicCompRules-20260807.txt` (effective 2026-08-07).
