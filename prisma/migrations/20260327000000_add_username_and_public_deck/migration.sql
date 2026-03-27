-- Add username to User (unique, nullable — users can claim one)
ALTER TABLE "User" ADD COLUMN "username" TEXT;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Add isPublic to Deck (true = visible on public profile)
ALTER TABLE "Deck" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
