# Clario

Clario is a premium peer-to-peer live learning platform built for real-time teaching sessions between learners and teachers. The product combines discovery, onboarding, bookings, live video sessions, chat, notes, whiteboarding, feedback, and post-session summaries into one guided experience.

## What the website includes

- A polished public landing page with teacher discovery and positioning for the product
- Separate learner and teacher experiences
- Auth flows and post-auth routing
- Learner onboarding and teacher onboarding
- Teacher profile browsing and booking flows
- Live session rooms with video, chat, notes, resources, and whiteboard support
- Session summaries, feedback, and action-item workflows
- Real-time signaling through Socket.IO, with support for related notification plumbing
- tRPC-based server routes and Prisma-backed data models
- Cloud Run deployment assets for the web app and socket service

## Core stack

- Next.js 14
- React 18
- TypeScript
- Prisma
- tRPC
- Clerk
- Socket.IO
- Tailwind CSS
- Vitest

## Repository structure

This repository is intentionally organized for a cleaner GitHub presentation. Top-level folders are:

- `app`
- `cloudrun`
- `components`
- `docs`
- `hooks`
- `lib`
- `prisma`
- `root`
- `scripts`
- `server`
- `tests`

Important:

The files inside `root/` are framework-critical files that would normally live at the repository root in a standard runnable Next.js app, such as `package.json`, `next.config.mjs`, `tsconfig.json`, and related config files.

## Main product areas

### Public experience

The platform starts with a marketing site focused on clarity, premium design, and trust. Visitors can understand the product, browse featured teachers, and move into discovery and booking.

### Learner experience

Learners can onboard into the system, browse teachers, make bookings, join sessions, track summaries, and review follow-up feedback and action items.

### Teacher experience

Teachers get their own dashboard, schedule, settings, earnings view, and session-related workflows to manage students and ongoing teaching activity.

### Live session experience

Clario supports live learning rooms with video calling, chat, notes, resources, and a collaborative whiteboard. The system includes signaling and realtime configuration endpoints plus a dedicated socket server.

## Deployment

Deployment support is included for Google Cloud Run:

- App deployment assets are in [cloudrun/app.Dockerfile](cloudrun/app.Dockerfile)
- Socket deployment assets are in [cloudrun/socket.Dockerfile](cloudrun/socket.Dockerfile)
- Deployment helper script is in [cloudrun/deploy.ps1](cloudrun/deploy.ps1)

Supporting docs are in:

- [docs/CLOUD_RUN.md](docs/CLOUD_RUN.md)
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- [docs/SOCKET_SERVER.md](docs/SOCKET_SERVER.md)

## How to run locally

Because this repository was reorganized for folder-only top-level visibility, it is not in standard runnable Next.js layout right now.

To run it locally on another device or machine, first restore the framework files back to the repository root:

Move these files from `root/` to the top level:

- `.dockerignore`
- `.eslintrc.json`
- `.gitignore`
- `instrumentation.ts`
- `middleware.ts`
- `next-env.d.ts`
- `next.config.mjs`
- `package-lock.json`
- `package.json`
- `postcss.config.mjs`
- `sentry.client.config.ts`
- `sentry.edge.config.ts`
- `sentry.server.config.ts`
- `tailwind.config.ts`
- `tsconfig.json`
- `vercel.json`
- `vitest.config.ts`

Move this file from `docs/` to the top level:

- `.env.example`

After restoring that standard layout:

1. Install dependencies:

```bash
npm install
```

2. Create local environment variables:

```bash
cp .env.example .env.local
```

3. Fill in required environment variables, especially:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SOCKET_URL`
- `SOCKET_SERVER_INTERNAL_URL`

4. Start the web app:

```bash
npm run dev
```

5. Start the socket server in a second terminal:

```bash
npm run socket
```

Or run both together:

```bash
npm run dev:all
```

For same-network testing on another laptop or phone:

```bash
npm run dev:all:lan
```

Then open:

```text
http://<your-computer-ip>:3000
```

## Testing

Run the test suite with:

```bash
npm test
```

## Note

If you want the repository to remain both:

- visually clean on GitHub
- directly runnable without moving files

the best next step is to convert it into a proper monorepo or wrapper-based structure rather than a presentation-only folder reorganization.
