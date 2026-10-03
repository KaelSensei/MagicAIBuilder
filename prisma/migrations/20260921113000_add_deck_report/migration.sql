CREATE TABLE "DeckReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeckReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeckReport_userId_deckId_key" ON "DeckReport"("userId", "deckId");
CREATE INDEX "DeckReport_deckId_status_idx" ON "DeckReport"("deckId", "status");

ALTER TABLE "DeckReport" ADD CONSTRAINT "DeckReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeckReport" ADD CONSTRAINT "DeckReport_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
