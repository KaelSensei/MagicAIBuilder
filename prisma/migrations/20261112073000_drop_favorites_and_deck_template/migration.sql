-- Drops the four tables the owner released on 2026-11-12 (decision OD-02):
-- "CardFavorite", "FavoriteList", "CardInFavoriteList" and "DeckTemplate".
-- No code ever read or wrote them: /api/favorites answered success and stored
-- nothing, /api/templates served hard-coded rows, and both routes are gone
-- with their Prisma models (P1-33, P1-34).
--
-- Owner action before deploy: any rows in these tables are lost. Check their
-- counts on production first; the application has never written to them.
--
-- Safe to re-run: IF EXISTS skips a table already dropped. Dropping a table
-- also drops its indexes and the foreign keys it declares, so the child
-- "CardInFavoriteList" goes before its parent "FavoriteList" and nothing else
-- has to be dropped by name ("DROP TABLE",
-- https://www.postgresql.org/docs/16/sql-droptable.html, read 2026-11-12).
DROP TABLE IF EXISTS "CardInFavoriteList";
DROP TABLE IF EXISTS "FavoriteList";
DROP TABLE IF EXISTS "CardFavorite";
DROP TABLE IF EXISTS "DeckTemplate";
