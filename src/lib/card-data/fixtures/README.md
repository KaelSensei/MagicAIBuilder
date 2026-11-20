# Recorded Scryfall bulk data

Recorded on 2026-11-20 at about 16:15 UTC for the I-67 bulk reader's tests, with the app's
`USER_AGENT`. Read only by `../testing/recorded-bulk-files.ts`.

| File                      | Source                                                                                       | Content                                                                                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bulk-data-index-v1.json` | `GET https://api.scryfall.com/bulk-data`                                                     | The whole index, as served.                                                                                                                                                                        |
| `oracle-cards-v1.jsonl`   | `https://data.scryfall.io/oracle-cards/oracle-cards-20261120100203.jsonl.gz`, decompressed   | Lines 1 to 21, then the first `transform` card (a double-faced card) and the first `token`.                                                                                                        |
| `default-cards-v1.jsonl`  | `https://data.scryfall.io/default-cards/default-cards-20261120100619.jsonl.gz`, decompressed | Lines 1 to 21, then the first English `transform` card, whose faces carry no `oracle_id`, the first English `token`, and the first `reversible_card`, which carries `oracle_id` only on its faces. |
| `rulings-v1.jsonl`        | `https://data.scryfall.io/rulings/rulings-20261120100034.jsonl.gz`, decompressed             | Lines 1 to 30.                                                                                                                                                                                     |

Lines are copied byte for byte; nothing is edited. A test that needs a broken line derives it
from a recorded one (`withoutField` in `../testing/recorded-bulk-files.ts`).

Measured over the whole files of the same day, to set the line guards in `../line-guards.ts`:
Oracle Cards has 39,356 lines, Default Cards 120,211 and Rulings 80,928. Every card line holds
`object`, `id`, `name`, `layout`, `lang`, `set`, `collector_number` and `legalities`. Every card
line names its `oracle_id` at the top level, except the 92 reversible cards of Default Cards,
whose faces each carry one.
