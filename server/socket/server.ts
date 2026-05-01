import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { Server } from "socket.io";

loadEnv({ path: ".env", override: false });
loadEnv({ path: ".env.local", override: false });

const db = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

const clientOrigin = process.env.CLIENT_URL || "http://localhost:3000";
const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const socketServerSecret = process.env.SOCKET_SERVER_SECRET;
const socketTestBypassSecret = process.env.SOCKET_TEST_BYPASS_SECRET;
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = clientOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin: string | undefined) {
  if (!origin) {
    return true;
  }

  if (!isProduction) {
    return true;
  }

  return allowedOrigins.includes(origin);
}

const app = express();
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
  })
);
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST"],
  },
});

const clerkClient = clerkSecretKey ? createClerkClient({ secretKey: clerkSecretKey }) : null;
const userSocketMap = new Map<string, string>();
const roomParticipants = new Map<string, Set<string>>();

type SessionDescriptionPayload = {
  type: string;
  sdp?: string;
};

type IceCandidatePayload = {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
};

type AppRole = "learner" | "teacher";

interface DrawData {
  type: "start" | "draw" | "end";
  x: number;
  y: number;
  color: string;
  width: number;
}

interface SharedResource {
  id: string;
  title: string;
  url: string;
  addedById: string;
  addedByName: string;
  createdAt: string;
}

type JoinRoomPayload = {
  roomId: string;
};

type RoomEventPayload = {
  roomId: string;
};

type SignalingPayload = {
  roomId: string;
  targetSocketId: string;
};

type ChatPayload = {
  roomId: string;
  message: string;
  timestamp: string;
};

type ResourcePayload = {
  roomId: string;
  resource: SharedResource;
};

type SessionWithParticipants = Awaited<ReturnType<typeof getAuthorizedSession>>;

function getParticipantSet(roomId: string) {
  const participants = roomParticipants.get(roomId) ?? new Set<string>();
  roomParticipants.set(roomId, participants);
  return participants;
}

function removeRoomMember(roomId: string, socketId: string) {
  const participants = roomParticipants.get(roomId);
  if (!participants) {
    return;
  }

  participants.delete(socketId);
  if (participants.size === 0) {
    roomParticipants.delete(roomId);
  }
}

function getOtherSocketId(roomId: string, socketId: string) {
  const participants = roomParticipants.get(roomId);
  if (!participants) {
    return null;
  }

  for (const participantSocketId of Array.from(participants)) {
    if (participantSocketId !== socketId) {
      return participantSocketId;
    }
  }

  return null;
}

function emitRoomStatus(roomId: string) {
  io.to(roomId).emit("room-status", {
    participantCount: roomParticipants.get(roomId)?.size ?? 0,
  });
}

function socketIsInRoom(roomId: string, socketId: string) {
  return roomParticipants.get(roomId)?.has(socketId) ?? false;
}

