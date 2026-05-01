const CLERK_PUBLISHABLE_KEY = "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY";
const CLERK_SECRET_KEY = "CLERK_SECRET_KEY";
const CLERK_WEBHOOK_SECRET = "CLERK_WEBHOOK_SECRET";
const CLERK_PUBLISHABLE_KEY_PATTERN = /^pk_(test|live)_[A-Za-z0-9_-]+$/;

function stripWrappingQuotes(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function isValidClerkPublishableKey(value: string) {
  const normalized = stripWrappingQuotes(value);
  return CLERK_PUBLISHABLE_KEY_PATTERN.test(normalized);
}

function normalizeEnvVar(name: string) {
  const current = process.env[name];
  if (!current) return;
  process.env[name] = stripWrappingQuotes(current);
}

let normalized = false;

export function normalizeClerkEnv() {
  if (normalized) return;
  normalized = true;

  normalizeEnvVar(CLERK_SECRET_KEY);
  normalizeEnvVar(CLERK_WEBHOOK_SECRET);
  normalizeEnvVar(CLERK_PUBLISHABLE_KEY);

  const publishableKey = process.env[CLERK_PUBLISHABLE_KEY];
  if (publishableKey && !isValidClerkPublishableKey(publishableKey)) {
    process.env[CLERK_PUBLISHABLE_KEY] = "";
  }
}

normalizeClerkEnv();
