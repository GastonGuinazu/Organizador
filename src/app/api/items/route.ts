import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { createItemSchema } from "@/lib/validators";
import { itemInclude, syncItemTags, syncRemindersForItem } from "@/lib/item-service";
import { listItemsForUser } from "@/lib/items-query";

function parseDueAt(iso: string | null | undefined): Date | null {
  if (iso === null || iso === undefined) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: Request) {
  const { userId, response } = await requireSession();
  if (!userId) return response!;

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") ?? "all";
  const items = await listItemsForUser(userId, filter);
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const { userId, response } = await requireSession();
  if (!userId) return response!;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const dueAt = parseDueAt(parsed.data.dueAt ?? undefined);
  const offsets = parsed.data.reminders.map((r) => r.offsetMinutes);

  const item = await prisma.$transaction(async (tx) => {
    const created = await tx.item.create({
      data: {
        userId,
        title: parsed.data.title.trim(),
        description: parsed.data.description ?? "",
        dueAt,
        allDay: parsed.data.allDay,
        timezone: parsed.data.timezone,
        recurrenceRule: parsed.data.recurrenceRule,
        checklistItems: {
          create: parsed.data.checklistItems.map((c, i) => ({
            title: c.title.trim(),
            done: c.done ?? false,
            sortOrder: c.sortOrder ?? i,
          })),
        },
      },
      include: itemInclude,
    });

    await syncRemindersForItem(tx, created.id, dueAt, offsets);
    await syncItemTags(tx, created.id, userId, parsed.data.tagIds);

    return tx.item.findFirstOrThrow({
      where: { id: created.id },
      include: itemInclude,
    });
  });

  return NextResponse.json(item, { status: 201 });
}
