"use client";

import PusherClient from "pusher-js";

export type RealtimeClientConfig = {
  pusherKey: string | null;
  pusherCluster: string | null;
  socketUrl: string | null;
};

const EMPTY_REALTIME_CONFIG: RealtimeClientConfig = {
  pusherKey: null,
  pusherCluster: null,
  socketUrl: null,
};

let configCache: RealtimeClientConfig | null = null;
let configPromise: Promise<RealtimeClientConfig> | null = null;
let pusherCache: { key: string; cluster: string; client: PusherClient } | null = null;

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isLocalHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "0.0.0.0" || normalized === "::1";
}

function sanitizeSocketUrl(value: string | null) {
  if (!value || typeof window === "undefined") return value;

  try {
    const parsed = new URL(value, window.location.origin);
    const currentHostname = window.location.hostname;

    if (!isLocalHostname(currentHostname) && isLocalHostname(parsed.hostname)) {
      return null;
    }

    if (!isLocalHostname(currentHostname) && parsed.origin === window.location.origin) {
      return null;
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export async function getRealtimeConfig(): Promise<RealtimeClientConfig> {
  if (configCache) return configCache;

  if (!configPromise) {
    configPromise = fetch("/api/realtime-config", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return EMPTY_REALTIME_CONFIG;

        const payload = await response.json().catch(() => null);
        return {
          pusherKey: normalizeString(payload?.pusherKey),
          pusherCluster: normalizeString(payload?.pusherCluster),
          socketUrl: sanitizeSocketUrl(normalizeString(payload?.socketUrl)),
        };
      })
      .catch(() => EMPTY_REALTIME_CONFIG)
      .then((config) => {
        configCache = config;
        return config;
      })
      .finally(() => {
        configPromise = null;
      });
  }

  return configPromise;
}

export async function getPusherClient() {
  const config = await getRealtimeConfig();
  if (!config.pusherKey || !config.pusherCluster) return null;

  if (
    pusherCache &&
    pusherCache.key === config.pusherKey &&
    pusherCache.cluster === config.pusherCluster
  ) {
    return pusherCache.client;
  }

  pusherCache?.client.disconnect();
  const client = new PusherClient(config.pusherKey, {
    cluster: config.pusherCluster,
  });

  pusherCache = {
    key: config.pusherKey,
    cluster: config.pusherCluster,
    client,
  };

  return client;
}
