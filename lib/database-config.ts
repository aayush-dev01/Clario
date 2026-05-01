/* Purpose: Shared database runtime configuration checks. */

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export const databaseConfigError =
  "This setup step is temporarily unavailable. Please try again shortly.";

export const databaseConfigLogMessage =
  "Database is not configured. Set DATABASE_URL in the local or deployment environment.";
