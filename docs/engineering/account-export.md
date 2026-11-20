# Account Export

`GET /api/user/export` returns everything tied to the signed-in account as one JSON file: the **account archive**. This answers an access request (GDPR Art. 15) and lets a player take their data elsewhere (Art. 20). Spec: [I-38 requirement 7](../product/specs/i38-trust-safety-and-user-rights.md#7-full-data-export), slice 4.

## The request

| Case                          | Answer                                                                                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Signed in                     | `200`, `Content-Type: application/json; charset=utf-8`, `Content-Disposition: attachment; filename="magicaibuilder-account-YYYY-MM-DD.json"`, `Cache-Control: no-store` |
| No session                    | `401 { "error": "Unauthorized" }` (route policy `session`)                                                                                                              |
| Second export within the hour | `429 { "error": "…" }` with `Retry-After` in seconds                                                                                                                    |
| Database failure              | `500 { "error": "Failed to export account" }`                                                                                                                           |

The export is free on every plan: there is no plan check (I-38 requirement 10.1). The rate limit is one export per account per hour, through `checkRateLimit` in `src/lib/rate-limit.ts`, the same limiter every other route uses.

## The schema

The contract is `accountArchiveSchema` in `src/lib/account-export/archive-schema.ts`. Every object in it is strict, so the route test fails if the archive carries a field the schema does not publish. Dates are ISO 8601 strings in UTC.

`schemaVersion` is `1`. It moves by one when a field is removed or changes meaning. Adding a section or a field does not move it, so a reader should ignore fields it does not know.

| Section                           | Holds                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `schemaVersion`, `generatedAt`    | The archive version and when the export ran                                                                              |
| `profile`                         | Id, username, display name, email, email verification date, avatar URL, onboarding and moderator flags, dates            |
| `decks`                           | Each deck's settings, its cards with notes and zones, its snapshots, its folder id, and `plainText`                      |
| `deckFolders`                     | The account's deck folders                                                                                               |
| `collection`                      | Collection cards: printing, quantity, foil, condition, acquisition date, price                                           |
| `acquisitionIntents`              | How each missing printing of a deck will be acquired                                                                     |
| `cardPackages`                    | Card packages the account authored, with their cards                                                                     |
| `ratings`, `votes`, `comments`    | The account's star ratings and written reviews, up and down votes, and comments, each with the deck id                   |
| `playtests`                       | Recorded playtest sessions                                                                                               |
| `following`, `followers`          | The other player's public username and the date of the follow, nothing else                                              |
| `savedDecks`, `publicDeckFolders` | Saved public decks and the folders they are filed in                                                                     |
| `notificationPreferences`         | The four event switches, or `null` before the account ever set them                                                      |
| `apiKeys`                         | Each key's name, scopes and dates                                                                                        |
| `reportsFiled`                    | Deck reports the account filed, with their status                                                                        |
| `aiUsage`                         | Metered AI calls per key and month (`monthlyCounts`), and each call's route, provider, model, outcome and date (`calls`) |

A snapshot's `cardCount` is the cards it holds, counted as the deck list and the builder's history count them (`snapshotCardCopies` in `src/lib/deck/snapshot-card-count.ts`): every copy in the main zone, plus the commander and the partner; the sideboard, Considering and the companion stay out. It is read from the snapshot's `cardList`, so a snapshot saved when the database stored its row count exports its copies too. When the card list cannot be read, it is the stored number.

`plainText` is the deck as the deck builder's "Plain text" export writes it (`exportPlainText` in `src/lib/deck/export.ts`), so another deckbuilder can import it. It is built from the stored rows by `deckPlainText` in `src/lib/account-export/deck-plain-text.ts`, and a parity test keeps the two identical.

## What stays out, and why

No credential leaves in the archive. The reader names its columns in a `select` and the builder copies each field by name, so a new column stays out until someone adds it on purpose. A route test checks that the serialised archive has no key matching `password`, `hash`, `token` or `secret`, and contains none of the seeded credential values.

- `User.password`: the password hash.
- `ApiKey.tokenHash` and `ApiKey.displayPrefix`: the key's hash and the first characters of the key.
- `Deck.shareToken`: the share link's secret. `shareEnabled` says whether a link is live.
- Another player's email or any private field: a follow carries only their public username.
- The cost of AI calls and their token counts: what a call cost the service, not the player's data.

Some models are excluded on purpose, each with its reason in `src/lib/account-export/archive-coverage.ts`:

| Excluded                | Why                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| `Account`               | OAuth links; the rows hold the provider's access, refresh and id tokens                         |
| `Session`               | Session tokens; sessions are JWTs today, so the table is empty in practice                      |
| `VerificationToken`     | One-time sign-in tokens keyed by email                                                          |
| `DeckReport.reviewedBy` | A moderator's review of another player's report; decisions get their own model in I-38 slice 10 |

## The guard

`src/lib/account-export/archive-coverage.test.ts` reads `prisma/schema.prisma` and lists every relation from a model to `User` (`userId`, `authorId`, `followerId`, `followingId`, `reviewedById`). Each one must be either in `EXPORTED_USER_RELATIONS`, with the archive section that holds its rows, or in `EXCLUDED_USER_RELATIONS`, with a reason. A new user-owned model that is in neither table fails the test, which names it as `Model.field`.

When you add such a model, add its rows to the reader (`prisma-account-rows.ts` and `account-row-selects.ts`), the builder and the schema, then list the relation as exported. Or list it as excluded and say why.
