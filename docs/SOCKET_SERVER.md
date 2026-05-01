## Socket Server

Clario can run with two local processes:

- Next.js app at `http://localhost:3000`
- Socket.IO server at `http://localhost:4000`

For hosted deployments, you can skip the separate Socket.IO server if Pusher is fully configured:

- `NEXT_PUBLIC_PUSHER_KEY`
- `NEXT_PUBLIC_PUSHER_CLUSTER`
- `PUSHER_APP_ID`
- `PUSHER_SECRET`

### Start locally

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
npm run socket
```

### Environment variables

Ensure these exist in `.env.local` or `.env`:

- `NEXT_PUBLIC_SOCKET_URL=http://localhost:4000`
- `SOCKET_SERVER_INTERNAL_URL=http://localhost:4000`

If you are deploying without the socket fallback, set the Pusher variables above instead.

Optional TURN variables for better network reliability:

- `NEXT_PUBLIC_TURN_SERVER_URL`
- `NEXT_PUBLIC_TURN_SERVER_USERNAME`
- `NEXT_PUBLIC_TURN_SERVER_CREDENTIAL`

### Quick test

1. Seed data with `npm run seed`.
2. Open two different browsers, or one normal window and one incognito window.
3. Sign in as a learner in one browser and a teacher in the other.
4. Open the same session room URL in both tabs: `/session/<roomIdentifier>`.
5. Confirm the remote video, local PiP video, and chat updates appear correctly.

If the UI stays on `Waiting...`, confirm the socket server is running on port `4000` and `NEXT_PUBLIC_SOCKET_URL` points to it.
