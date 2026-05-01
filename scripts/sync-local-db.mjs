import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  const env = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function run(command, args, env) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runPrismaSqlFile(filePath, env) {
  run("npx", ["prisma", "db", "execute", "--file", filePath, "--schema", "prisma/schema.prisma"], env);
}

async function tableExists(db, tableName) {
  const [row] = await db.$queryRawUnsafe(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = '${tableName}'
    ) AS "exists"`
  );
  return Boolean(row?.exists);
}

async function columnExists(db, tableName, columnName) {
  const [row] = await db.$queryRawUnsafe(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = '${tableName}'
        AND column_name = '${columnName}'
    ) AS "exists"`
  );
  return Boolean(row?.exists);
}

async function backfillProfiles(env) {
  const db = new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });

  try {
    await db.$connect();

    await db.$executeRawUnsafe(
      `UPDATE "User"
       SET "role" = 'LEARNER'::"Role"
       WHERE "role" IS NULL`
    );

    const legacyUserColumns = {
      goals: await columnExists(db, "User", "goals"),
      onboardingCompleted: await columnExists(db, "User", "onboardingCompleted"),
      stripeCustId: await columnExists(db, "User", "stripeCustId"),
    };

    const legacyUsers = legacyUserColumns.goals || legacyUserColumns.onboardingCompleted || legacyUserColumns.stripeCustId
      ? await db.$queryRawUnsafe(
          `SELECT
            "id",
            ${legacyUserColumns.goals ? `"goals"` : `NULL AS "goals"`},
            ${legacyUserColumns.onboardingCompleted ? `"onboardingCompleted"` : `false AS "onboardingCompleted"`},
            ${legacyUserColumns.stripeCustId ? `"stripeCustId"` : `NULL AS "stripeCustId"`}
          FROM "public"."User"`
        )
      : [];

    const legacyUserMap = new Map(legacyUsers.map((user) => [user.id, user]));

    const existingUsers = await db.user.findMany({
      select: {
        id: true,
        role: true,
      },
    });
    const existingUserIds = new Set(existingUsers.map((user) => user.id));

    const learnerIds = new Set(
      existingUsers
        .filter((user) => user.role !== "TEACHER")
        .map((user) => user.id)
    );

    const learnerIdsFromBookings = await db.$queryRawUnsafe(
      `SELECT DISTINCT "learnerId" AS id FROM "public"."Booking"`
    );
    for (const row of learnerIdsFromBookings) {
      if (row?.id && existingUserIds.has(row.id)) learnerIds.add(row.id);
    }

    const learnerIdsFromFeedback = await db.$queryRawUnsafe(
      `SELECT DISTINCT "learnerId" AS id FROM "public"."Feedback"`
    ).catch(() => []);
    for (const row of learnerIdsFromFeedback) {
      if (row?.id && existingUserIds.has(row.id)) learnerIds.add(row.id);
    }

    for (const userId of learnerIds) {
      if (!existingUserIds.has(userId)) continue;

      const legacyUser = legacyUserMap.get(userId);
      await db.learnerProfile.upsert({
        where: { userId },
        create: {
          id: randomUUID(),
          userId,
          goals: legacyUser?.goals ?? "",
          onboardingCompleted: Boolean(legacyUser?.onboardingCompleted),
          stripeCustId: legacyUser?.stripeCustId ?? null,
        },
        update: {
          goals: legacyUser?.goals ?? undefined,
          onboardingCompleted: legacyUser?.onboardingCompleted ?? undefined,
          stripeCustId: legacyUser?.stripeCustId ?? undefined,
        },
      });
    }

    const teacherIds = new Set();
    const collectTeacherIds = async (query) => {
      const rows = await db.$queryRawUnsafe(query).catch(() => []);
      for (const row of rows) {
        if (row?.id) teacherIds.add(row.id);
      }
    };

    for (const user of existingUsers) {
      if (user.role === "TEACHER") {
        teacherIds.add(user.id);
      }
    }

    const collectTeacherUserIds = async (query) => {
      const rows = await db.$queryRawUnsafe(query).catch(() => []);
      for (const row of rows) {
        if (row?.id && existingUserIds.has(row.id)) teacherIds.add(row.id);
      }
    };

    await collectTeacherUserIds(`SELECT DISTINCT "teacherId" AS id FROM "public"."Booking"`);
    await collectTeacherUserIds(`SELECT DISTINCT "teacherId" AS id FROM "public"."Feedback"`);
    await collectTeacherUserIds(`SELECT DISTINCT "teacherId" AS id FROM "public"."TeacherAvailability"`);
    await collectTeacherUserIds(`SELECT DISTINCT "A" AS id FROM "public"."_TeacherTopics"`);

    const hasLegacyTeacherTable = await tableExists(db, "Teacher");
    const legacyTeachers = hasLegacyTeacherTable
      ? await db.$queryRawUnsafe(
          `SELECT
            "id",
            "email",
            "firstName",
            "lastName",
            "imageUrl",
            "timezone",
            "username",
            "bio",
            "hourlyRate",
            "isAccepting",
            "onboardingCompleted",
            "stripeConnectId"
          FROM "public"."Teacher"`
        )
      : [];

    const legacyTeacherMap = new Map(legacyTeachers.map((teacher) => [teacher.id, teacher]));
    for (const teacher of legacyTeachers) {
      teacherIds.add(teacher.id);
    }

    for (const teacherId of teacherIds) {
      const legacyTeacher = legacyTeacherMap.get(teacherId);
      if (!existingUserIds.has(teacherId) && !legacyTeacher) continue;

      const existingUser = await db.user.findUnique({
        where: { id: teacherId },
        select: { id: true },
      });

      if (!existingUser) {
        await db.user.create({
          data: {
            id: teacherId,
            email: legacyTeacher?.email ?? `temp-${teacherId}@example.com`,
            firstName: legacyTeacher?.firstName ?? "",
            lastName: legacyTeacher?.lastName ?? "",
            imageUrl: legacyTeacher?.imageUrl ?? null,
            timezone: legacyTeacher?.timezone ?? "UTC",
            role: "TEACHER",
          },
        });
      } else {
        await db.user.update({
          where: { id: teacherId },
          data: {
            role: "TEACHER",
            email: legacyTeacher?.email ?? undefined,
            firstName: legacyTeacher?.firstName ?? undefined,
            lastName: legacyTeacher?.lastName ?? undefined,
            imageUrl: legacyTeacher?.imageUrl ?? undefined,
            timezone: legacyTeacher?.timezone ?? undefined,
          },
        });
      }

      await db.teacherProfile.upsert({
        where: { userId: teacherId },
        create: {
          id: randomUUID(),
          userId: teacherId,
          username: legacyTeacher?.username ?? `teacher_${teacherId.slice(-6)}`,
          bio: legacyTeacher?.bio ?? "Legacy teacher profile",
          hourlyRate: legacyTeacher?.hourlyRate ?? 0,
          isAccepting: legacyTeacher?.isAccepting ?? true,
          onboardingCompleted: Boolean(legacyTeacher?.onboardingCompleted),
          stripeConnectId: legacyTeacher?.stripeConnectId ?? null,
        },
        update: {
          username: legacyTeacher?.username ?? undefined,
          bio: legacyTeacher?.bio ?? undefined,
          hourlyRate: legacyTeacher?.hourlyRate ?? undefined,
          isAccepting: legacyTeacher?.isAccepting ?? undefined,
          onboardingCompleted: legacyTeacher?.onboardingCompleted ?? undefined,
          stripeConnectId: legacyTeacher?.stripeConnectId ?? undefined,
        },
      });
    }
  } finally {
    await db.$disconnect();
  }
}

