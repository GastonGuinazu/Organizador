import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      timezone: true,
      notificationEmail: true,
      notificationPhone: true,
      reminderEmailEnabled: true,
      reminderSmsEnabled: true,
      quietHoursStart: true,
      quietHoursEnd: true,
      _count: { select: { pushSubscriptions: true } },
    },
  });

  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Ajustes de cuenta</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Datos para avisos, recordatorios y seguridad de tu cuenta.
      </p>
      <div className="mt-8">
        <SettingsForm
          accountEmail={user.email}
          accountTimezone={user.timezone}
          initialNotificationEmail={user.notificationEmail}
          initialNotificationPhone={user.notificationPhone}
          initialReminderEmailEnabled={user.reminderEmailEnabled}
          initialReminderSmsEnabled={user.reminderSmsEnabled}
          initialQuietHoursStart={user.quietHoursStart}
          initialQuietHoursEnd={user.quietHoursEnd}
          pushSubscriptionCount={user._count.pushSubscriptions}
          showDevPushTest={process.env.NODE_ENV === "development"}
          showDevEmailTest={process.env.NODE_ENV === "development"}
        />
      </div>
    </div>
  );
}
