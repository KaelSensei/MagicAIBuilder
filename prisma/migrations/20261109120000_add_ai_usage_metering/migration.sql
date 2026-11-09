-- AI metering and the monthly allowance (I-30 slices 1 and 2).
--
-- AiUsage is the ledger: one row per model call, failed calls included, with
-- the tokens the provider reported and the cost from the dated price table.
-- Rows are personal data and go with the user.
--
-- UsageCounter holds one count per user, key and UTC month. A call is claimed
-- with a single conditional UPDATE (used < limit). PostgreSQL locks the row
-- and re-checks the condition after waiting for a concurrent update, so two
-- instances cannot both take the last unit.
--
-- AiMonthlySpend keeps the month's total across all users for the global
-- spend ceiling. It has no user column, so deleting an account does not lower
-- the month's spend.

CREATE TABLE "AiUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheReadTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheWriteTokens" INTEGER NOT NULL DEFAULT 0,
    "stopReason" TEXT,
    "outcome" TEXT NOT NULL,
    "costMicroUsd" INTEGER NOT NULL DEFAULT 0,
    "priceTableVersion" TEXT NOT NULL,
    "countsAgainstAllowance" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiUsage_userId_createdAt_idx" ON "AiUsage"("userId", "createdAt");

ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UsageCounter" (
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UsageCounter_pkey" PRIMARY KEY ("userId","key","periodStart")
);

ALTER TABLE "UsageCounter" ADD CONSTRAINT "UsageCounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AiMonthlySpend" (
    "periodStart" TIMESTAMP(3) NOT NULL,
    "spentMicroUsd" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "AiMonthlySpend_pkey" PRIMARY KEY ("periodStart")
);
