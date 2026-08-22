-- Retain the EDHRec distribution instead of overwriting it.
--
-- MetaCache is keyed on (commanderSlug, source) and upserted on every refresh,
-- so each new fetch destroyed the previous distribution. Nothing in the
-- database could answer "what moved" because only one point in time survived.
--
-- One row per commander per day. capturedOn is a DATE and not a timestamp on
-- purpose: it is the row's identity through the unique index below, and a
-- timestamp would let five refreshes in one day record five points, three of
-- which say nothing the first already said.
--
-- The composite index carries commanderSlug first because every read is
-- scoped to one commander and then ordered by day; the unique constraint
-- alone would serve those reads, but the retention delete also scans by day
-- within a commander.

CREATE TABLE IF NOT EXISTS "MetaSnapshot" (
  "id"            TEXT NOT NULL,
  "commanderSlug" TEXT NOT NULL,
  "capturedOn"    DATE NOT NULL,
  "data"          JSONB NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MetaSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MetaSnapshot_commanderSlug_capturedOn_key"
  ON "MetaSnapshot" ("commanderSlug", "capturedOn");

CREATE INDEX IF NOT EXISTS "MetaSnapshot_commanderSlug_capturedOn_idx"
  ON "MetaSnapshot" ("commanderSlug", "capturedOn");
