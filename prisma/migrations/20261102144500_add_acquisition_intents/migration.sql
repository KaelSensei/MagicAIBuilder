CREATE TABLE "AcquisitionIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "scryfallId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcquisitionIntent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AcquisitionIntent_userId_deckId_scryfallId_key" ON "AcquisitionIntent"("userId", "deckId", "scryfallId");
CREATE INDEX "AcquisitionIntent_userId_deckId_idx" ON "AcquisitionIntent"("userId", "deckId");

ALTER TABLE "AcquisitionIntent" ADD CONSTRAINT "AcquisitionIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AcquisitionIntent" ADD CONSTRAINT "AcquisitionIntent_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
