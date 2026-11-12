# Rules reference

> **Kind:** generic. **Glossary:** [CONTEXT.md, Rules reference and site](../../../CONTEXT.md#rules-reference-and-site).
> **Decisions:** [ADR 0001](../../../docs/adr/0001-modular-monolith-by-bounded-context.md) (modular monolith),
> [ADR 0002](../../../docs/adr/0002-module-entry-points-index-server-client.md) (entry points),
> [ADR 0003](../../../docs/adr/0003-domain-as-readonly-data-and-pure-functions.md) (readonly domain).
> **Status:** series open (RR-02 moved it; RR-04 to RR-06 split the list page and close the series).
> The functional doc and the full README come with the closing slice.

The reference pages a player reads rather than edits: the official Comprehensive Rules, with their
glossary and effective date, and the Game Changers and Commander banlist page. The context ships
one edition of the rules as a text file and renders it one chapter at a time; the Game Changers
and banlist page reads the live Scryfall lists through the shared hooks.

Not owned here: the deck-building rules themselves (`lib/deck/`, format-rules context), the
Scryfall client and the card images (`lib/scryfall/`, card-catalog context), and the Game Changers
and banlist hooks (`hooks/useGameChangers.ts`, `hooks/useBanlist.ts`, format-rules context).

## Layers

| Folder            | Holds                            | Files                                                                                                                                                                                                                                                  |
| ----------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `domain/`         | Readonly data and pure functions | `comprehensive-rules.ts`: the parsed shape of the rules (sections, chapters, paragraphs, glossary), `parseComprehensiveRules` and `searchComprehensiveRules`. `effective-date.ts`: `parseRulesEffectiveDate`, the "August 7, 2026" line as a UTC date. |
| `infrastructure/` | Server-only file access          | `rules-file.ts`: `RULES_FILE`, the edition the app ships, and the once-per-process `loadComprehensiveRules`. `data/MagicCompRules-20260807.txt`: the edition itself (effective 2026-08-07).                                                            |
| `ui/`             | React components                 | `ComprehensiveRulesView.tsx`: the server-rendered rules browser; it takes the parsed rules from the page. `GameChangersPageClient.tsx`: the paginated Game Changers and banlist page. `Pagination.tsx`: its pager.                                     |

## Entry points

| File        | Publishes                                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`  | `searchComprehensiveRules` and the parsed types (`ComprehensiveRules`, `RulesSection`, `RulesChapter`, `RuleParagraph`, `GlossaryEntry`, `RulesSearchResult`) |
| `server.ts` | `loadComprehensiveRules` (`server-only`)                                                                                                                      |

There is no `client.ts` yet: nothing client-side is imported outside the context. The two pages
under `src/app/[locale]/rules/` import the views by their `ui/` paths, and the comprehensive rules
page loads the file through `server.ts` and passes the parsed document to the view.
`entry-points.test.ts` pins the runtime export list of each entry point.

## Known gaps

- The rules edition is two versions behind the file Wizards links; the update is product work
  ([I-47](../../../docs/product/specs/i47-rules-answers-for-this-deck.md)).
- `GameChangersPageClient.tsx` is one 400-line component; RR-04 and RR-05 split it.
- The boundary rules run at `warn` for this context until RR-06 closes the series.
