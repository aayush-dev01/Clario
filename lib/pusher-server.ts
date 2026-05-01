import PusherServer from 'pusher';

const appId = process.env.PUSHER_APP_ID?.trim();
const key = process.env.NEXT_PUBLIC_PUSHER_KEY?.trim();
const secret = process.env.PUSHER_SECRET?.trim();
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER?.trim();

export const hasPusherServerConfig = Boolean(appId && key && secret && cluster);

export const pusherServer = hasPusherServerConfig
  ? new PusherServer({
      appId: appId as string,
      key: key as string,
      secret: secret as string,
      cluster: cluster as string,
      useTLS: true,
    })
  : null;
