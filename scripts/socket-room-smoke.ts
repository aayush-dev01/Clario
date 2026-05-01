import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";
import { io, Socket } from "socket.io-client";
import { spawn } from "node:child_process";

loadEnv({ path: ".env", override: true });
loadEnv({ path: ".env.local", override: true });

const prisma = new PrismaClient();
const port = 4100 + Math.floor(Math.random() * 400);
const serverUrl = `http://127.0.0.1:${port}`;
const bypassSecret = `clario-local-test-${randomUUID()}`;

type EventRecord = {
  learnerPeerJoined?: unknown;
  teacherPeerJoined?: unknown;
  teacherChat?: { senderId: string; message: string };
  learnerEnded?: { sessionId: string };
  outsiderError?: { code: string; message: string };
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForProcessExit(childProcess: ReturnType<typeof spawn>, timeoutMs = 5000) {
  return new Promise<void>((resolve) => {
    if (childProcess.exitCode !== null || childProcess.killed) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      childProcess.removeListener("exit", handleExit);
      resolve();
    }, timeoutMs);

    const handleExit = () => {
      clearTimeout(timeoutId);
      resolve();
    };

    childProcess.once("exit", handleExit);
  });
}

function waitForSocketConnect(socket: Socket) {
  return new Promise<void>((resolve, reject) => {
    if (socket.connected) {
      resolve();
      return;
    }

    const onConnect = () => {
      socket.off("connect_error", onError);
      resolve();
    };

    const onError = (error: Error) => {
      socket.off("connect", onConnect);
      reject(error);
    };

    socket.once("connect", onConnect);
    socket.once("connect_error", onError);
  });
}

async function waitFor<T>(getter: () => T | undefined, label: string, timeoutMs = 8000): Promise<T> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = getter();
    if (value !== undefined) {
      return value;
    }
    await wait(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function waitForPersistedMessage(sessionId: string, senderId: string, content: string, timeoutMs = 8000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const message = await prisma.message.findFirst({
      where: { sessionId, senderId, content },
    });
    if (message) {
      return message;
    }
    await wait(100);
  }
  throw new Error("Timed out waiting for persisted chat message");
}

