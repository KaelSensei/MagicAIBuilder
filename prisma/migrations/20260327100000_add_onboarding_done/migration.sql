-- Add onboardingDone flag to User
ALTER TABLE "User" ADD COLUMN "onboardingDone" BOOLEAN NOT NULL DEFAULT false;
