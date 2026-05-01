import { NextResponse } from "next/server";

type IceServerPayload = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

const DEFAULT_STUN_URLS = [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
];

function parseUrls(...values: Array<string | undefined>) {
  const urls = new Set<string>();

  for (const value of values) {
    if (!value) continue;
    for (const part of value.split(",")) {
      const next = part.trim();
      if (next) {
        if (!next.startsWith("turn:") && !next.startsWith("stun:") && !next.startsWith("turns:")) {
          urls.add(`turn:${next}`);
        } else {
          urls.add(next);
        }
      }
    }
  }

  return Array.from(urls);
}

function isPlaceholderValue(value: string | undefined) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized.includes("placeholder") || normalized.includes("example.com");
}

function firstNonEmpty(...values: Array<string | undefined>) {
  for (const value of values) {
    const next = value?.trim();
    if (next && !isPlaceholderValue(next)) return next;
  }
  return undefined;
}

export const dynamic = "force-dynamic";

export async function GET() {
  const meteredDomain = process.env.METERED_DOMAIN;
  const meteredSecretKey = process.env.METERED_SECRET_KEY;

  let iceServers: IceServerPayload[] = [{ urls: DEFAULT_STUN_URLS }];

  if (meteredDomain && meteredSecretKey) {
    try {
      const res = await fetch(`https://${meteredDomain}/api/v1/turn/credentials?apiKey=${meteredSecretKey}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const meteredCreds = await res.json();
        if (Array.isArray(meteredCreds)) {
          iceServers = [...iceServers, ...meteredCreds];
        }
      }
    } catch (error) {
      console.error("Failed to fetch TURN credentials from Metered:", error);
    }
  } else {
    // Fallback to static TURN server config
    const turnUrls = parseUrls(
      process.env.TURN_SERVER_URLS,
      process.env.TURN_SERVER_URL,
      process.env.NEXT_PUBLIC_TURN_SERVER_URLS,
      process.env.NEXT_PUBLIC_TURN_SERVER_URL
    ).filter((url) => !isPlaceholderValue(url));
    
    const username = firstNonEmpty(
      process.env.TURN_SERVER_USERNAME,
      process.env.NEXT_PUBLIC_TURN_SERVER_USERNAME
    );
    const credential = firstNonEmpty(
      process.env.TURN_SERVER_CREDENTIAL,
      process.env.NEXT_PUBLIC_TURN_SERVER_CREDENTIAL
    );

    if (turnUrls.length > 0) {
      iceServers.push({
        urls: turnUrls.length === 1 ? turnUrls[0] : turnUrls,
        ...(username ? { username } : {}),
        ...(credential ? { credential } : {}),
      });
    }
  }

  return NextResponse.json({
    iceServers,
    iceCandidatePoolSize: 10,
  });
}
