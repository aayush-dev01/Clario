/* Purpose: Socket.io signaling + realtime notifications server for Clario (runs separately from Next.js). */

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import * as Sentry from "@sentry/node";
import { verifyToken } from "@clerk/backend";
import { db } from "../../lib/db";
import * as notificationTypesModule from "../../lib/notification-types";
import * as loggerModule from "../../lib/logger";

const notificationTypesCompat = notificationTypesModule as typeof notificationTypesModule & {
  default?: { NotificationTypes?: typeof notificationTypesModule.NotificationTypes };
};
const loggerCompat = loggerModule as typeof loggerModule & {
  default?: { logger?: typeof loggerModule.logger };
};

const NotificationTypes =
  notificationTypesCompat.NotificationTypes ??
  notificationTypesCompat.default?.NotificationTypes;
const logger = loggerCompat.logger ?? loggerCompat.default?.logger;

type JoinRoomPayload = { roomId: string; userId: string; role: "LEARNER" | "TEACHER" | "ADMIN" | string };
type OfferPayload = { roomId: string; offer: unknown; targetSocketId: string };
type AnswerPayload = { roomId: string; answer: unknown; targetSocketId: string };
type IcePayload = { roomId: string; candidate: unknown; targetSocketId: string };
type LeaveRoomPayload = { roomId: string };
type ChatPayload = { roomId: string; message: string; senderId: string; senderName: string; sessionId?: string };
type RegisterPayload = { userId: string };
type SessionEndPayload = {
  roomId: string;
  sessionId: string;
  teacherUserId?: string;
  learnerUserId?: string;
};

type NotifyBody = { userId: string; notification: unknown };
type AuthorizedSession = Awaited<ReturnType<typeof getAuthorizedSession>>;

const PORT = Number(process.env.PORT ?? 4000);
const SENTRY_DSN = process.env.SENTRY_DSN;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const SOCKET_SERVER_SECRET = process.env.SOCKET_SERVER_SECRET;
const corsOrigin =
  process.env.NODE_ENV === "production"
    ? (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
    : "*";

if (SENTRY_DSN) {
  Sentry.init({ dsn: SENTRY_DSN, environment: process.env.NODE_ENV });
}

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "OPTIONS"],
  })
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
  },
});

// roomId -> set of socketIds
const roomMap = new Map<string, Set<string>>();
// userId -> socketId (latest connection)
const userSocketMap = new Map<string, string>();
const metrics = {
  connectionsCurrent: 0,
  connectionsTotal: 0,
  sessionJoinsTotal: 0,
  sessionJoinSuccess: 0,
  callDropsTotal: 0,
};

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

function isRoomMember(roomId: string, socketId: string) {
  return roomMap.get(roomId)?.has(socketId) ?? false;
}

function isRoomTarget(roomId: string, socketId: string) {
  return roomMap.get(roomId)?.has(socketId) ?? false;
}

async function getAuthorizedSession(roomId: string, userId: string) {
  const session = await db.session.findUnique({
    where: { roomIdentifier: roomId },
    include: { booking: { include: { teacher: true, learner: true } } },
  });

  if (!session) return null;

  const learnerUserId = session.booking.learner.userId;
  const teacherUserId = session.booking.teacher.userId;
  if (userId !== learnerUserId && userId !== teacherUserId) return null;

  return session;
}

async function persistChatMessage(payload: ChatPayload) {
  const session = await getAuthorizedSession(payload.roomId, payload.senderId);
  if (!session) return;

  await db.message.create({
    data: {
      sessionId: session.id,
      senderId: payload.senderId,
      content: payload.message.trim(),
    },
  });
}

// HTTP endpoint for server-to-server notification delivery
app.get("/", (_req, res) => {
  res.redirect(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/notify", (req, res) => {
  if (SOCKET_SERVER_SECRET) {
    const token = req.header("x-socket-server-secret");
    if (token !== SOCKET_SERVER_SECRET) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }
  }

  const { userId, notification } = req.body as NotifyBody;
  if (!userId) return res.status(400).json({ ok: false, error: "userId required" });
  const socketId = userSocketMap.get(userId);
  if (!socketId) return res.json({ ok: true, delivered: false });
  io.to(socketId).emit("notification", notification);
  return res.json({ ok: true, delivered: true });
});

app.get("/metrics", (_req, res) => {
  res.json({
    socketConnectionsCurrent: metrics.connectionsCurrent,
    socketConnectionsTotal: metrics.connectionsTotal,
    sessionJoinsTotal: metrics.sessionJoinsTotal,
    sessionJoinSuccessRate:
      metrics.sessionJoinsTotal === 0
        ? 0
        : Number((metrics.sessionJoinSuccess / metrics.sessionJoinsTotal).toFixed(4)),
    callDropRate:
      metrics.sessionJoinsTotal === 0
        ? 0
        : Number((metrics.callDropsTotal / metrics.sessionJoinsTotal).toFixed(4)),
    callDropsTotal: metrics.callDropsTotal,
  });
});

io.use(async (socket, next) => {
  try {
    if (!CLERK_SECRET_KEY) {
      return next(new Error("Socket authentication is not configured"));
    }

    const token = socket.handshake.auth?.token;
    if (typeof token !== "string" || !token.trim()) {
      return next(new Error("Missing authentication token"));
    }

    const payload = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
    if (!payload.sub) {
      return next(new Error("Invalid authentication token"));
    }

    socket.data.userId = payload.sub;
    next();
  } catch (error) {
    Sentry.captureException(error);
    next(new Error("Invalid authentication token"));
  }
});

