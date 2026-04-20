# MagicAIBuilder — User Flows & CRUD Reference

## Authentication (NextAuth.js / Auth.js)

**Provider**: NextAuth.js v5 with Prisma Adapter
**Storage**: PostgreSQL (same DB as the rest of the app)
**Providers**: Google OAuth + Email/Password (credentials)

### New Prisma Models (added by NextAuth Prisma Adapter)

| Model               | Purpose                                |
| ------------------- | -------------------------------------- |
| `User`              | Email, name, image, emailVerified      |
| `Account`           | OAuth provider links (Google, etc.)    |
| `Session`           | Active sessions tied to a user         |
| `VerificationToken` | Email verification & magic link tokens |

### Auth Flows

| Action           | Method                   | Details                                             |
| ---------------- | ------------------------ | --------------------------------------------------- |
| Sign up (email)  | `POST /api/auth/signup`  | Create user with hashed password, send verification |
| Sign in (email)  | `POST /api/auth/signin`  | Credentials provider, bcrypt comparison             |
| Sign in (Google) | OAuth redirect           | Google provider, auto-creates User + Account        |
| Sign out         | `POST /api/auth/signout` | Destroys session                                    |
| Get session      | `GET /api/auth/session`  | Returns current user or null                        |
| Forgot password  | `POST /api/auth/forgot`  | Sends reset token via email                         |
| Reset password   | `POST /api/auth/reset`   | Validates token, updates hashed password            |

### Session Strategy

JWT-based (default NextAuth). Each API route checks `auth()` server-side. Unauthenticated requests to protected routes return `401`.

### User Profile

| Action         | Endpoint                   | Details                              |
| -------------- | -------------------------- | ------------------------------------ |
| View profile   | `GET /api/user/profile`    | Name, email, image, joined date      |
| Update profile | `PATCH /api/user/profile`  | Name, image                          |
| Delete account | `DELETE /api/user/profile` | Cascade delete all decks, collection |

---

## Deck Management

### CRUD

| Action             | Method / Store Action            | Details                                                     |
| ------------------ | -------------------------------- | ----------------------------------------------------------- |
| Create deck        | `POST /api/decks`                | Name, format (Commander/Brawl), optional description & tags |
| List decks         | `GET /api/decks`                 | All user decks with card count, last updated                |
| Get deck           | `GET /api/decks/[id]`            | Full deck with all cards, metadata, bracket score           |
| Rename deck        | `PATCH /api/decks/[id]`          | Update name only                                            |
| Update description | `PATCH /api/decks/[id]`          | Set or clear description                                    |
| Set format         | `PATCH /api/decks/[id]`          | Commander or Brawl                                          |
| Set target bracket | `PATCH /api/decks/[id]`          | Power level target 1-5 (1=Exhibition, 5=cEDH)               |
| Override bracket   | `PATCH /api/decks/[id]`          | Manual bracket override (bypasses auto-calculation)         |
| Set budget         | `PATCH /api/decks/[id]`          | Budget limit in USD, triggers over-budget warnings          |
| Add tag            | `PATCH /api/decks/[id]`          | Free-text tags for organization                             |
| Remove tag         | `PATCH /api/decks/[id]`          | Remove a specific tag                                       |
| Duplicate deck     | `POST /api/decks/[id]/duplicate` | Deep copy with all cards, resets share token                |
| Delete deck        | `DELETE /api/decks/[id]`         | Cascade deletes cards and snapshots                         |
| Clear all cards    | `DELETE /api/decks/[id]/cards`   | Remove every card but keep the deck shell                   |

### Commander Zone

| Action               | Store Action                 | Details                                                     |
| -------------------- | ---------------------------- | ----------------------------------------------------------- |
| Set commander        | `setCommander(card)`         | Adds card + updates deck metadata, validates color identity |
| Clear commander      | `clearCommander()`           | Removes commander, also clears partner                      |
| Set partner          | `setPartner(card)`           | Validates Partner keyword, checks compatibility             |
| Set companion        | `setCompanion(card)`         | Sideboard slot, validates Companion keyword                 |
| Promote to commander | `promoteToCommander(cardId)` | Move existing deck card to commander slot                   |

