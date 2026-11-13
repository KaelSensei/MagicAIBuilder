# Functional documentation

One document per bounded context, describing **what the player can do** and **which rules
apply**, in plain words, with the source of every rule and the test that proves every edge case.
These documents are for anyone who needs to know how the product behaves without reading code:
the owner, testers, contributors and agents planning a change.

They are not the player's manual ([user-guide.md](../product/user-guide.md)), not the plan for a
future feature ([specs](../product/specs/README.md)), and not the technical description of a
context (`src/modules/<context>/README.md`). Domain words follow [CONTEXT.md](../../CONTEXT.md).

The standard behind these documents is [code-documentation.md](../engineering/code-documentation.md)
and [ADR 0006](../adr/0006-comment-and-documentation-standard.md).

## Contexts

A context's functional document is written in the series that moves the context into
`src/modules/` ([architecture.md](../engineering/architecture.md#migration-approach)). Until then,
the existing documents listed here hold part of the knowledge.

| Context          | Kind       | Functional doc                           | Existing material today                                                                                                                                                                                                        |
| ---------------- | ---------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Format rules     | Core       | `format-rules.md` (not written yet)      | [commander-pairings.md](../product/commander-pairings.md), [companion-implementation.md](../product/companion-implementation.md), [banlists.md](../references/banlists.md), [game-changers.md](../references/game-changers.md) |
| Deck building    | Core       | `deck-building.md` (not written yet)     | [user-guide.md](../product/user-guide.md)                                                                                                                                                                                      |
| Deck analysis    | Core       | `deck-analysis.md` (not written yet)     | [commander-power-meter.md](../product/commander-power-meter.md), [technical.md](../engineering/technical.md#mana-base-alignment)                                                                                               |
| Playtest         | Core       | `playtest.md` (not written yet)          | [Opening-hands guide](../product/guides/commander-mulligans-curves-and-play-style.md), [technical.md](../engineering/technical.md#playtest-engine)                                                                             |
| AI copilot       | Core       | `ai-copilot.md` (not written yet)        | [I-02 spec](../product/specs/i02-checkable-ai-copilot.md)                                                                                                                                                                      |
| Card catalog     | Supporting | `card-catalog.md` (not written yet)      | [technical.md](../engineering/technical.md#scryfall-api-caching)                                                                                                                                                               |
| Combos           | Supporting | [combos.md](combos.md)                   | [src/modules/combos/README.md](../../src/modules/combos/README.md)                                                                                                                                                             |
| Meta insights    | Supporting | [meta-insights.md](meta-insights.md)     | [src/modules/meta-insights/README.md](../../src/modules/meta-insights/README.md)                                                                                                                                               |
| Deck interchange | Supporting | `deck-interchange.md` (not written yet)  | [import-moxfield.md](../product/import-moxfield.md)                                                                                                                                                                            |
| Collection       | Supporting | `collection.md` (not written yet)        | [I-16 spec](../product/specs/i16-decks-buildable-from-a-collection.md)                                                                                                                                                         |
| Community        | Supporting | `community.md` (not written yet)         | [technical.md](../engineering/technical.md#community-deck-discovery)                                                                                                                                                           |
| Identity         | Generic    | `identity.md` (not written yet)          | —                                                                                                                                                                                                                              |
| Rules reference  | Generic    | [rules-reference.md](rules-reference.md) | [src/modules/rules-reference/README.md](../../src/modules/rules-reference/README.md), [game-changers.md](../references/game-changers.md), [banlists.md](../references/banlists.md)                                             |
| Site             | Generic    | `site.md` (not written yet)              | [landing-page.md](../product/landing-page.md)                                                                                                                                                                                  |

When a context's document is written, replace "not written yet" with a link, and fold the existing
material into it or link to it.

## Template

Copy this into `docs/functional/<context>.md`. Keep every section; write "None" when a section is
empty, so a reader knows it was considered.

```markdown
# <Context name>: what the player can do

> **Context:** <core | supporting | generic>, `src/modules/<context>/`.
> **Glossary:** [CONTEXT.md, <Context>](../../CONTEXT.md#<anchor>).
> **Last checked against the code:** YYYY-MM-DD, commit `<sha>`.

## What the player can do

- <Capability, in the player's words.> ([User guide](../product/user-guide.md#<anchor>))
- <…>

## Rules applied

| Rule, in plain words                                             | Source                                        | Enforced where                                     |
| ---------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------- |
| <A Commander deck holds exactly 100 cards, commanders included.> | CR 903.5a                                     | <Reported by the server; previewed in the browser> |
| <…>                                                              | <CR number, WotC page and date, or "Product"> | <server / browser / both>                          |

## Edge cases

| Situation                       | Behaviour      | Proved by                               |
| ------------------------------- | -------------- | --------------------------------------- |
| <A snow basic land added twice> | <What happens> | `<path/to/file.test.ts>`: "<test name>" |

## States and messages

| State   | What the player sees | i18n keys                                                       |
| ------- | -------------------- | --------------------------------------------------------------- |
| Empty   | <…>                  | `<namespace>.<key>` in `src/messages/<locale>/<namespace>.json` |
| Loading | <…>                  | <…>                                                             |
| Error   | <…>                  | <…>                                                             |

## Who can do what

| Action               | Guest | Signed in | Owner | Moderator | API key scope |
| -------------------- | ----- | --------- | ----- | --------- | ------------- |
| <View a public deck> | yes   | yes       | yes   | yes       | `decks:read`  |

## Not yet

- <What the context does not do, and the roadmap initiative that would add it.>
```
