import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      reminderEmailEnabled: true,
      _count: { select: { pushSubscriptions: true } },
    },
  });

  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Ajustes de cuenta</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Elegí cómo querés recibir recordatorios.
      </p>
      <div className="mt-8">
        <SettingsForm
          initialReminderEmailEnabled={user.reminderEmailEnabled}
          pushSubscriptionCount={user._count.pushSubscriptions}
        />
      </div>
    </div>
  );
}
