import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NotificationsList, type NotificationRow } from "@/components/notifications-list";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const rows = await prisma.notificationEvent.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const initialItems: NotificationRow[] = rows.map((r) => ({
    id: r.id,
    itemId: r.itemId,
    title: r.title,
    body: r.body,
    readAt: r.readAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Avisos</h1>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-teal-700 underline dark:text-teal-400"
        >
          Volver al tablero
        </Link>
      </div>
      <div className="mt-6">
        <NotificationsList initialItems={initialItems} />
      </div>
    </div>
  );
}
