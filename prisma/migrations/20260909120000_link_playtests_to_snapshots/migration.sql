ALTER TABLE "PlaytestSession" ADD COLUMN "snapshotId" TEXT;

CREATE INDEX "PlaytestSession_snapshotId_idx" ON "PlaytestSession"("snapshotId");

ALTER TABLE "PlaytestSession"
ADD CONSTRAINT "PlaytestSession_snapshotId_fkey"
FOREIGN KEY ("snapshotId") REFERENCES "DeckSnapshot"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
