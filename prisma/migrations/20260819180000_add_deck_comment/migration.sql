-- CreateTable
CREATE TABLE "DeckComment" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeckComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeckComment_deckId_createdAt_idx" ON "DeckComment"("deckId", "createdAt");

-- CreateIndex
CREATE INDEX "DeckComment_parentId_idx" ON "DeckComment"("parentId");

-- AddForeignKey
ALTER TABLE "DeckComment" ADD CONSTRAINT "DeckComment_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckComment" ADD CONSTRAINT "DeckComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckComment" ADD CONSTRAINT "DeckComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DeckComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
