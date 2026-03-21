-- CreateTable
CREATE TABLE "Deck" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'commander',
    "targetBracket" INTEGER NOT NULL DEFAULT 2,
    "budget" DOUBLE PRECISION,
    "commanderId" TEXT,
    "partnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Deck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeckCard" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "scryfallId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manaCost" TEXT NOT NULL DEFAULT '',
    "cmc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "typeLine" TEXT NOT NULL DEFAULT '',
    "oracleText" TEXT NOT NULL DEFAULT '',
    "colorIdentity" TEXT[],
    "isGameChanger" BOOLEAN NOT NULL DEFAULT false,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION,
    "imageUri" TEXT NOT NULL DEFAULT '',
    "artCropUri" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'other',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isCommander" BOOLEAN NOT NULL DEFAULT false,
    "isPartner" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "DeckCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardCache" (
    "scryfallId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CardCache_pkey" PRIMARY KEY ("scryfallId")
);

-- CreateIndex
CREATE INDEX "DeckCard_deckId_idx" ON "DeckCard"("deckId");

-- CreateIndex
CREATE INDEX "CardCache_cachedAt_idx" ON "CardCache"("cachedAt");

-- AddForeignKey
ALTER TABLE "DeckCard" ADD CONSTRAINT "DeckCard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
