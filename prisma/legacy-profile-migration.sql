BEGIN;

DO $$
BEGIN
  CREATE TYPE "Role" AS ENUM ('LEARNER', 'TEACHER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "role" "Role";

UPDATE "User"
SET "role" = 'LEARNER'::"Role"
WHERE "role" IS NULL;

ALTER TABLE "User"
  ALTER COLUMN "role" SET DEFAULT 'LEARNER'::"Role";

ALTER TABLE "User"
  ALTER COLUMN "role" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "LearnerProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "goals" TEXT,
  "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
  "stripeCustId" TEXT,
  CONSTRAINT "LearnerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TeacherProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "bio" TEXT NOT NULL,
  "hourlyRate" DECIMAL(10, 2) NOT NULL,
  "isAccepting" BOOLEAN NOT NULL DEFAULT true,
  "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
  "stripeConnectId" TEXT,
  CONSTRAINT "TeacherProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LearnerProfile_userId_key"
  ON "LearnerProfile"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "LearnerProfile_stripeCustId_key"
  ON "LearnerProfile"("stripeCustId");

CREATE UNIQUE INDEX IF NOT EXISTS "TeacherProfile_userId_key"
  ON "TeacherProfile"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "TeacherProfile_username_key"
  ON "TeacherProfile"("username");

CREATE UNIQUE INDEX IF NOT EXISTS "TeacherProfile_stripeConnectId_key"
  ON "TeacherProfile"("stripeConnectId");

COMMIT;
