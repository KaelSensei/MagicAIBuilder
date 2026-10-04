CREATE TABLE "DeckFolder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DeckFolder_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Deck" ADD COLUMN "folderId" TEXT;

CREATE UNIQUE INDEX "DeckFolder_userId_name_key" ON "DeckFolder"("userId", "name");
CREATE INDEX "DeckFolder_userId_idx" ON "DeckFolder"("userId");
CREATE INDEX "Deck_folderId_idx" ON "Deck"("folderId");

ALTER TABLE "DeckFolder" ADD CONSTRAINT "DeckFolder_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Deck" ADD CONSTRAINT "Deck_folderId_fkey"
FOREIGN KEY ("folderId") REFERENCES "DeckFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
