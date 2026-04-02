-- Ensures DeckCard columns match Prisma schema (deploy-safe, idempotent).
-- Run via `prisma migrate deploy` against production DATABASE_URL after each release.
ALTER TABLE "DeckCard" ADD COLUMN IF NOT EXISTS "power" TEXT;
ALTER TABLE "DeckCard" ADD COLUMN IF NOT EXISTS "toughness" TEXT;