async function main() {
  const learnerUserId = `test_learner_${randomUUID()}`;
  const teacherUserId = `test_teacher_${randomUUID()}`;
  const outsiderUserId = `test_outsider_${randomUUID()}`;
  const teacherProfileId = randomUUID();
  const learnerProfileId = randomUUID();
  const bookingId = randomUUID();
  const sessionId = randomUUID();
  const roomId = `room-${randomUUID()}`;
  const username = `teacher_${randomUUID().slice(0, 8)}`;
  const events: EventRecord = {};

  const cleanupIds = {
    teacherUserId,
    learnerUserId,
    outsiderUserId,
    teacherProfileId,
    learnerProfileId,
    bookingId,
    sessionId,
  };

  const serverProcess = spawn(
    process.execPath,
    ["./node_modules/tsx/dist/cli.mjs", "server/socket/server.ts"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        SOCKET_PORT: String(port),
        SOCKET_TEST_BYPASS_SECRET: bypassSecret,
        CLIENT_URL: "http://localhost:3000",
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  serverProcess.stdout.on("data", (chunk) => process.stdout.write(chunk));
  serverProcess.stderr.on("data", (chunk) => process.stderr.write(chunk));

  try {
    console.log(`[smoke] starting socket server on ${serverUrl}`);
    await new Promise<void>((resolve, reject) => {
      const onData = () => {
        serverProcess.stdout.off("data", onData);
        serverProcess.stderr.off("data", onError);
        resolve();
      };
      const onError = (chunk: Buffer) => {
        const text = chunk.toString("utf8");
        if (text.trim()) {
          reject(new Error(text));
        }
      };
      serverProcess.stdout.on("data", onData);
      serverProcess.stderr.on("data", onError);
    });
    console.log("[smoke] socket server started");

    console.log("[smoke] seeding booked learner + teacher + outsider");
    await prisma.user.create({
      data: {
        id: teacherUserId,
        email: `${teacherUserId}@example.com`,
        firstName: "Teacher",
        lastName: "Tester",
        role: "TEACHER",
        teacherProfile: {
          create: {
            id: teacherProfileId,
            username,
            bio: "Test teacher",
            hourlyRate: new Prisma.Decimal(100),
            onboardingCompleted: true,
          },
        },
      },
    });

    await prisma.user.create({
      data: {
        id: learnerUserId,
        email: `${learnerUserId}@example.com`,
        firstName: "Learner",
        lastName: "Tester",
        role: "LEARNER",
        learnerProfile: {
          create: {
            id: learnerProfileId,
            goals: "Smoke test the room",
            onboardingCompleted: true,
          },
        },
      },
    });

    await prisma.user.create({
      data: {
        id: outsiderUserId,
        email: `${outsiderUserId}@example.com`,
        firstName: "Outsider",
        lastName: "Tester",
        role: "LEARNER",
        learnerProfile: {
          create: {
            goals: "Should not get in",
            onboardingCompleted: true,
          },
        },
      },
    });

    await prisma.booking.create({
      data: {
        id: bookingId,
        teacherId: teacherProfileId,
        learnerId: learnerProfileId,
        startTime: new Date(Date.now() + 60_000),
        endTime: new Date(Date.now() + 3_660_000),
        status: "CONFIRMED",
        session: {
          create: {
            id: sessionId,
            roomIdentifier: roomId,
          },
        },
      },
    });
    console.log(`[smoke] created session ${sessionId} with room ${roomId}`);

    const learnerSocket = io(serverUrl, {
      transports: ["websocket"],
      auth: {
        testBypassSecret: bypassSecret,
        testUserId: learnerUserId,
      },
    });
    const teacherSocket = io(serverUrl, {
      transports: ["websocket"],
      auth: {
        testBypassSecret: bypassSecret,
        testUserId: teacherUserId,
      },
    });
    const outsiderSocket = io(serverUrl, {
      transports: ["websocket"],
      auth: {
        testBypassSecret: bypassSecret,
        testUserId: outsiderUserId,
      },
    });

    learnerSocket.on("peer-joined", (payload) => {
      events.learnerPeerJoined = payload;
    });
    teacherSocket.on("peer-joined", (payload) => {
      events.teacherPeerJoined = payload;
    });
    teacherSocket.on("chat-message", (payload) => {
      events.teacherChat = payload;
    });
    learnerSocket.on("session-ended", (payload) => {
      events.learnerEnded = payload;
    });
    outsiderSocket.on("room-error", (payload) => {
      events.outsiderError = payload;
    });

    console.log("[smoke] waiting for socket connections");
    await Promise.all([waitForSocketConnect(learnerSocket), waitForSocketConnect(teacherSocket), waitForSocketConnect(outsiderSocket)]);
    console.log("[smoke] all sockets connected");

    learnerSocket.emit("register");
    teacherSocket.emit("register");
    outsiderSocket.emit("register");

    console.log("[smoke] learner joining");
    learnerSocket.emit("join-room", { roomId });
    await wait(250);
    console.log("[smoke] teacher joining");
    teacherSocket.emit("join-room", { roomId });
    console.log("[smoke] outsider attempting unauthorized join");
    outsiderSocket.emit("join-room", { roomId });

    console.log("[smoke] waiting for authorized peer handshake");
    await waitFor(() => events.teacherPeerJoined, "teacher peer join");
    await waitFor(() => events.learnerPeerJoined, "learner peer join");
    await waitFor(() => events.outsiderError, "outsider unauthorized room error");
    console.log("[smoke] room auth checks passed");

    console.log("[smoke] sending chat message");
    learnerSocket.emit("chat-message", {
      roomId,
      message: "hello from learner",
      timestamp: new Date().toISOString(),
    });

    const teacherChat = await waitFor(() => events.teacherChat, "teacher chat reception");
    assert.equal(teacherChat.senderId, learnerUserId);
    assert.equal(teacherChat.message, "hello from learner");
    console.log("[smoke] chat relay passed");

    console.log("[smoke] ending session");
    teacherSocket.emit("end-session", { roomId });
    const learnerEnded = await waitFor(() => events.learnerEnded, "session end broadcast");
    assert.equal(learnerEnded.sessionId, sessionId);
    console.log("[smoke] session end relay passed");

    const persistedMessage = await waitForPersistedMessage(sessionId, learnerUserId, "hello from learner");
    assert.ok(persistedMessage, "chat message should persist");
    console.log("[smoke] message persistence passed");

    learnerSocket.disconnect();
    teacherSocket.disconnect();
    outsiderSocket.disconnect();

    console.log("[smoke] socket-room smoke test passed");
  } finally {
    serverProcess.kill();
    await waitForProcessExit(serverProcess);
    await prisma.message.deleteMany({ where: { sessionId: cleanupIds.sessionId } });
    await prisma.session.deleteMany({ where: { id: cleanupIds.sessionId } });
    await prisma.booking.deleteMany({ where: { id: cleanupIds.bookingId } });
    await prisma.teacherProfile.deleteMany({ where: { id: cleanupIds.teacherProfileId } });
    await prisma.learnerProfile.deleteMany({ where: { id: cleanupIds.learnerProfileId } });
    await prisma.user.deleteMany({
      where: { id: { in: [cleanupIds.teacherUserId, cleanupIds.learnerUserId, cleanupIds.outsiderUserId] } },
    });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
