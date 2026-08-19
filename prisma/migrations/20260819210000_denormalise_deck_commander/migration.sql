-- Denormalise the commander's name onto Deck.
--
-- Commander identity lives on the deck's cards, so the community discovery
-- route could not match its slug in SQL — it fetched every public deck and
-- slugged them in memory. The name (not the slug) is stored: a stored slug
-- could silently desync from commanderToSlug, which is shared with the
-- EDHRec URL builder. The slug stays derived, computed by the expression
-- index below — the exact SQL equivalent of commanderToSlug in
-- src/lib/meta/fetch.ts (lowercase → strip non [a-z0-9\s-] → trim →
-- whitespace runs to '-').

ALTER TABLE "Deck" ADD COLUMN IF NOT EXISTS "commanderName" TEXT;

-- First data backfill in this repository: every deck already carries its
-- commander as a DeckCard row.
UPDATE "Deck" d
SET "commanderName" = c."name"
FROM "DeckCard" c
WHERE c."deckId" = d."id"
  AND c."isCommander" = true
  AND c."isPartner" = false
  AND d."commanderName" IS NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deck_commanderSlug_public_idx"
  ON "Deck" (
    regexp_replace(
      btrim(regexp_replace(lower("commanderName"), '[^a-z0-9[:space:]-]', '', 'g')),
      '[[:space:]]+', '-', 'g'
    )
  )
  WHERE "isPublic" = true;
