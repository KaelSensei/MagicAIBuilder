-- Let POST /api/decks replay a create (a double click, a reload mid-request)
-- instead of writing a second deck. NULL keys never collide, so existing decks
-- and creates without a key are unaffected.
ALTER TABLE "Deck" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "Deck_userId_idempotencyKey_key" ON "Deck"("userId", "idempotencyKey");
