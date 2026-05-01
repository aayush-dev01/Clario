function stripWrappingQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function isValidClerkPublishableKey(value) {
  const normalized = stripWrappingQuotes(value);
  const match = normalized.match(/^pk_(test|live)_(.+)$/);
  if (!match) return false;

  try {
    const base64 = match[2].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return atob(padded).includes(".");
  } catch {
    return false;
  }
}

function normalizeClerkEnv() {
  for (const key of [
    "CLERK_SECRET_KEY",
    "CLERK_WEBHOOK_SECRET",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  ]) {
    if (process.env[key]) {
      process.env[key] = stripWrappingQuotes(process.env[key]);
    }
  }

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (publishableKey && !isValidClerkPublishableKey(publishableKey)) {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "";
  }
}

normalizeClerkEnv();

/** @type {import('next').NextConfig} */
const nextConfig = {
  staticPageGenerationTimeout: 0,
  output: "standalone",
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "@prisma/instrumentation",
        "require-in-the-middle",
      ];
    }

    return config;
  },
};

export default nextConfig;
