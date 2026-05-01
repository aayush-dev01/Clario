import { NextResponse } from "next/server";
import { hasPusherServerConfig } from "@/lib/pusher-server";

export const dynamic = "force-dynamic";

type RealtimeConfigResponse = {
  pusherKey: string | null;
  pusherCluster: string | null;
  socketUrl: string | null;
};

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isLocalHostname(hostname: string) {
  return LOCAL_HOSTNAMES.has(hostname.toLowerCase());
}

function sanitizeSocketUrl(rawValue: string | undefined, requestUrl: URL) {
  const value = rawValue?.trim();
  if (!value) return null;

  try {
    const parsed = new URL(value);
    const requestHostname = requestUrl.hostname;

    if (!isLocalHostname(requestHostname) && isLocalHostname(parsed.hostname)) {
      return null;
    }

    // On hosted deployments, the app origin itself is not a standalone Socket.IO
    // server. Treat same-origin values as a misconfiguration and prefer Pusher.
    if (!isLocalHostname(requestHostname) && parsed.origin === requestUrl.origin) {
      return null;
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const response: RealtimeConfigResponse = {
    pusherKey: hasPusherServerConfig ? process.env.NEXT_PUBLIC_PUSHER_KEY?.trim() ?? null : null,
    pusherCluster: hasPusherServerConfig ? process.env.NEXT_PUBLIC_PUSHER_CLUSTER?.trim() ?? null : null,
    socketUrl: sanitizeSocketUrl(process.env.NEXT_PUBLIC_SOCKET_URL, requestUrl),
  };

  return NextResponse.json(response);
}
