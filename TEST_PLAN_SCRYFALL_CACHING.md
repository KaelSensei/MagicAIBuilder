# Test Plan: Scryfall API Caching (PR #289)

## Overview

This test plan covers all automated and manual tests for the Scryfall API caching implementation, including rate limiting fixes, search result caching, name-based lookup caching, and TanStack Query `gcTime` fixes.

---

## Automated Tests (CI/CD)

### TypeScript & Linting

- [x] `pnpm tsc --noEmit` — Zero type errors
- [x] `pnpm lint` — Zero ESLint warnings
- [x] All code compiles without errors

### Unit Tests

- [x] `pnpm test` — All 1592 tests pass
  - [x] **src/lib/scryfall/client.test.ts** (13 tests)
    - [x] `searchCards` — calls correct Scryfall endpoint with ordering
    - [x] `searchCards` — throws on API error
    - [x] `getCardByName` — fetches by exact name
    - [x] `getCardByNameFuzzy` — fetches by fuzzy name
    - [x] `getCardById` — returns cached card without fetching
    - [x] `getCardById` — fetches from Scryfall when not in cache
    - [x] `autocompleteCardName` — returns card name suggestions
    - [x] `getCardCollection` — batches up to 75 cards
    - [x] `getGameChangers` — searches for `is:gamechanger`
    - [x] `getCommanderBanlist` — searches for `banned:commander`
    - [x] `searchCardPrintings` — searches with `unique=prints`
    - [x] Rate limiter with fake timers — no timeout issues
  - [x] **src/hooks/useGameChangers.test.ts** (6 tests)
    - [x] `useGameChangersList` — fetches all Game Changers via `fetchAllPages`
    - [x] `useGameChangersSet` — returns empty set when loading
    - [x] `useGameChangersSet` — returns set of names when loaded
    - [x] `useGameChangers` — returns empty array when deck is null
    - [x] `useGameChangers` — detects cards flagged as `isGameChanger`
    - [x] `useGameChangers` — detects commander as game changer
  - [x] **src/hooks/useBanlist.test.ts** (4 tests)
    - [x] `useBanlistQuery` — fetches banned cards
    - [x] `useBanlistQuery` — fetches multiple pages when `has_more` is true
    - [x] `useBanlistSet` — returns empty set when not loaded
    - [x] `useBanlistSet` — returns set of banned card names when loaded

### Build Test

- [x] `pnpm run build` — Builds successfully with no errors
  - [x] Next.js compilation succeeds
  - [x] All routes and API handlers compile
  - [x] No tree-shaking issues

---

## Manual Tests (Browser & Dev Environment)

### Test Setup

1. Start dev server: `pnpm dev`
2. Open browser DevTools (F12) → Network tab
3. Filter by `/api/cache/*` to watch cache requests

### 1. Basic Search & Cache Lookup

**Test:** Search for a card and verify cache is populated

1. Navigate to `/builder/[any-deck-id]` (create a test deck if needed)
2. In the search panel, type "Sol Ring"
3. **Expected:**
   - Scryfall API hit (visible in Network tab: `GET https://api.scryfall.com/cards/search?...`)
   - `POST /api/cache/search` is called after Scryfall response
   - Card results display normally
4. **Verify:**
   - Database: Check `ScryfallSearchCache` table for entry with query hash
   - ```sql
     SELECT * FROM "ScryfallSearchCache" WHERE "cachedAt" > NOW() - INTERVAL '1 minute';
     ```
   - Should see 1+ row with JSON data

### 2. Cache Hit on Subsequent Search

**Test:** Search same query again and verify cache is used

1. (Same builder page, same session)
2. Clear the search box, then type "Sol Ring" again
3. **Expected:**
   - NO new Scryfall API call (Network tab shows no `/cards/search` request)
   - `GET /api/cache/search` is called with query parameter
   - `GET` returns `{ "hit": true, "data": {...} }`
   - Results display instantly from cache
4. **Verify:**
   - Network tab shows only `/api/cache/search` (not `/cards/search`)
   - Response time <100ms

### 3. Search Cache Expiration (1 Hour TTL)

**Test:** Verify cache expires after 1 hour

1. Insert a test entry into `ScryphallSearchCache` with `cachedAt` = 61 minutes ago:
   ```sql
   INSERT INTO "ScryfallSearchCache" ("cacheKey", "data", "cachedAt")
   VALUES (
     'test_old_cache_key',
     '{"data": []}',
     NOW() - INTERVAL '61 minutes'
   );
   ```
2. In builder, search for any card (to trigger cache lookup for that query)
3. After 1 hour from initial cache write, search the same query again
4. **Expected:**
   - Old cache entry is deleted from DB
   - New Scryfall API call is made
   - Fresh data is cached

### 4. Rate Limiter — No Concurrent Violations

**Test:** Trigger multiple simultaneous searches and verify rate limit is enforced

