BEGIN;

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Session"
  ADD COLUMN IF NOT EXISTS "bookingId" TEXT;

ALTER TABLE "Session"
  ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3);

ALTER TABLE "Session"
  ADD COLUMN IF NOT EXISTS "endedAt" TIMESTAMP(3);

ALTER TABLE "Session"
  ADD COLUMN IF NOT EXISTS "roomIdentifier" TEXT;

ALTER TABLE "Session"
  ADD COLUMN IF NOT EXISTS "isRecorded" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Session"
SET "roomIdentifier" = NULL
WHERE "roomIdentifier" = '';

CREATE TABLE IF NOT EXISTS "SessionSummary" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  CONSTRAINT "SessionSummary_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SessionSummary"
  ADD COLUMN IF NOT EXISTS "sessionId" TEXT;

ALTER TABLE "SessionSummary"
  ADD COLUMN IF NOT EXISTS "transcriptUrl" TEXT;

ALTER TABLE "SessionSummary"
  ADD COLUMN IF NOT EXISTS "aiGeneratedNotes" TEXT;

UPDATE "SessionSummary"
SET "aiGeneratedNotes" = COALESCE("aiGeneratedNotes", '')
WHERE "aiGeneratedNotes" IS NULL;

CREATE TABLE IF NOT EXISTS "ActionItem" (
  "id" TEXT NOT NULL,
  "sessionSummaryId" TEXT NOT NULL,
  "task" TEXT NOT NULL,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "ActionItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ActionItem"
  ADD COLUMN IF NOT EXISTS "sessionSummaryId" TEXT;

ALTER TABLE "ActionItem"
  ADD COLUMN IF NOT EXISTS "task" TEXT;

ALTER TABLE "ActionItem"
  ADD COLUMN IF NOT EXISTS "isCompleted" BOOLEAN NOT NULL DEFAULT false;

UPDATE "ActionItem"
SET "task" = COALESCE("task", '')
WHERE "task" IS NULL;

CREATE TABLE IF NOT EXISTS "Message" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "sessionId" TEXT;

ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "senderId" TEXT;

ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "content" TEXT;

ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Message"
SET "content" = COALESCE("content", '')
WHERE "content" IS NULL;

CREATE INDEX IF NOT EXISTS "Message_sessionId_idx"
  ON "Message"("sessionId");

COMMIT;