### Card Operations (within a deck)

| Action             | Endpoint / Store Action                 | Details                                        |
| ------------------ | --------------------------------------- | ---------------------------------------------- |
| Add card           | `POST /api/decks/[id]/cards`            | From Scryfall search, specify zone & quantity  |
| Remove card        | `DELETE /api/decks/[id]/cards/[cardId]` | Single card removal                            |
| Update quantity    | `updateCardQuantity(cardId, delta)`     | Increment or decrement                         |
| Change category    | `PATCH /api/decks/[id]/cards/[cardId]`  | Reclassify (creature, removal, ramp, etc.)     |
| Move to zone       | `moveCardToZone(cardId, zone)`          | Main deck, sideboard, or maybeboard            |
| Move to maybeboard | `moveToMaybeboard(cardId)`              | Quick action from main deck                    |
| Move to deck       | `moveToDeck(cardId)`                    | Quick action from maybeboard                   |
| Edit notes         | `updateCardNotes(cardId, notes)`        | Per-card notes (combo reminders, etc.)         |
| Swap printing      | `swapCardPrinting(cardId, printing)`    | Different art/set while keeping the same card  |
| Undo last action   | `undo()`                                | Reverts last add/remove (session-scoped stack) |

---

## Deck Snapshots (Version Control)

| Action           | Endpoint                                          | Details                                        |
| ---------------- | ------------------------------------------------- | ---------------------------------------------- |
| Create snapshot  | `POST /api/decks/[id]/snapshots`                  | Captures current card list as JSON             |
| List snapshots   | `GET /api/decks/[id]/snapshots`                   | Lightweight list (no card data)                |
| Restore snapshot | `POST /api/decks/[id]/snapshots/[snapId]/restore` | Replaces all current cards with snapshot state |
| Delete snapshot  | `DELETE /api/decks/[id]/snapshots/[snapId]`       | Remove a saved version                         |

---

## Deck Sharing

| Action           | Endpoint                       | Details                                       |
| ---------------- | ------------------------------ | --------------------------------------------- |
| Enable sharing   | `POST /api/decks/[id]/share`   | Generates unique token, returns shareable URL |
| Disable sharing  | `DELETE /api/decks/[id]/share` | Clears token, link becomes invalid            |
| View shared deck | `GET /api/share/[token]`       | Public, read-only, no auth required           |

---

## Deck Import / Export

### Import

| Action           | Method                    | Details                                          |
| ---------------- | ------------------------- | ------------------------------------------------ |
| Parse text list  | `parseTextDecklist(text)` | Accepts "1 Card Name" format, detects commanders |
| Add parsed cards | `addCard()` loop          | Resolves each card via Scryfall, adds to deck    |

### Export Formats

| Format      | Description                                         |
| ----------- | --------------------------------------------------- |
| Plain Text  | `1 Card Name` per line                              |
| Moxfield    | Moxfield-compatible with section headers            |
| MTG Arena   | Arena format with Commander/Deck/Sideboard sections |
| MTGO (.dek) | XML format for Magic Online                         |
| TappedOut   | With `*CMDR*` markers                               |
| Archidekt   | Section-based headers                               |

---

## Collection Management

| Action           | Endpoint / Store Action       | Details                                   |
| ---------------- | ----------------------------- | ----------------------------------------- |
| Add card         | `POST /api/collection`        | Upserts by scryfallId + foil combo        |
| List collection  | `GET /api/collection`         | All cards with quantity, condition, price |
| Update quantity  | `PATCH /api/collection/[id]`  | Change count, auto-deletes if set to 0    |
| Update condition | `PATCH /api/collection/[id]`  | NM, LP, MP, HP, DMG                       |
| Remove card      | `DELETE /api/collection/[id]` | Delete from collection                    |
| Get owned count  | `getTotalOwned(scryfallId)`   | Normal + foil combined quantity           |

---

## AI Features

### AI Deck Builder

