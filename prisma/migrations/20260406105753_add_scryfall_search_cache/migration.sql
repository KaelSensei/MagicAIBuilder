-- CreateTable
CREATE TABLE "ScryfallSearchCache" (
    "cacheKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScryfallSearchCache_pkey" PRIMARY KEY ("cacheKey")
);

-- CreateIndex
CREATE INDEX "ScryfallSearchCache_cachedAt_idx" ON "ScryfallSearchCache"("cachedAt");
