-- CreateTable
CREATE TABLE "DeckSnapshot" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cardList" JSONB NOT NULL,
    "commander" TEXT,
    "cardCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeckSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeckSnapshot_deckId_idx" ON "DeckSnapshot"("deckId");

-- AddForeignKey
ALTER TABLE "DeckSnapshot" ADD CONSTRAINT "DeckSnapshot_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
