-- CreateTable
CREATE TABLE "PlaytestSession" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "turns" INTEGER NOT NULL,
    "mulliganCount" INTEGER NOT NULL DEFAULT 0,
    "difficulty" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaytestSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlaytestSession_deckId_idx" ON "PlaytestSession"("deckId");

-- CreateIndex
CREATE INDEX "PlaytestSession_deckId_createdAt_idx" ON "PlaytestSession"("deckId", "createdAt");

-- AddForeignKey
ALTER TABLE "PlaytestSession" ADD CONSTRAINT "PlaytestSession_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaytestSession" ADD CONSTRAINT "PlaytestSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
