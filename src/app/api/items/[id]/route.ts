import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { updateItemSchema } from "@/lib/validators";
import {
  getItemForUser,
  itemInclude,
  resyncUnsentReminderTimes,
  syncItemTags,
  syncRemindersForItem,
} from "@/lib/item-service";

function parseDueAt(iso: string | null | undefined): Date | null | undefined {
  if (iso === undefined) return undefined;
  if (iso === null) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { userId, response } = await requireSession();
  if (!userId) return response!;
  const { id } = await ctx.params;
  const item = await getItemForUser(id, userId);
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { userId, response } = await requireSession();
  if (!userId) return response!;
  const { id } = await ctx.params;

  const existing = await getItemForUser(id, userId);
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const dueParsed = data.dueAt !== undefined ? parseDueAt(data.dueAt) : undefined;

  const item = await prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description;
    if (dueParsed !== undefined) updateData.dueAt = dueParsed;
    if (data.allDay !== undefined) updateData.allDay = data.allDay;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.recurrenceRule !== undefined) updateData.recurrenceRule = data.recurrenceRule;
    if (data.archived !== undefined) updateData.archived = data.archived;
    if (data.completedAt !== undefined) {
      updateData.completedAt =
        data.completedAt === null ? null : new Date(data.completedAt);
    }

    if (Object.keys(updateData).length > 0) {
      await tx.item.update({ where: { id }, data: updateData });
    }

    if (data.checklistItems !== undefined) {
      await tx.checklistItem.deleteMany({ where: { itemId: id } });
      await tx.checklistItem.createMany({
        data: data.checklistItems.map((c, i) => ({
          itemId: id,
          title: c.title.trim(),
          done: c.done ?? false,
          sortOrder: c.sortOrder ?? i,
        })),
      });
    }

    const updated = await tx.item.findFirstOrThrow({
      where: { id },
      include: itemInclude,
    });

    const effectiveDue = dueParsed !== undefined ? dueParsed : updated.dueAt;

    if (data.reminders !== undefined) {
      const offsets = data.reminders.map((r) => r.offsetMinutes);
      await syncRemindersForItem(tx, id, effectiveDue, offsets);
    } else if (dueParsed !== undefined) {
      await resyncUnsentReminderTimes(tx, id, effectiveDue);
    }

    if (data.tagIds !== undefined) {
      await syncItemTags(tx, id, userId, data.tagIds);
    }

    return tx.item.findFirstOrThrow({
      where: { id },
      include: itemInclude,
    });
  });

  return NextResponse.json(item);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { userId, response } = await requireSession();
  if (!userId) return response!;
  const { id } = await ctx.params;

  const existing = await prisma.item.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.item.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
