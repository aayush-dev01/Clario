# Cloud Run Deployment

Clario currently needs two Cloud Run services:

- `clario-app`: Next.js web app
- `clario-socket`: Socket.IO signaling + notifications server

This is required because the app and socket server run as separate processes.

## Prerequisites

- Google Cloud project with billing enabled
- `gcloud` authenticated
- Artifact Registry / Cloud Build access
- PostgreSQL database reachable from Cloud Run
- Clerk, Stripe, Anthropic, and any other production secrets ready
- TURN credentials recommended for production WebRTC reliability

## Files added

- `cloudrun/app.Dockerfile`
- `cloudrun/socket.Dockerfile`
- `cloudrun/deploy.ps1`
- `cloudrun/app.env.example.yaml`
- `cloudrun/socket.env.example.yaml`
- `.dockerignore`

## Required environment variables

At minimum, configure these on the deployed services:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SOCKET_URL`
- `SOCKET_SERVER_INTERNAL_URL`
- `SOCKET_SERVER_SECRET`

Optional but strongly recommended for calls:

- `METERED_DOMAIN` and `METERED_SECRET_KEY`
or
- `TURN_SERVER_URLS`
- `TURN_SERVER_USERNAME`
- `TURN_SERVER_CREDENTIAL`

## One-time deploy flow

1. Authenticate:

```powershell
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

2. Build and deploy both services:

```powershell
.\cloudrun\deploy.ps1 -ProjectId YOUR_PROJECT_ID -Region us-central1
```

3. After deploy, update:

- `NEXT_PUBLIC_APP_URL` to the app Cloud Run URL
- Clerk allowed origins / redirect URLs
- any missing secrets in both Cloud Run services

## Notes

- The app container listens on Cloud Run `PORT` through Next standalone output.
- The socket server now also supports Cloud Run `PORT`.
- For production calls across varied networks, STUN-only is often not enough. Add TURN.
