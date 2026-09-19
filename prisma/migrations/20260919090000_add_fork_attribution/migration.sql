ALTER TABLE "Deck" ADD COLUMN "forkedFromDeckId" TEXT;
ALTER TABLE "Deck" ADD COLUMN "forkedFromDeckName" TEXT;
ALTER TABLE "Deck" ADD COLUMN "forkedFromUserName" TEXT;

CREATE INDEX "Deck_forkedFromDeckId_idx" ON "Deck"("forkedFromDeckId");
