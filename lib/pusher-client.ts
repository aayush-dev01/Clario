import PusherClient from 'pusher-js';

const pushKey = process.env.NEXT_PUBLIC_PUSHER_KEY?.trim();
const pushCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER?.trim();

export const hasPusherClientConfig = Boolean(pushKey && pushCluster);

export const pusherClient = hasPusherClientConfig
  ? new PusherClient(pushKey as string, {
      cluster: pushCluster as string,
    })
  : null;
