/* Purpose: Lightweight structured logger for production-safe diagnostics. */

type LogLevel = "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

function base(level: LogLevel, message: string, meta?: LogMeta) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ?? {}),
  };
  // Keep console output JSON for log shipping/grep.
  // eslint-disable-next-line no-console
  console[level === "info" ? "log" : level](JSON.stringify(payload));
}

export const logger = {
  info: (message: string, meta?: LogMeta) => base("info", message, meta),
  warn: (message: string, meta?: LogMeta) => base("warn", message, meta),
  error: (message: string, meta?: LogMeta) => base("error", message, meta),
};

export function withRequestId(meta?: LogMeta) {
  return {
    requestId:
      (meta?.requestId as string | undefined) ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    ...meta,
  };
}

