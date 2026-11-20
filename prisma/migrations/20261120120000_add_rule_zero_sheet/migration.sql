-- A private Rule 0 sheet for one deck (I-15 slice 1).
-- One row per deck. Declared fields only; sharing is a later slice.
-- https://www.postgresql.org/docs/16/sql-createtable.html (read 2026-11-20).
CREATE TABLE "RuleZeroSheet" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "speed" TEXT NOT NULL,
    "winConditions" TEXT[],
    "hasCombos" BOOLEAN NOT NULL,
    "combosNote" TEXT NOT NULL DEFAULT '',
    "hasExtraTurns" BOOLEAN NOT NULL,
    "extraTurnsNote" TEXT NOT NULL DEFAULT '',
    "hasResourceDenial" BOOLEAN NOT NULL,
    "resourceDenialNote" TEXT NOT NULL DEFAULT '',
    "proxyCount" INTEGER NOT NULL,
    "houseRules" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuleZeroSheet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RuleZeroSheet_deckId_key" ON "RuleZeroSheet"("deckId");
CREATE INDEX "RuleZeroSheet_ownerId_idx" ON "RuleZeroSheet"("ownerId");

ALTER TABLE "RuleZeroSheet" ADD CONSTRAINT "RuleZeroSheet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RuleZeroSheet" ADD CONSTRAINT "RuleZeroSheet_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
