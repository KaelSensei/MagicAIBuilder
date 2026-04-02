-- DropIndex
DROP INDEX "CollectionCard_scryfallId_foil_key";

-- AlterTable
ALTER TABLE "Deck" ALTER COLUMN "targetBracket" SET DEFAULT 3,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DeckCard" ADD COLUMN     "power" TEXT,
ADD COLUMN     "toughness" TEXT;

-- CreateTable
CREATE TABLE "DeckTemplate" (
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
CREATE TABLE "CardFavorite" (
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
CREATE TABLE "FavoriteList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FavoriteList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardInFavoriteList" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "scryfallId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CardInFavoriteList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeckTemplate_commanderName_idx" ON "DeckTemplate"("commanderName");

-- CreateIndex
CREATE INDEX "DeckTemplate_upvotes_idx" ON "DeckTemplate"("upvotes");

-- CreateIndex
CREATE INDEX "CardFavorite_userId_idx" ON "CardFavorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CardFavorite_scryfallId_userId_key" ON "CardFavorite"("scryfallId", "userId");

-- CreateIndex
CREATE INDEX "FavoriteList_userId_idx" ON "FavoriteList"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CardInFavoriteList_listId_scryfallId_key" ON "CardInFavoriteList"("listId", "scryfallId");

-- AddForeignKey
ALTER TABLE "CardFavorite" ADD CONSTRAINT "CardFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteList" ADD CONSTRAINT "FavoriteList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardInFavoriteList" ADD CONSTRAINT "CardInFavoriteList_listId_fkey" FOREIGN KEY ("listId") REFERENCES "FavoriteList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
