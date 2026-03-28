import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeFireAt } from "@/lib/reminders";

const itemInclude = {
  reminders: true,
  checklistItems: { orderBy: { sortOrder: "asc" as const } },
  itemTags: { include: { tag: true } },
} satisfies Prisma.ItemInclude;

export type ItemPayload = Prisma.ItemGetPayload<{ include: typeof itemInclude }>;

export async function getItemForUser(id: string, userId: string) {
  return prisma.item.findFirst({
    where: { id, userId },
    include: itemInclude,
  });
}

export async function syncRemindersForItem(
  tx: Prisma.TransactionClient,
  itemId: string,
  dueAt: Date | null,
  offsets: number[],
) {
  await tx.reminder.deleteMany({
    where: { itemId, sentAt: null },
  });
  if (!dueAt || offsets.length === 0) return;
  await tx.reminder.createMany({
    data: offsets.map((offsetMinutes) => ({
      itemId,
      offsetMinutes,
      fireAt: computeFireAt(dueAt, offsetMinutes),
    })),
  });
}

export async function resyncUnsentReminderTimes(
  tx: Prisma.TransactionClient,
  itemId: string,
  dueAt: Date | null,
) {
  if (!dueAt) {
    await tx.reminder.updateMany({
      where: { itemId, sentAt: null },
      data: { fireAt: null },
    });
    return;
  }
  const reminders = await tx.reminder.findMany({
    where: { itemId, sentAt: null },
  });
  for (const r of reminders) {
    await tx.reminder.update({
      where: { id: r.id },
      data: { fireAt: computeFireAt(dueAt, r.offsetMinutes) },
    });
  }
}

export async function syncItemTags(
  tx: Prisma.TransactionClient,
  itemId: string,
  userId: string,
  tagIds: string[],
) {
  await tx.itemTag.deleteMany({ where: { itemId } });
  if (tagIds.length === 0) return;
  const tags = await tx.tag.findMany({
    where: { userId, id: { in: tagIds } },
    select: { id: true },
  });
  const allowed = new Set(tags.map((t) => t.id));
  const data = tagIds.filter((id) => allowed.has(id)).map((tagId) => ({ itemId, tagId }));
  if (data.length) await tx.itemTag.createMany({ data });
}

export { itemInclude };
