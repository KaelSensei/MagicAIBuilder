-- Credentials for the public REST API.
--
-- Only the SHA-256 of a token is stored. The unique index on tokenHash is not
-- merely a constraint: it is the verification path, so authenticating a request
-- is one indexed read rather than a scan-and-compare across every key.
--
-- scopes is populated from the first key rather than added when writes arrive.
-- A key minted before scopes existed would have to be granted something on the
-- day a write endpoint ships, and the only safe default at that point is "all"
-- — a privilege escalation delivered by a deploy.
--
-- revokedAt is a timestamp and not a DELETE: a compromised key's history is the
-- evidence, and deleting the row destroys it.

CREATE TABLE IF NOT EXISTS "ApiKey" (
  "id"            TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "tokenHash"     TEXT NOT NULL,
  "displayPrefix" TEXT NOT NULL,
  "scopes"        TEXT[] NOT NULL DEFAULT ARRAY['decks:read']::TEXT[],
  "revokedAt"     TIMESTAMP(3),
  "expiresAt"     TIMESTAMP(3),
  "lastUsedAt"    TIMESTAMP(3),
  "userId"        TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_tokenHash_key" ON "ApiKey" ("tokenHash");

CREATE INDEX IF NOT EXISTS "ApiKey_userId_idx" ON "ApiKey" ("userId");

ALTER TABLE "ApiKey"
  ADD CONSTRAINT "ApiKey_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
