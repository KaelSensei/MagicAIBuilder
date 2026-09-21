CREATE TABLE "PublicDeckFolder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PublicDeckFolder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SavedPublicDeck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "folderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SavedPublicDeck_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PublicDeckFolder_userId_name_key" ON "PublicDeckFolder"("userId", "name");
CREATE INDEX "PublicDeckFolder_userId_idx" ON "PublicDeckFolder"("userId");
CREATE UNIQUE INDEX "SavedPublicDeck_userId_deckId_key" ON "SavedPublicDeck"("userId", "deckId");
CREATE INDEX "SavedPublicDeck_folderId_idx" ON "SavedPublicDeck"("folderId");

ALTER TABLE "PublicDeckFolder" ADD CONSTRAINT "PublicDeckFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedPublicDeck" ADD CONSTRAINT "SavedPublicDeck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedPublicDeck" ADD CONSTRAINT "SavedPublicDeck_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedPublicDeck" ADD CONSTRAINT "SavedPublicDeck_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "PublicDeckFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
