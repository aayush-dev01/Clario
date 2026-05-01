/* Purpose: Intentionally avoid creating hardcoded Clario database records. */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  await db.$connect();
  // Existing users, teachers, and AI agents are managed in the database.
  // Keep this seed idempotent and non-destructive unless an explicit import task is added.
  console.info("Seed skipped: no hardcoded records are created.");
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
