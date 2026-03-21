-- AddColumn shareToken and shareEnabled to Deck
ALTER TABLE "Deck" ADD COLUMN "shareToken" TEXT;
ALTER TABLE "Deck" ADD COLUMN "shareEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex for shareToken uniqueness
CREATE UNIQUE INDEX "Deck_shareToken_key" ON "Deck"("shareToken");
