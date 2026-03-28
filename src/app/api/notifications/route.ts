import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notificationsPatchSchema } from "@/lib/validators";

const DEFAULT_LIMIT = 50;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limitRaw = searchParams.get("limit");
  const limit = Math.min(
    100,
    Math.max(1, limitRaw ? Number.parseInt(limitRaw, 10) || DEFAULT_LIMIT : DEFAULT_LIMIT),
  );

  const [items, unreadCount] = await Promise.all([
    prisma.notificationEvent.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        itemId: true,
        title: true,
        body: true,
        readAt: true,
        createdAt: true,
        channel: true,
      },
    }),
    prisma.notificationEvent.count({
      where: { userId: session.user.id, readAt: null },
    }),
  ]);

  return NextResponse.json({ items, unreadCount });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = notificationsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const now = new Date();

  if (parsed.data.markAllRead) {
    await prisma.notificationEvent.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: now },
    });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.ids?.length) {
    await prisma.notificationEvent.updateMany({
      where: {
        userId: session.user.id,
        id: { in: parsed.data.ids },
      },
      data: { readAt: now },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Indicá ids o markAllRead" }, { status: 400 });
}
