-- feat: deck description, card notes, and deck tags

-- Add description to Deck
ALTER TABLE "Deck" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';

-- Add tags to Deck (PostgreSQL array)
ALTER TABLE "Deck" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Add notes to DeckCard
ALTER TABLE "DeckCard" ADD COLUMN IF NOT EXISTS "notes" TEXT;
