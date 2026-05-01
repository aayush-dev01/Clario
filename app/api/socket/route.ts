/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import { Server } from 'socket.io';
import { NextResponse } from 'next/server';
import { NotificationTypes } from '@/lib/notification-types';
import { logger } from '@/lib/logger';

let io: Server;

export async function GET(req: Request) {
  if (!io) {
    // @ts-ignore
    const httpServer = (global as any).__socketServer;
    io = new Server(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: [
          process.env.NEXT_PUBLIC_APP_URL || '',
          'http://localhost:3000'
        ],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    setupSocketHandlers(io);
  }
  return NextResponse.json({ status: 'Socket server running' });
}

function setupSocketHandlers(io: Server) {
  const roomMap = new Map<string, Set<string>>();
  const userSocketMap = new Map<string, string>();
  const metrics = {
    connectionsCurrent: 0,
    connectionsTotal: 0,
    sessionJoinsTotal: 0,
    sessionJoinSuccess: 0,
    callDropsTotal: 0,
  };

  const NEXT_INTERNAL_TRPC_URL = process.env.NEXT_INTERNAL_TRPC_URL ?? "http://localhost:3000/api/trpc";

  function upsertRoomMember(roomId: string, socketId: string) {
    const set = roomMap.get(roomId) ?? new Set<string>();
    set.add(socketId);
    roomMap.set(roomId, set);
  }

  function removeRoomMember(roomId: string, socketId: string) {
    const set = roomMap.get(roomId);
    if (!set) return;
    set.delete(socketId);
    if (set.size === 0) roomMap.delete(roomId);
  }

  function getOtherSocketId(roomId: string, socketId: string) {
    const set = roomMap.get(roomId);
    if (!set) return null;
    for (const id of Array.from(set.values())) {
      if (id !== socketId) return id;
    }
    return null;
  }

  async function persistChatMessage(payload: any) {
    const body = {
      json: {
        roomId: payload.roomId,
        senderId: payload.senderId,
        content: payload.message,
      },
    };
    const url = `${NEXT_INTERNAL_TRPC_URL}/messages.create`;
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
  }

  io.on('connection', (socket) => {
    metrics.connectionsCurrent += 1;
    metrics.connectionsTotal += 1;
    logger?.info("socket.connected", { socketId: socket.id, connectionsCurrent: metrics.connectionsCurrent });
    
    socket.on("register", (payload: any) => {
      if (!payload?.userId) return;
      userSocketMap.set(payload.userId, socket.id);
    });

    socket.on("join-room", (payload: any) => {
      if (!payload?.roomId) return;
      metrics.sessionJoinsTotal += 1;
      socket.join(payload.roomId);
      upsertRoomMember(payload.roomId, socket.id);

      const set = roomMap.get(payload.roomId);
      if (set && set.size >= 2) {
        const other = getOtherSocketId(payload.roomId, socket.id);
        if (other) {
          metrics.sessionJoinSuccess += 1;
          socket.to(other).emit("peer-joined", { socketId: socket.id });
        }
      }
    });

    socket.on("offer", (payload: any) => {
      if (!payload?.targetSocketId) return;
      io.to(payload.targetSocketId).emit("offer", { offer: payload.offer, from: socket.id });
    });

    socket.on("answer", (payload: any) => {
      if (!payload?.targetSocketId) return;
      io.to(payload.targetSocketId).emit("answer", { answer: payload.answer, from: socket.id });
    });

    socket.on("ice-candidate", (payload: any) => {
      if (!payload?.targetSocketId) return;
      io.to(payload.targetSocketId).emit("ice-candidate", { candidate: payload.candidate, from: socket.id });
    });

    socket.on("leave-room", (payload: any) => {
      if (!payload?.roomId) return;
      socket.leave(payload.roomId);
      removeRoomMember(payload.roomId, socket.id);
      socket.to(payload.roomId).emit("peer-left", { socketId: socket.id });
    });

    socket.on("chat-message", async (payload: any) => {
      if (!payload?.roomId || !payload?.message) return;
      socket.to(payload.roomId).emit("chat-message", {
        roomId: payload.roomId,
        message: payload.message,
        senderId: payload.senderId,
        senderName: payload.senderName,
        createdAt: new Date().toISOString(),
      });
      await persistChatMessage(payload);
    });

    socket.on("session-end", ({ roomId, sessionId, teacherUserId, learnerUserId }: any) => {
      if (!roomId) return;
      io.to(roomId).emit("session-ended", { roomId, sessionId });
      const notification = {
        type: NotificationTypes?.SESSION_COMPLETE || "SESSION_COMPLETE",
        title: "Session complete",
        message: "This session ended successfully.",
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      if (teacherUserId && userSocketMap.get(teacherUserId)) {
        io.to(userSocketMap.get(teacherUserId) as string).emit("notification", notification);
      }
      if (learnerUserId && userSocketMap.get(learnerUserId)) {
        io.to(userSocketMap.get(learnerUserId) as string).emit("notification", notification);
      }
      roomMap.delete(roomId);
    });

    socket.on("disconnect", () => {
      metrics.connectionsCurrent = Math.max(0, metrics.connectionsCurrent - 1);
      for (const [userId, sockId] of Array.from(userSocketMap.entries())) {
        if (sockId === socket.id) userSocketMap.delete(userId);
      }
      for (const [roomId, set] of Array.from(roomMap.entries())) {
        if (set.has(socket.id)) {
          set.delete(socket.id);
          metrics.callDropsTotal += 1;
          socket.to(roomId).emit("peer-left", { socketId: socket.id });
          if (set.size === 0) roomMap.delete(roomId);
        }
      }
      logger?.info("socket.disconnected", { socketId: socket.id, connectionsCurrent: metrics.connectionsCurrent });
    });
  });
}