1. Open DevTools Console and run:
   ```javascript
   // Simulate multiple concurrent useCardSearch calls
   const queries = [
     "Sol Ring",
     "Lightning Bolt",
     "Island",
     "Swamp",
     "Mountain",
   ];
   queries.forEach((q) => {
     // In a real scenario, this would be triggered by user typing or clicking
     fetch(`/builder/[deckId]?q=${q}`);
   });
   ```
2. Alternatively: Rapidly click between different search filters (Color, Set, etc.) on the builder page
3. **Expected:**
   - Network tab shows no 429 (Too Many Requests) errors from Scryfall
   - Requests are serialized: ~100ms minimum between each API call
   - All searches return valid results
4. **Verify:**
   - Check browser console for any fetch errors
   - Scryfall rate limit: max 10 req/s = 100ms between calls
   - Rate limiter in `src/lib/scryfall/client.ts` enforces this

### 5. Name-Based Lookup Caching

**Test:** Verify `getCardByName` stores result in DB cache

1. Navigate to a deck with printing selector (click a card in the search results)
2. In the printing modal, try to select a specific printing
3. This triggers `getCardByNameFuzzy` internally
4. **Expected:**
   - Card is fetched from Scryfall
   - Result is stored in `CardCache` table by Scryfall UUID
   - Next time same card is looked up by ID, DB cache is hit
5. **Verify:**
   - Database: `SELECT * FROM "CardCache" WHERE "scryfallId" = '...' LIMIT 1;`
   - Should see recent entries after searching/selecting cards

### 6. TanStack Query gcTime Fix — No Re-fetches on Remount

**Test:** Verify data survives component remount within 24-hour stale window

1. Open builder with a deck loaded
2. In the search panel, search for "Emrakul, the Aeons Torn"
   - This triggers `useCardSearch` and caches for 5 minutes
   - Also triggers `useGameChangersList` internally (24h cache)
3. Navigate away from builder (e.g., go to `/collection`)
4. Wait 5-10 minutes (simulating browser idle with component unmounted)
5. Navigate back to builder
6. **Expected (with fix):**
   - If within 24h: TanStack Query retains cached data in memory (`gcTime: 24h`)
   - No re-fetch from Scryfall for queries within 5min stale window
   - No re-fetch for Game Changers/Banlist (24h stale window)
7. **Verify:**
   - Network tab shows NO `/cards/search` or `/cards/named` calls on remount
   - Data displays instantly

### 7. Game Changers & Banlist Multi-Page Fetch

**Test:** Verify `fetchAllPages` correctly handles pagination

1. Open DevTools Network tab
2. Cause `useGameChangersList` to fire (e.g., open any builder for the first time)
3. **Expected:**
   - Multiple `GET /api/cache/search` calls (one per page) with `page=1`, `page=2`, etc.
   - Total results accumulate across all pages
   - Stops when `has_more: false`
   - Result is cached for 24h after first fetch
4. **Verify:**
   - Check Network tab for multiple `/api/cache/search?query=is:gamechanger&page=1,2,3...`
   - Final cached data contains all cards from all pages

### 8. Browser Search Functionality Still Works

**Test:** Verify search results display correctly and cards can be added

1. Open builder
2. Search for "Sol Ring"
3. Click a card result to open the printing selector
4. Select a printing and click "Add"
5. **Expected:**
   - Card is added to deck
   - Card appears in the deck editor (main zone)
   - Deck stats update (CMC, colors, etc.)
6. **Verify:**
   - No errors in browser console
   - Deck list updates correctly

### 9. Printing Selector Cache

**Test:** Verify printing selector uses cached card data

1. Open a deck with cards already added
2. Click a card in the deck list to open the printing selector modal
3. **Expected:**
   - Modal loads with card image and printing options
   - If card was previously looked up (within 24h), `CardCache` is used
4. **Verify:**
   - Network tab shows only image requests (no `/cards/{id}` fetch if in cache)

### 10. Server-Side Hash Computation (Browser Compatibility)

**Test:** Verify cache lookups work in browser (no Node crypto errors)

1. Open DevTools Console → Application → Local Storage
2. Search for a card in builder
3. Check browser console for any errors like:
   - `Cannot find module 'crypto'`
   - `Unexpected token 'import'`
4. **Expected:**
   - NO errors in console
   - Search results display
   - Cache requests succeed
5. **Verify:**
   - Console is clean of module errors
   - Network tab shows `/api/cache/search` calls with 200 responses

### 11. Drag & Drop Still Works

**Test:** Verify drag-drop deck building uses cache correctly

1. Open builder
2. Search for "Island"
3. Drag a search result card into the deck zone
4. **Expected:**
   - Card is added to appropriate zone (main/sideboard/maybeboard)
   - Deck stats update
   - Cache is used for card lookups if repeated
5. **Verify:**
   - No errors in console
   - Card appears in correct zone

### 12. AI Suggestions Still Work

**Test:** Verify AI suggestions don't break with caching

1. Open builder with a deck
2. Click "AI Suggestions" button
3. **Expected:**
   - AI analysis runs
   - Suggestions appear without cache-related errors
   - Card lookups for suggested cards use cache
4. **Verify:**
   - No errors in console
   - Suggestions display and can be applied

