import webpush from "web-push";
import { dbAll, dbRun } from "@/lib/db";
import { VAPID_PUBLIC_KEY } from "@/lib/push-config";

const VAPID_PRIVATE_KEY =
  "qli8SqrobzJZbY3tHuE2WHLb5A70k5SyMnwle4eJrT4";

webpush.setVapidDetails(
  "mailto:admin@apx-alliance.local",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function sendPushToAll(title: string, body: string, url: string): Promise<number> {
  const subs = await dbAll<PushSubscriptionRow>(
    "SELECT endpoint, p256dh, auth FROM push_subscriptions"
  );

  if (subs.length === 0) return 0;

  const payload = JSON.stringify({ title, body, url });

  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      )
    )
  );

  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const err = r.reason as { statusCode?: number };
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        void dbRun("DELETE FROM push_subscriptions WHERE endpoint = ?", subs[i].endpoint);
      }
    }
  });

  return subs.length;
}
