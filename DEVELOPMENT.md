# Running Clario Locally

You need two terminal windows running simultaneously from the project root.

## Terminal 1 - Next.js

```powershell
npm run dev
```

Runs on `http://localhost:3000`.

## Terminal 2 - Socket.IO signaling server

```powershell
npm run socket
```

Runs on `http://localhost:4000`.

## Or run both together

```powershell
npm run dev:all
```

## Same Wi-Fi / same network testing

Use this when you want to open Clario from a second laptop or phone on the same local network.

```powershell
npm run dev:all:lan
```

Then open `http://<your-computer-ip>:3000` on both devices.

## Testing the video call

1. Start both servers.
2. Open `http://localhost:3000` and sign in as a learner.
3. Open `http://localhost:3000` in a different browser or incognito window.
4. Sign in as a teacher, or with a second account.
5. Have both users navigate to the same `/session/[roomId]` URL.
6. Allow camera and microphone permissions in both browsers.
7. The WebRTC connection should establish automatically via STUN.
8. Both video feeds should appear within a few seconds.

## Troubleshooting

- If video does not connect, check the browser console for ICE candidate errors.
- Both participants must be on a network that allows direct P2P connections when using STUN only.
- If users are behind stricter NAT or firewall rules, configure TURN for production reliability.
- Confirm camera and microphone permissions are allowed in both browsers.
