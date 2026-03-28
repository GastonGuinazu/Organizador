import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { listItemsForUser } from "@/lib/items-query";
import { fetchCalendarItems } from "@/lib/calendar-query";
import { itemToPlain } from "@/lib/item-plain";
import { DateTime } from "luxon";

export async function GET(req: Request) {
  const { userId, response } = await requireSession();
  if (!userId) return response!;

  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") ?? "all";
  const q = url.searchParams.get("q")?.trim() || undefined;
  const tagId = url.searchParams.get("tagId") || undefined;
  const calYearRaw = url.searchParams.get("calYear");
  const calMonthRaw = url.searchParams.get("calMonth");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  const userTimezone = user?.timezone && user.timezone.length > 0 ? user.timezone : "UTC";

  const now = DateTime.now().setZone(userTimezone);
  const calYearParsed = calYearRaw ? parseInt(calYearRaw, 10) : now.year;
  const calMonthParsed = calMonthRaw ? parseInt(calMonthRaw, 10) : now.month;
  const calYear = Number.isFinite(calYearParsed) ? calYearParsed : now.year;
  const calMonth =
    Number.isFinite(calMonthParsed) && calMonthParsed >= 1 && calMonthParsed <= 12
      ? calMonthParsed
      : now.month;

  const [items, tags, cal] = await Promise.all([
    listItemsForUser(userId, filter, { q, tagId }),
    prisma.tag.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
    fetchCalendarItems(userId, calYear, calMonth, userTimezone),
  ]);

  const itemsByDateKeyPlain: Record<string, ReturnType<typeof itemToPlain>[]> = {};
  for (const [k, arr] of Object.entries(cal.itemsByDateKey)) {
    itemsByDateKeyPlain[k] = arr.map(itemToPlain);
  }

  return NextResponse.json({
    userTimezone,
    calYear,
    calMonth,
    items: items.map(itemToPlain),
    tags,
    calendar: {
      undated: cal.undated.map(itemToPlain),
      itemsByDateKey: itemsByDateKeyPlain,
    },
  });
}