### 13. Combo Detection Still Works

**Test:** Verify combo detection uses cached card data

1. Open a deck with known combos (e.g., Mana Crypt + any card)
2. Open Combos panel
3. **Expected:**
   - Combos are detected and displayed
   - No errors from cache misses
4. **Verify:**
   - Combo count displays correctly
   - Cards in combos have proper data (name, image, etc.)

---

## Database Tests

### Verify Cache Tables Exist

```sql
-- Check CardCache table
SELECT COUNT(*) as cache_entries FROM "CardCache";

-- Check ScryfallSearchCache table
SELECT COUNT(*) as search_cache_entries FROM "ScryfallSearchCache";

-- Check structure
\d "CardCache"
\d "ScryfallSearchCache"
```

### Verify TTL Enforcement

```sql
-- Check stale CardCache entries (should be cleaned up on next access)
SELECT COUNT(*) FROM "CardCache"
WHERE "cachedAt" < NOW() - INTERVAL '24 hours';

-- Check stale ScryfallSearchCache entries
SELECT COUNT(*) FROM "ScryfallSearchCache"
WHERE "cachedAt" < NOW() - INTERVAL '1 hour';
```

### Verify Cache Key Format

```sql
-- ScryfallSearchCache keys should be 64-char hex (SHA256)
SELECT "cacheKey", LENGTH("cacheKey") as key_length, "cachedAt"
FROM "ScryfallSearchCache"
LIMIT 5;

-- Should all be 64 characters (SHA256 hex digest)
```

---

## Performance Tests (Optional)

### Network Waterfall Analysis

1. Open DevTools Network tab
2. Hard refresh builder page with Ctrl+Shift+R
3. **Expected:**
   - First search: 200-400ms (Scryfall API latency)
   - Cached search: <100ms (local cache + API route)
   - Subsequent session: Cache hit from DB

### Bundle Size Check

```bash
pnpm run build
# Verify no unexpected bundle growth in .next/static/chunks/
```

---

## Edge Cases & Error Handling

### Cache Miss Gracefully Falls Back

1. Manually delete all `ScryfallSearchCache` entries:
   ```sql
   DELETE FROM "ScryfallSearchCache";
   ```
2. Search for a card
3. **Expected:** Scryfall API is called, result is cached
4. No errors or warnings in console

### Malformed Cache Data Handling

1. Insert invalid JSON into cache:
   ```sql
   UPDATE "ScryfallSearchCache"
   SET "data" = 'invalid json'
   LIMIT 1;
   ```
2. Search for that query again
3. **Expected:** Cache lookup fails gracefully, Scryfall API is re-called
4. Valid data is re-cached

### API Route Validation

- Test invalid parameters:

  ```bash
  curl "http://localhost:3000/api/cache/search?query=&page=abc"
  # Should return { "hit": false }

  curl -X POST http://localhost:3000/api/cache/search \
    -H "Content-Type: application/json" \
    -d '{"query": "test", "page": "not-a-number", "data": {}}'
  # Should return 400 error
  ```

---

## Regression Tests (Verify Nothing Broke)

- [x] Deck creation/loading still works
- [x] Card search/filtering works
- [x] Deck editing (add/remove/reorder cards) works
- [x] Mana curve calculation correct
- [x] Bracket scoring displays correctly
- [x] Game Changers detection works
- [x] Banlist enforcement works
- [x] Color identity validation works
- [x] Multi-format support (Commander, other formats)
- [x] Export/Import features work
- [x] Snapshots work
- [x] AI suggestions work
- [x] Playtest mode works
- [x] Printing selector works
- [x] Dark/light theme switching works
- [x] Responsive design on mobile

---

## Sign-Off Checklist

- [ ] All automated tests pass (`pnpm test`)
- [ ] TypeScript compilation passes (`pnpm tsc --noEmit`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm run build`)
- [ ] Sections 1-13 of manual tests completed
- [ ] No console errors or warnings
- [ ] No network failures in DevTools
- [ ] Database cache entries verified
- [ ] Performance acceptable (searches <100ms on cache hit)
- [ ] No regressions in existing features
- [ ] PR #289 approved and merged

---

## Notes

- **Cache TTLs:**
  - Search results: 1 hour
  - Individual cards (CardCache): 24 hours
  - TanStack Query staleTime: 5 minutes (search) / 24 hours (cards/lists)
  - TanStack Query gcTime: Matches staleTime (prevents premature GC)

- **Rate Limiting:**
  - Scryfall limit: 10 req/s = 100ms between requests
  - Serialized via async mutex pattern
  - Detects test environment and skips delay during tests

- **Browser Compatibility:**
  - Hash computation moved to server-side API route
  - Client-side cache helpers are Node-independent
  - Safe to call from "use client" components

- **Troubleshooting:**
  - If cache not working: Check browser console for module errors
  - If searches slow: Verify Scryfall API is responding
  - If cache inconsistent: Clear database, restart server
  - If tests timeout: Ensure fake timers reset via `__resetRateLimiter()`
