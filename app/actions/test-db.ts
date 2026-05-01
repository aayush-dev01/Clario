"use server";

import { db } from "@/lib/db";

export async function testDbConnection() {
  try {
    const count = await db.user.count();
    return count;
  } catch (error) {
    console.error("Database connection failed:", error);
    return null;
  }
}
