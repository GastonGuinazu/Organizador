import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { itemInclude } from "@/lib/item-service";

export type ListItemsOptions = {
  q?: string;
  tagId?: string;
};

export async function listItemsForUser(userId: string, filter: string, options?: ListItemsOptions) {
  const now = new Date();
  const base = { userId, archived: false as boolean };

  let where: Prisma.ItemWhereInput;

  switch (filter) {
    case "upcoming":
      where = { ...base, completedAt: null, dueAt: { gte: now } };
      break;
    case "overdue":
      where = { ...base, completedAt: null, dueAt: { lt: now } };
      break;
    case "noDate":
      where = { ...base, completedAt: null, dueAt: null };
      break;
    case "archived":
      where = { userId, archived: true };
      break;
    case "all":
    default:
      where = base;
      break;
  }

  const extra: Prisma.ItemWhereInput[] = [];
  const q = options?.q?.trim();
  if (q) {
    extra.push({
      OR: [{ title: { contains: q } }, { description: { contains: q } }],
    });
  }
  if (options?.tagId) {
    extra.push({ itemTags: { some: { tagId: options.tagId } } });
  }

  const finalWhere: Prisma.ItemWhereInput =
    extra.length > 0 ? { AND: [where, ...extra] } : where;

  return prisma.item.findMany({
    where: finalWhere,
    include: itemInclude,
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
  });
}
