-- Allow both participants to submit feedback for the same booking.
-- Existing one-feedback-per-booking rows are attributed to the learner.

ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "authorId" TEXT;

UPDATE "Feedback"
SET "authorId" = "LearnerProfile"."userId"
FROM "LearnerProfile"
WHERE "Feedback"."learnerId" = "LearnerProfile"."id"
  AND "Feedback"."authorId" IS NULL;

ALTER TABLE "Feedback" ALTER COLUMN "authorId" SET NOT NULL;

ALTER TABLE "Feedback"
  ADD CONSTRAINT "Feedback_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "Feedback_bookingId_key";
CREATE INDEX IF NOT EXISTS "Feedback_learnerId_idx" ON "Feedback"("learnerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Feedback_bookingId_authorId_key" ON "Feedback"("bookingId", "authorId");
