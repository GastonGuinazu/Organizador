import { Resend } from "resend";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { escapeHtml } from "@/lib/escape-html";

export type ProcessRemindersResult = {
  processed: number;
  emailsSent: number;
  skippedEmailErrors: number;
  pushSent: number;
  pushFailed: number;
  mode: "email" | "mark-sent-without-email";
};

function formatDue(item: { dueAt: Date | null; allDay: boolean }): string {
  if (!item.dueAt) return "sin fecha";
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: item.allDay ? undefined : "short",
  }).format(item.dueAt);
}

function configureWebPush(): boolean {
  const pub = process.env.VAPID_PUBLIC_KEY?.trim();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();
  if (!pub || !priv || !subject) return false;
  webpush.setVapidDetails(subject, pub, priv);
  return true;
}

export async function processDueReminders(now = new Date()): Promise<ProcessRemindersResult> {
  const reminders = await prisma.reminder.findMany({
    where: {
      fireAt: { lte: now, not: null },
      sentAt: null,
      item: {
        completedAt: null,
        archived: false,
      },
    },
    include: {
      item: {
        include: { user: true },
      },
    },
  });

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const resend = resendKey && from ? new Resend(resendKey) : null;
  const pushOk = configureWebPush();

  let emailed = 0;
  let skipped = 0;
  let pushSent = 0;
  let pushFailed = 0;

  for (const r of reminders) {
    const item = r.item;
    const user = item.user;
    const due = formatDue(item);
    const dueLine = `Vence: ${due}.`;

    if (user.reminderEmailEnabled && resend) {
      const { error } = await resend.emails.send({
        from: from!,
        to: user.email,
        subject: `Recordatorio: ${item.title}`,
        html: `<p>Tu actividad <strong>${escapeHtml(item.title)}</strong> vence: ${escapeHtml(due)}.</p>
          ${item.description ? `<p>${escapeHtml(item.description).slice(0, 2000)}</p>` : ""}`,
      });
      if (error) {
        skipped++;
        continue;
      }
      emailed++;
    }

    await prisma.$transaction([
      prisma.notificationEvent.create({
        data: {
          userId: user.id,
          itemId: item.id,
          reminderId: r.id,
          channel: "reminder",
          title: `Recordatorio: ${item.title}`,
          body: dueLine,
        },
      }),
      prisma.reminder.update({
        where: { id: r.id },
        data: { sentAt: now },
      }),
    ]);

    if (pushOk) {
      const subs = await prisma.pushSubscription.findMany({
        where: { userId: user.id },
      });
      const payload = JSON.stringify({
        title: `Recordatorio: ${item.title}`,
        body: dueLine,
        url: `/dashboard/items/${item.id}`,
      });
      for (const s of subs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: s.endpoint,
              keys: { p256dh: s.p256dh, auth: s.auth },
            },
            payload,
            { TTL: 86_400 },
          );
          pushSent++;
        } catch (e: unknown) {
          pushFailed++;
          const status = typeof e === "object" && e !== null && "statusCode" in e ? (e as { statusCode?: number }).statusCode : undefined;
          if (status === 410) {
            await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
          }
        }
      }
    }
  }

  return {
    processed: reminders.length,
    emailsSent: emailed,
    skippedEmailErrors: skipped,
    pushSent,
    pushFailed,
    mode: resend ? "email" : "mark-sent-without-email",
  };
}
