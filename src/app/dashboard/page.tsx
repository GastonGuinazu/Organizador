import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard-client";
import { DateTime } from "luxon";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
    q?: string;
    tagId?: string;
    calYear?: string;
    calMonth?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const sp = await searchParams;
  const filter = sp.filter ?? "all";
  const q = sp.q;
  const tagId = sp.tagId;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });
  const userTimezone = user?.timezone && user.timezone.length > 0 ? user.timezone : "UTC";

  const now = DateTime.now().setZone(userTimezone);
  const calYearRaw = sp.calYear ? parseInt(sp.calYear, 10) : now.year;
  const calMonthRaw = sp.calMonth ? parseInt(sp.calMonth, 10) : now.month;
  const calYear = Number.isFinite(calYearRaw) ? calYearRaw : now.year;
  const calMonth =
    Number.isFinite(calMonthRaw) && calMonthRaw >= 1 && calMonthRaw <= 12 ? calMonthRaw : now.month;

  return (
    <DashboardClient
      userTimezone={userTimezone}
      filter={filter}
      q={q}
      tagId={tagId}
      calYear={calYear}
      calMonth={calMonth}
    />
  );
}
