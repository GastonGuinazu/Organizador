import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { escapeHtml } from "@/lib/escape-html";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { formatDueForReminder } from "@/lib/reminder-due-format";
import { isWithinQuietHours } from "@/lib/quiet-hours";
import { configureWebPush, sendPushToSubscriptions } from "@/lib/web-push-server";
import { isTwilioConfigured, sendTwilioSms } from "@/lib/twilio-sms";

export type ProcessRemindersResult = {
  processed: number;
  deferredQuietHours: number;
  emailsSent: number;
  skippedEmailErrors: number;
  pushSent: number;
  pushFailed: number;
  smsSent: number;
  smsFailed: number;
  mode: "email" | "mark-sent-without-email";
};

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
  const baseUrl = getAppBaseUrl();

  let deferredQuietHours = 0;
  let emailed = 0;
  let skipped = 0;
  let pushSent = 0;
  let pushFailed = 0;
  let smsSent = 0;
  let smsFailed = 0;

  for (const r of reminders) {
    const item = r.item;
    const user = item.user;

    if (
      isWithinQuietHours(now, user.timezone, user.quietHoursStart, user.quietHoursEnd)
    ) {
      deferredQuietHours++;
      continue;
    }

    const due = formatDueForReminder(item);
    const dueLine = `Vence: ${due}.`;
    const itemPath = `/dashboard/items/${item.id}`;
    const itemUrl = `${baseUrl}${itemPath}`;

    if (user.reminderEmailEnabled && resend) {
      const toEmail = user.notificationEmail?.trim() || user.email;
      const { error } = await resend.emails.send({
        from: from!,
        to: toEmail,
        subject: `Recordatorio: ${item.title}`,
        html: `<p>Tu actividad <strong>${escapeHtml(item.title)}</strong> vence: ${escapeHtml(due)} (${escapeHtml(item.timezone || "UTC")}).</p>
          ${item.description ? `<p>${escapeHtml(item.description).slice(0, 2000)}</p>` : ""}
          <p><a href="${escapeHtml(itemUrl)}">Abrir en Organizador</a></p>
          <p style="font-size:12px;color:#64748b">Gestioná avisos en Ajustes de tu cuenta.</p>`,
      });
      if (error) {
        skipped++;
      } else {
        emailed++;
      }
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
      const { sent, failed } = await sendPushToSubscriptions(subs, {
        title: `Recordatorio: ${item.title}`,
        body: `${dueLine} Toca para abrir.`,
        url: itemPath,
      });
      pushSent += sent;
      pushFailed += failed;
    }

    if (user.reminderSmsEnabled && user.notificationPhone?.trim() && isTwilioConfigured()) {
      const smsBody = `Organizador: "${item.title}" — ${dueLine} ${itemUrl}`;
      const result = await sendTwilioSms(user.notificationPhone.trim(), smsBody.slice(0, 1600));
      if (result.ok) {
        smsSent++;
      } else {
        smsFailed++;
      }
    }
  }

  return {
    processed: reminders.length,
    deferredQuietHours,
    emailsSent: emailed,
    skippedEmailErrors: skipped,
    pushSent,
    pushFailed,
    smsSent,
    smsFailed,
    mode: resend ? "email" : "mark-sent-without-email",
  };
}
