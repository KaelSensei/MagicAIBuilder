-- CreateTable
CREATE TABLE "CardPackage" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'other',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardPackageCard" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "scryfallId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "colorIdentity" TEXT[],
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "imageUri" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "CardPackageCard_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CardPackage_authorId_idx" ON "CardPackage"("authorId");
CREATE INDEX "CardPackage_isPublic_updatedAt_idx" ON "CardPackage"("isPublic", "updatedAt");
CREATE INDEX "CardPackageCard_packageId_idx" ON "CardPackageCard"("packageId");
CREATE UNIQUE INDEX "CardPackageCard_packageId_scryfallId_key" ON "CardPackageCard"("packageId", "scryfallId");

ALTER TABLE "CardPackage" ADD CONSTRAINT "CardPackage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CardPackageCard" ADD CONSTRAINT "CardPackageCard_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "CardPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
