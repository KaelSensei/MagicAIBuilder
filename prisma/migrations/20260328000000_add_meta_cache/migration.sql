-- MetaCache table for commander meta analysis (EDHRec + tournament)
CREATE TABLE "MetaCache" (
    "id"            TEXT NOT NULL,
    "commanderSlug" TEXT NOT NULL,
    "source"        TEXT NOT NULL,
    "data"          JSONB NOT NULL,
    "cachedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MetaCache_commanderSlug_source_key" ON "MetaCache"("commanderSlug", "source");
CREATE INDEX "MetaCache_commanderSlug_idx" ON "MetaCache"("commanderSlug");
CREATE INDEX "MetaCache_expiresAt_idx" ON "MetaCache"("expiresAt");
