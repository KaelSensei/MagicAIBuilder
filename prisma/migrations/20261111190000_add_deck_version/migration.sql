-- Optimistic lock on a deck: "version" moves by one with every saved card
-- write, and a writer that sends the version it read is refused when another
-- write landed in between (src/lib/deck/deck-repository.ts).
--
-- Additive and safe to re-run: IF NOT EXISTS skips a column already added.
-- Existing decks start at 0. PostgreSQL 11 and later store a constant DEFAULT
-- in the catalog instead of rewriting the table, so this does not lock "Deck"
-- for a full rewrite ("ALTER TABLE", Notes,
-- https://www.postgresql.org/docs/16/sql-altertable.html, read 2026-11-11).
ALTER TABLE "Deck" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 0;
