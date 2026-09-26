ALTER TABLE "User" ADD COLUMN "isModerator" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "DeckReport"
ADD COLUMN "reviewedById" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3);

CREATE INDEX "DeckReport_status_createdAt_idx" ON "DeckReport"("status", "createdAt");

ALTER TABLE "DeckReport" ADD CONSTRAINT "DeckReport_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
