-- Idempotent / safe replays: production may have already dropped this index in 20260326000000.
DROP INDEX IF EXISTS "CollectionCard_scryfallId_foil_key";

-- AlterTable
ALTER TABLE "Deck" ALTER COLUMN "targetBracket" SET DEFAULT 3;
ALTER TABLE "Deck" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable (IF NOT EXISTS: avoids failure if a prior partial migration added columns)
ALTER TABLE "DeckCard" ADD COLUMN IF NOT EXISTS "power" TEXT;
ALTER TABLE "DeckCard" ADD COLUMN IF NOT EXISTS "toughness" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "DeckTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "commanderName" TEXT NOT NULL,
    "archetype" TEXT NOT NULL,
    "deckList" JSONB NOT NULL,
    "author" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'community',
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeckTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CardFavorite" (
    "id" TEXT NOT NULL,
    "scryfallId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "typeLine" TEXT NOT NULL,
    "cmc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION,
    "imageUri" TEXT NOT NULL DEFAULT '',
    "userId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "FavoriteList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FavoriteList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CardInFavoriteList" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "scryfallId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CardInFavoriteList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DeckTemplate_commanderName_idx" ON "DeckTemplate"("commanderName");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DeckTemplate_upvotes_idx" ON "DeckTemplate"("upvotes");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CardFavorite_userId_idx" ON "CardFavorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CardFavorite_scryfallId_userId_key" ON "CardFavorite"("scryfallId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FavoriteList_userId_idx" ON "FavoriteList"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CardInFavoriteList_listId_scryfallId_key" ON "CardInFavoriteList"("listId", "scryfallId");

-- AddForeignKey (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CardFavorite_userId_fkey'
  ) THEN
    ALTER TABLE "CardFavorite" ADD CONSTRAINT "CardFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FavoriteList_userId_fkey'
  ) THEN
    ALTER TABLE "FavoriteList" ADD CONSTRAINT "FavoriteList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CardInFavoriteList_listId_fkey'
  ) THEN
    ALTER TABLE "CardInFavoriteList" ADD CONSTRAINT "CardInFavoriteList_listId_fkey" FOREIGN KEY ("listId") REFERENCES "FavoriteList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
