-- AlterTable: add zone column to DeckCard
-- Values: "main" | "sideboard" | "maybeboard"
ALTER TABLE "DeckCard" ADD COLUMN IF NOT EXISTS "zone" TEXT NOT NULL DEFAULT 'main';
