import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN,
  tracesSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,
  environment: process.env.NODE_ENV,
});

