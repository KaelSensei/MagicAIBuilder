ALTER TABLE "Deck"
ADD COLUMN "seekingFeedback" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "feedbackQuestion" TEXT;
