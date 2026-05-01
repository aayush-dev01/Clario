import "@/lib/normalize-clerk-env";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { NotificationTypes } from "@/lib/notification-types";
import { logger, withRequestId } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: Request) {
  const requestMeta = withRequestId();
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local",
    );
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", { status: 400 });
  }

  const body = await req.text();

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    logger.error("clerk.webhook.verify.failed", { ...requestMeta, error: String(err) });
    Sentry.captureException(err);
    return new Response("Error verifying webhook signature", { status: 400 });
  }

  if (evt.type === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    const email =
      email_addresses && email_addresses.length > 0
        ? email_addresses[0].email_address
        : "";
    const firstName = first_name || "";
    const lastName = last_name || "";

    try {
      await prisma.user.create({
        data: {
          id,
          email,
          firstName,
          lastName,
          imageUrl: image_url,
        },
      });
      await createNotification(
        id,
        NotificationTypes.TEACHER_WELCOME,
        "Welcome to Clario",
        "Your account is ready. Pick your role and complete setup to personalize your dashboard.",
        process.env.SOCKET_SERVER_INTERNAL_URL
      );
      logger.info("clerk.webhook.user.created", { ...requestMeta, userId: id });
      return NextResponse.json({ received: true }, { status: 200 });
    } catch (dbError) {
      logger.error("clerk.webhook.user.create.failed", {
        ...requestMeta,
        userId: id,
        error: String(dbError),
      });
      Sentry.captureException(dbError);
      return NextResponse.json(
        { error: "Database sync failed" },
        { status: 500 },
      );
    }
  }

  if (evt.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const email =
      email_addresses && email_addresses.length > 0
        ? email_addresses[0].email_address
        : "";
    try {
      await prisma.user.upsert({
        where: { id },
        create: {
          id,
          email,
          firstName: first_name || "",
          lastName: last_name || "",
          imageUrl: image_url,
        },
        update: {
          email,
          firstName: first_name || "",
          lastName: last_name || "",
          imageUrl: image_url,
        },
      });
      logger.info("clerk.webhook.user.updated", { ...requestMeta, userId: id });
      return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
      logger.error("clerk.webhook.user.updated.failed", {
        ...requestMeta,
        userId: id,
        error: String(error),
      });
      Sentry.captureException(error);
      return NextResponse.json({ error: "Database sync failed" }, { status: 500 });
    }
  }

  if (evt.type === "user.deleted") {
    const { id } = evt.data;
    if (!id) return NextResponse.json({ received: true }, { status: 200 });
    try {
      await prisma.user.delete({ where: { id } });
      logger.info("clerk.webhook.user.deleted", { ...requestMeta, userId: id });
      return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
      logger.error("clerk.webhook.user.deleted.failed", { ...requestMeta, userId: id, error: String(error) });
      Sentry.captureException(error);
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
  }

  // Acknowledge unseen event types
  return NextResponse.json({ received: true }, { status: 200 });
}
