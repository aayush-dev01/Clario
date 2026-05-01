import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { hasPusherServerConfig, pusherServer } from '@/lib/pusher-server';
import { NotificationTypes } from '@/lib/notification-types';
import { db } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

type ChatMessagePayload = {
  roomId?: string;
  senderId?: string;
  message?: string;
};

const signalingSchema = z.object({
  channel: z.string().regex(/^session-[A-Za-z0-9_-]+$/),
  event: z.enum([
    'peer-joined',
    'offer',
    'answer',
    'ice-candidate',
    'peer-left',
    'chat-message',
    'session-ended',
  ]),
  data: z.unknown().optional(),
  notifyUsers: z.array(z.string()).optional(),
});

function roomIdFromChannel(channel: string) {
  return channel.replace(/^session-/, '');
}

async function getAuthorizedSession(roomId: string, userId: string) {
  const session = await db.session.findUnique({
    where: { roomIdentifier: roomId },
    include: { booking: { include: { teacher: true, learner: true } } },
  });

  if (!session) return null;

  const learnerUserId = session.booking.learner.userId;
  const teacherUserId = session.booking.teacher.userId;
  const authorized = userId === learnerUserId || userId === teacherUserId;
  return authorized ? session : null;
}

async function persistChatMessage(payload: ChatMessagePayload, userId: string) {
  if (!payload.roomId || !payload.message?.trim()) return;

  const session = await db.session.findUnique({
    where: { roomIdentifier: payload.roomId },
    include: { booking: { include: { teacher: true, learner: true } } },
  });

  if (!session) return;

  const learnerUserId = session.booking.learner.userId;
  const teacherUserId = session.booking.teacher.userId;
  if (userId !== learnerUserId && userId !== teacherUserId) return;

  await db.message.create({
    data: {
      sessionId: session.id,
      senderId: userId,
      content: payload.message.trim(),
    },
  });
}

export async function GET() {
  return NextResponse.json({ configured: hasPusherServerConfig });
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPusherServerConfig || !pusherServer) {
      return NextResponse.json(
        { success: false, error: "Pusher signaling is not configured." },
        { status: 503 }
      );
    }

    const parsed = signalingSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid signaling payload" }, { status: 400 });
    }

    const { channel, event, data } = parsed.data;
    const roomId = roomIdFromChannel(channel);
    const session = await getAuthorizedSession(roomId, userId);
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authorized for this session" }, { status: 403 });
    }

    await pusherServer.trigger(channel, event, data || {});

    if (event === 'chat-message' && data && typeof data === 'object') {
      await persistChatMessage(data as ChatMessagePayload, userId).catch((error) => {
        console.error('Chat persistence error:', error);
      });
    }

    if (event === 'session-ended') {
      const notification = {
        type: NotificationTypes?.SESSION_COMPLETE || "SESSION_COMPLETE",
        title: "Session complete",
        message: "This session ended successfully.",
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      
      const userChannels = [
        session.booking.teacher.userId,
        session.booking.learner.userId,
      ].map((id) => `user-${id}`);
        
      if (userChannels.length > 0) {
        await pusherServer.trigger(userChannels, 'notification', notification);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Signaling error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