async function getAuthorizedSession(roomId: string, userId: string) {
  const session = await db.session.findUnique({
    where: { roomIdentifier: roomId },
    include: {
      booking: {
        include: {
          teacher: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
          learner: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  const teacherUserId = session.booking.teacher.userId;
  const learnerUserId = session.booking.learner.userId;
  if (userId !== teacherUserId && userId !== learnerUserId) {
    return null;
  }

  return session;
}

function getParticipantIdentity(session: NonNullable<SessionWithParticipants>, userId: string) {
  if (session.booking.teacher.userId === userId) {
    const user = session.booking.teacher.user;
    return {
      role: "teacher" as const,
      userName: `${user.firstName} ${user.lastName}`.trim() || "Teacher",
    };
  }

  const user = session.booking.learner.user;
  return {
    role: "learner" as const,
    userName: `${user.firstName} ${user.lastName}`.trim() || "Learner",
  };
}

async function persistChatMessage(roomId: string, senderId: string, message: string) {
  const session = await getAuthorizedSession(roomId, senderId);
  if (!session) {
    return;
  }

  await db.message.create({
    data: {
      sessionId: session.id,
      senderId,
      content: message,
    },
  });
}

io.use(async (socket, next) => {
  try {
    const testUserId = typeof socket.handshake.auth?.testUserId === "string" ? socket.handshake.auth.testUserId : null;
    const testSecret = typeof socket.handshake.auth?.testBypassSecret === "string" ? socket.handshake.auth.testBypassSecret : null;

    if (socketTestBypassSecret && testUserId && testSecret === socketTestBypassSecret) {
      socket.data.userId = testUserId;
      socket.data.authMode = "test-bypass";
      return next();
    }

    const token = typeof socket.handshake.auth?.token === "string" ? socket.handshake.auth.token : null;
    if (!token) {
      return next(new Error("Missing authentication token"));
    }

    if (!clerkSecretKey) {
      return next(new Error("Socket authentication is not configured"));
    }

    const payload = await verifyToken(token, { secretKey: clerkSecretKey });
    if (!payload.sub) {
      return next(new Error("Invalid authentication token"));
    }

    socket.data.userId = payload.sub;
    socket.data.authMode = "clerk";
    return next();
  } catch (error) {
    console.error("Socket auth failed", error);
    return next(new Error("Invalid authentication token"));
  }
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("register", async () => {
    const userId = socket.data.userId as string | undefined;
    if (!userId) {
      return;
    }

    userSocketMap.set(userId, socket.id);
  });

  socket.on("join-room", async ({ roomId }: JoinRoomPayload) => {
    const userId = socket.data.userId as string | undefined;
    if (!roomId || !userId) {
      socket.emit("room-error", { code: "INVALID_JOIN", message: "Missing room or user context." });
      return;
    }

    const session = await getAuthorizedSession(roomId, userId).catch((error) => {
      console.error("Failed to authorize room join", error);
      return null;
    });

    if (!session) {
      socket.emit("room-error", { code: "UNAUTHORIZED_ROOM", message: "You are not allowed to join this room." });
      return;
    }

    const participants = getParticipantSet(roomId);
    const otherSockets = Array.from(participants).filter((participantSocketId) => participantSocketId !== socket.id);
    if (otherSockets.length >= 2 || (otherSockets.length >= 1 && participants.size >= 2 && !participants.has(socket.id))) {
      socket.emit("room-error", { code: "ROOM_FULL", message: "This session room already has two participants." });
      return;
    }

    const { role, userName } = getParticipantIdentity(session, userId);

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.role = role;
    socket.data.userName = userName;
    socket.data.sessionId = session.id;

    participants.add(socket.id);
    userSocketMap.set(userId, socket.id);

    console.log(`${userName} (${role}) joined room ${roomId}`);

    const otherSocketId = getOtherSocketId(roomId, socket.id);
    if (otherSocketId) {
      const otherSocket = io.sockets.sockets.get(otherSocketId);
      socket.emit("peer-joined", {
        socketId: otherSocketId,
        userName: otherSocket?.data.userName,
        role: otherSocket?.data.role,
      });

      io.to(otherSocketId).emit("peer-joined", {
        socketId: socket.id,
        userName,
        role,
        shouldCreateOffer: true,
      });
    }

    emitRoomStatus(roomId);
  });

  socket.on(
    "offer",
    ({ roomId, offer, targetSocketId }: SignalingPayload & { offer: SessionDescriptionPayload }) => {
      if (!roomId || !targetSocketId) {
        return;
      }
      if (!socketIsInRoom(roomId, socket.id) || !socketIsInRoom(roomId, targetSocketId)) {
        return;
      }

      io.to(targetSocketId).emit("offer", {
        offer,
        from: socket.id,
        fromName: socket.data.userName,
      });
    }
  );

  socket.on(
    "answer",
    ({ roomId, answer, targetSocketId }: SignalingPayload & { answer: SessionDescriptionPayload }) => {
      if (!roomId || !targetSocketId) {
        return;
      }
      if (!socketIsInRoom(roomId, socket.id) || !socketIsInRoom(roomId, targetSocketId)) {
        return;
      }

      io.to(targetSocketId).emit("answer", {
        answer,
        from: socket.id,
      });
    }
  );

  socket.on(
    "ice-candidate",
    ({ roomId, candidate, targetSocketId }: SignalingPayload & { candidate: IceCandidatePayload }) => {
      if (!roomId || !targetSocketId) {
        return;
      }
      if (!socketIsInRoom(roomId, socket.id) || !socketIsInRoom(roomId, targetSocketId)) {
        return;
      }

      io.to(targetSocketId).emit("ice-candidate", {
        candidate,
        from: socket.id,
      });
    }
  );

  socket.on("chat-message", async ({ roomId, message, timestamp }: ChatPayload) => {
    const senderId = socket.data.userId as string | undefined;
    if (!roomId || !senderId || !message.trim() || !socketIsInRoom(roomId, socket.id)) {
      return;
    }

    const payload = {
      senderId,
      senderName: socket.data.userName,
      senderRole: socket.data.role,
      message: message.trim(),
      timestamp,
    };

    io.to(roomId).emit("chat-message", payload);
    await persistChatMessage(roomId, senderId, payload.message).catch((error) => {
      console.error("Failed to persist chat message", error);
    });
  });

  socket.on("whiteboard-draw", ({ roomId, drawData }: RoomEventPayload & { drawData: DrawData }) => {
    if (!roomId || !socketIsInRoom(roomId, socket.id)) {
      return;
    }
    socket.to(roomId).emit("whiteboard-draw", drawData);
  });

  socket.on("whiteboard-clear", ({ roomId }: RoomEventPayload) => {
    if (!roomId || !socketIsInRoom(roomId, socket.id)) {
      return;
    }
    socket.to(roomId).emit("whiteboard-clear");
  });

  socket.on("resource-shared", ({ roomId, resource }: ResourcePayload) => {
    if (!roomId || !socketIsInRoom(roomId, socket.id)) {
      return;
    }
    socket.to(roomId).emit("resource-shared", resource);
  });

  socket.on("screen-share-started", ({ roomId }: RoomEventPayload) => {
    if (!roomId || !socketIsInRoom(roomId, socket.id)) {
      return;
    }
    socket.to(roomId).emit("peer-screen-share-started", {
      from: socket.id,
      fromName: socket.data.userName,
    });
  });

  socket.on("screen-share-stopped", ({ roomId }: RoomEventPayload) => {
    if (!roomId || !socketIsInRoom(roomId, socket.id)) {
      return;
    }
    socket.to(roomId).emit("peer-screen-share-stopped");
  });

  socket.on("end-session", async ({ roomId }: RoomEventPayload) => {
    const userId = socket.data.userId as string | undefined;
    if (!roomId || !userId || !socketIsInRoom(roomId, socket.id)) {
      return;
    }

    const session = await getAuthorizedSession(roomId, userId).catch((error) => {
      console.error("Failed to authorize session end", error);
      return null;
    });

    if (!session) {
      socket.emit("room-error", { code: "UNAUTHORIZED_END", message: "You cannot end this session." });
      return;
    }

    io.to(roomId).emit("session-ended", {
      endedBy: socket.data.userName,
      sessionId: session.id,
    });
  });

  socket.on("leave-room", ({ roomId }: RoomEventPayload) => {
    if (!roomId || !socketIsInRoom(roomId, socket.id)) {
      return;
    }

    socket.leave(roomId);
    removeRoomMember(roomId, socket.id);
    socket.to(roomId).emit("peer-disconnected", {
      socketId: socket.id,
      userName: socket.data.userName,
    });
    emitRoomStatus(roomId);
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId as string | undefined;
    if (roomId) {
      removeRoomMember(roomId, socket.id);
      socket.to(roomId).emit("peer-disconnected", {
        socketId: socket.id,
        userName: socket.data.userName,
      });
      emitRoomStatus(roomId);
    }

    const userId = socket.data.userId as string | undefined;
    if (userId && userSocketMap.get(userId) === socket.id) {
      userSocketMap.delete(userId);
    }

    console.log(`Socket disconnected: ${socket.id}`);
  });
});

app.post("/notify", (req, res) => {
  if (socketServerSecret) {
    const token = req.header("x-socket-server-secret");
    if (token !== socketServerSecret) {
      res.status(401).json({ delivered: false, error: "Unauthorized" });
      return;
    }
  }

  const { userId, notification } = req.body as {
    userId?: string;
    notification?: unknown;
  };

  if (!userId) {
    res.status(400).json({ delivered: false, error: "userId is required" });
    return;
  }

  const socketId = userSocketMap.get(userId);
  if (socketId) {
    io.to(socketId).emit("notification", notification);
  }
  res.json({ delivered: Boolean(socketId) });
});

app.get("/health", async (_req, res) => {
  let clerkReachable = false;
  if (clerkClient) {
    try {
      await clerkClient.users.getUserList({ limit: 1 });
      clerkReachable = true;
    } catch {
      clerkReachable = false;
    }
  }

  res.json({
    status: "ok",
    rooms: roomParticipants.size,
    connections: io.sockets.sockets.size,
    authMode: socketTestBypassSecret ? "clerk+test-bypass" : "clerk-only",
    clerkReachable,
  });
});

const port = Number(process.env.PORT || process.env.SOCKET_PORT || 4000);
const host = process.env.SOCKET_HOST || "0.0.0.0";
httpServer.listen(port, host, () => {
  console.log(`Socket.io server running on http://${host}:${port}`);
});