io.on("connection", (socket) => {
  metrics.connectionsCurrent += 1;
  metrics.connectionsTotal += 1;
  logger.info("socket.connected", { socketId: socket.id, connectionsCurrent: metrics.connectionsCurrent });
  socket.on("register", (payload: RegisterPayload) => {
    if (payload?.userId && payload.userId !== socket.data.userId) return;
    userSocketMap.set(socket.data.userId, socket.id);
  });

  socket.on("join-room", async (payload: JoinRoomPayload) => {
    if (!payload?.roomId) return;
    metrics.sessionJoinsTotal += 1;
    const session = await getAuthorizedSession(payload.roomId, socket.data.userId).catch((error) => {
      Sentry.captureException(error);
      return null;
    });
    if (!session) return;

    socket.join(payload.roomId);
    upsertRoomMember(payload.roomId, socket.id);

    const set = roomMap.get(payload.roomId);
    if (set && set.size >= 2) {
      const other = getOtherSocketId(payload.roomId, socket.id);
      if (other) {
        metrics.sessionJoinSuccess += 1;
        // Only the existing peer becomes the offerer.
        socket.to(other).emit("peer-joined", { socketId: socket.id });
      }
    }
  });

  socket.on("offer", (payload: OfferPayload) => {
    if (!payload?.targetSocketId) return;
    if (!isRoomMember(payload.roomId, socket.id) || !isRoomTarget(payload.roomId, payload.targetSocketId)) return;
    io.to(payload.targetSocketId).emit("offer", { offer: payload.offer, from: socket.id });
  });

  socket.on("answer", (payload: AnswerPayload) => {
    if (!payload?.targetSocketId) return;
    if (!isRoomMember(payload.roomId, socket.id) || !isRoomTarget(payload.roomId, payload.targetSocketId)) return;
    io.to(payload.targetSocketId).emit("answer", { answer: payload.answer, from: socket.id });
  });

  socket.on("ice-candidate", (payload: IcePayload) => {
    if (!payload?.targetSocketId) return;
    if (!isRoomMember(payload.roomId, socket.id) || !isRoomTarget(payload.roomId, payload.targetSocketId)) return;
    io.to(payload.targetSocketId).emit("ice-candidate", { candidate: payload.candidate, from: socket.id });
  });

  socket.on("leave-room", (payload: LeaveRoomPayload) => {
    if (!payload?.roomId) return;
    if (!isRoomMember(payload.roomId, socket.id)) return;
    socket.leave(payload.roomId);
    removeRoomMember(payload.roomId, socket.id);
    socket.to(payload.roomId).emit("peer-left", { socketId: socket.id });
  });

  socket.on("chat-message", async (payload: ChatPayload) => {
    if (!payload?.roomId || !payload?.message) return;
    if (!isRoomMember(payload.roomId, socket.id)) return;
    const senderId = socket.data.userId;
    socket.to(payload.roomId).emit("chat-message", {
      roomId: payload.roomId,
      message: payload.message,
      senderId,
      senderName: payload.senderName,
      createdAt: new Date().toISOString(),
    });
    await persistChatMessage({ ...payload, senderId });
  });

  socket.on("session-end", async ({ roomId, teacherUserId, learnerUserId }: SessionEndPayload) => {
    if (!roomId) return;
    if (!isRoomMember(roomId, socket.id)) return;
    const session: AuthorizedSession = await getAuthorizedSession(roomId, socket.data.userId).catch((error) => {
      Sentry.captureException(error);
      return null;
    });
    if (!session) return;

    io.to(roomId).emit("session-ended", { roomId, sessionId: session.id });
    const notification = {
      type: NotificationTypes.SESSION_COMPLETE,
      title: "Session complete",
      message: "This session ended successfully.",
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    const authorizedTeacherUserId = session.booking.teacher.userId;
    const authorizedLearnerUserId = session.booking.learner.userId;
    if (teacherUserId === authorizedTeacherUserId && userSocketMap.get(authorizedTeacherUserId)) {
      io.to(userSocketMap.get(authorizedTeacherUserId) as string).emit("notification", notification);
    }
    if (learnerUserId === authorizedLearnerUserId && userSocketMap.get(authorizedLearnerUserId)) {
      io.to(userSocketMap.get(authorizedLearnerUserId) as string).emit("notification", notification);
    }
    roomMap.delete(roomId);
  });

  socket.on("disconnect", () => {
    metrics.connectionsCurrent = Math.max(0, metrics.connectionsCurrent - 1);
    // cleanup userSocketMap entries pointing to this socket
    for (const [userId, sockId] of Array.from(userSocketMap.entries())) {
      if (sockId === socket.id) userSocketMap.delete(userId);
    }
    // best-effort cleanup of rooms
    for (const [roomId, set] of Array.from(roomMap.entries())) {
      if (set.has(socket.id)) {
        set.delete(socket.id);
        metrics.callDropsTotal += 1;
        socket.to(roomId).emit("peer-left", { socketId: socket.id });
        if (set.size === 0) roomMap.delete(roomId);
      }
    }
    logger.info("socket.disconnected", { socketId: socket.id, connectionsCurrent: metrics.connectionsCurrent });
  });
});

server.listen(PORT, () => {
  logger.info("socket.server.started", { port: PORT });
});
