-- CreateTable
CREATE TABLE "DeckVote" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeckVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeckVote_deckId_idx" ON "DeckVote"("deckId");

-- CreateIndex
CREATE UNIQUE INDEX "DeckVote_userId_deckId_key" ON "DeckVote"("userId", "deckId");

-- AddForeignKey
ALTER TABLE "DeckVote" ADD CONSTRAINT "DeckVote_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckVote" ADD CONSTRAINT "DeckVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