async function backfillVideoCallData(env) {
  const db = new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });

  try {
    await db.$connect();

    const sessionsMissingRoomIdentifier = await db.$queryRawUnsafe(
      `SELECT "id"
       FROM "public"."Session"
       WHERE "roomIdentifier" IS NULL OR "roomIdentifier" = ''`
    ).catch(() => []);

    for (const session of sessionsMissingRoomIdentifier) {
      if (!session?.id) continue;

      await db.session.update({
        where: { id: session.id },
        data: { roomIdentifier: randomUUID() },
      });
    }

    const duplicateRoomIdentifiers = await db.$queryRawUnsafe(
      `SELECT "id"
       FROM (
         SELECT
           "id",
           ROW_NUMBER() OVER (PARTITION BY "roomIdentifier" ORDER BY "id") AS "rowNumber"
         FROM "public"."Session"
         WHERE "roomIdentifier" IS NOT NULL AND "roomIdentifier" <> ''
       ) AS "ranked"
       WHERE "rowNumber" > 1`
    ).catch(() => []);

    for (const session of duplicateRoomIdentifiers) {
      if (!session?.id) continue;

      await db.session.update({
        where: { id: session.id },
        data: { roomIdentifier: randomUUID() },
      });
    }

    const bookingsMissingSession = await db.booking.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
        session: { is: null },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
      },
    });

    if (bookingsMissingSession.length > 0) {
      await db.session.createMany({
        data: bookingsMissingSession.map((booking) => ({
          id: randomUUID(),
          bookingId: booking.id,
          roomIdentifier: randomUUID(),
          startedAt: booking.status === "COMPLETED" ? booking.startTime : null,
          endedAt: booking.status === "COMPLETED" ? booking.endTime : null,
        })),
      });
    }
  } finally {
    await db.$disconnect();
  }
}

const repoRoot = process.cwd();
const mergedEnv = {
  ...process.env,
  ...loadEnvFile(resolve(repoRoot, ".env")),
  ...loadEnvFile(resolve(repoRoot, ".env.local")),
};

if (!mergedEnv.DATABASE_URL?.trim()) {
  console.error("DATABASE_URL is required in .env.local or .env.");
  process.exit(1);
}

if (!mergedEnv.DIRECT_URL?.trim()) {
  mergedEnv.DIRECT_URL = mergedEnv.DATABASE_URL;
}

runPrismaSqlFile("prisma/legacy-profile-migration.sql", mergedEnv);
runPrismaSqlFile("prisma/video-call-migration.sql", mergedEnv);
await backfillProfiles(mergedEnv);
await backfillVideoCallData(mergedEnv);
run("npx", ["prisma", "db", "push", "--accept-data-loss", "--skip-generate"], mergedEnv);
