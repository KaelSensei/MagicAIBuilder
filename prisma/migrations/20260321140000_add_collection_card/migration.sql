-- CreateTable
CREATE TABLE "CollectionCard" (
    "id" TEXT NOT NULL,
    "scryfallId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "foil" BOOLEAN NOT NULL DEFAULT false,
    "condition" TEXT,
    "acquiredAt" TIMESTAMP(3),
    "price" DOUBLE PRECISION,
    "imageUri" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CollectionCard_scryfallId_idx" ON "CollectionCard"("scryfallId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionCard_scryfallId_foil_key" ON "CollectionCard"("scryfallId", "foil");
