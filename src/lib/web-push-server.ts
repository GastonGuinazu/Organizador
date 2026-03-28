import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { getVapidPublicKey } from "@/lib/vapid-env";

export function configureWebPush(): boolean {
  const pub = getVapidPublicKey();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();
  if (!pub || !priv || !subject) return false;
  webpush.setVapidDetails(subject, pub, priv);
  return true;
}

export type PushSubRow = { id: string; endpoint: string; p256dh: string; auth: string };

export async function sendPushToSubscriptions(
  subs: PushSubRow[],
  payload: Record<string, unknown>,
): Promise<{ sent: number; failed: number }> {
  const body = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        },
        body,
        { TTL: 86_400 },
      );
      sent++;
    } catch (e: unknown) {
      failed++;
      const status =
        typeof e === "object" && e !== null && "statusCode" in e
          ? (e as { statusCode?: number }).statusCode
          : undefined;
      if (status === 410) {
        await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
      }
    }
  }
  return { sent, failed };
}
