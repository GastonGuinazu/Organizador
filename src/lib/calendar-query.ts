import { prisma } from "@/lib/prisma";
import { itemInclude, type ItemPayload } from "@/lib/item-service";
import { dueAtToDateKey, monthBoundsUtc } from "@/lib/calendar-utils";

export async function fetchCalendarItems(
  userId: string,
  year: number,
  month: number,
  userTimezone: string,
): Promise<{
  inMonth: ItemPayload[];
  undated: ItemPayload[];
  itemsByDateKey: Record<string, ItemPayload[]>;
}> {
  const { start, end } = monthBoundsUtc(year, month, userTimezone);

  const inMonth = await prisma.item.findMany({
    where: {
      userId,
      archived: false,
      dueAt: { gte: start, lte: end },
    },
    include: itemInclude,
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
  });

  const undated = await prisma.item.findMany({
    where: {
      userId,
      archived: false,
      dueAt: null,
      completedAt: null,
    },
    include: itemInclude,
    orderBy: [{ createdAt: "desc" }],
  });

  const itemsByDateKey: Record<string, ItemPayload[]> = {};
  for (const item of inMonth) {
    if (!item.dueAt) continue;
    const key = dueAtToDateKey(item.dueAt, item.timezone);
    if (!itemsByDateKey[key]) itemsByDateKey[key] = [];
    itemsByDateKey[key].push(item);
  }

  return { inMonth, undated, itemsByDateKey };
}