| Action     | Endpoint             | Details                                                                                                            |
| ---------- | -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Build deck | `POST /api/ai/build` | Streaming response. Input: colors, strategy, budget, bracket, optional commander name. Returns full 100-card list. |

### AI Suggestions

| Action          | Endpoint               | Details                                                                                                                                                 |
| --------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Get suggestions | `POST /api/ai/suggest` | Streaming. Analyzes current deck, returns card additions, removals, and strategic analysis. Providers: Anthropic Claude or OpenAI GPT (fallback: mock). |

---

## Deck Analysis (Computed, Read-Only)

These are derived from the current card list, not stored separately.

| Analysis            | Description                                                   |
| ------------------- | ------------------------------------------------------------- |
| Bracket score (1-5) | 6 dimensions: ramp, draw, removal, tutors, win speed, avg CMC |
| Game Changers       | Auto-detected high-impact cards                               |
| Banned cards        | Cards flagged as Commander-illegal                            |
| Mana curve          | Distribution by converted mana cost                           |
| Color distribution  | Breakdown by color identity                                   |
| Theme detection     | Synergy patterns (ramp-heavy, control, tribal, etc.)          |
| Total price         | Sum of all card prices, over-budget warning                   |

---

## External Integrations

| Service             | Usage                                | Rate Limit              |
| ------------------- | ------------------------------------ | ----------------------- |
| Scryfall API        | Card search, details, images, prices | 10 req/s (self-imposed) |
| Commander Spellbook | Combo detection for deck cards       | Proxied via API route   |
| Anthropic Claude    | AI deck building & suggestions       | Per-request             |
| OpenAI GPT          | Fallback AI provider                 | Per-request             |

---

## UI Preferences (persisted in Zustand, session-scoped)

| Preference       | Options       | Default |
| ---------------- | ------------- | ------- |
| Search view mode | Grid / List   | Grid    |
| Deck view mode   | Grid / List   | Grid    |
| Grid columns     | 2, 3, 4, 6, 8 | 4       |

---

## Data Ownership & Authorization

Once NextAuth is integrated, all entities become user-scoped:

```
User (1) ──→ (N) Deck ──→ (N) DeckCard
                       ──→ (N) DeckSnapshot
         ──→ (N) CollectionCard
         ──→ (N) Account (Google, etc.)
         ──→ (N) Session
```

Every `Deck` and `CollectionCard` gets a `userId` foreign key. API routes filter by `session.user.id`.

### Permission Model

| Action                            | Owner | Other authenticated user | Anonymous (no auth) |
| --------------------------------- | ----- | ------------------------ | ------------------- |
| Create deck                       | ✅    | ✅ (their own)           | ❌                  |
| View own decks                    | ✅    | ❌                       | ❌                  |
| Edit deck (name, cards, settings) | ✅    | ❌                       | ❌                  |
| Delete deck                       | ✅    | ❌                       | ❌                  |
| Duplicate deck                    | ✅    | ❌                       | ❌                  |
| Create/restore snapshot           | ✅    | ❌                       | ❌                  |
| Enable sharing                    | ✅    | ❌                       | ❌                  |
| View shared deck (via token)      | ✅    | ✅ (read-only)           | ✅ (read-only)      |
| Manage collection                 | ✅    | ❌                       | ❌                  |
| AI build / suggestions            | ✅    | ✅ (their own decks)     | ❌                  |
| Update profile                    | ✅    | ❌                       | ❌                  |
| Delete account                    | ✅    | ❌                       | ❌                  |

### Enforcement

Every API route that mutates a deck MUST verify ownership before proceeding:

```typescript
// Middleware pattern for all /api/decks/[id]/* routes
const session = await auth();
if (!session?.user?.id)
  return Response.json({ error: "Unauthorized" }, { status: 401 });

const deck = await prisma.deck.findUnique({ where: { id: deckId } });
if (!deck) return Response.json({ error: "Not found" }, { status: 404 });
if (deck.userId !== session.user.id)
  return Response.json({ error: "Forbidden" }, { status: 403 });
```

The only exception is `GET /api/share/[token]` which is public by design (read-only, stripped of sensitive metadata like `shareToken` and `userId`).
