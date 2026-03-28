import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { createNotePageSchema } from "@/lib/validators";
import { buildNotePageTree } from "@/lib/note-pages";

export async function GET(req: Request) {
  const { userId, response } = await requireSession();
  if (!userId) return response!;

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";

  const rows = await prisma.notePage.findMany({
    where: { userId },
    select: { id: true, parentId: true, title: true, sortOrder: true },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
  });

  const tree = buildNotePageTree(rows);

  if (!q) {
    return NextResponse.json({ tree });
  }

  const matches = await prisma.notePage.findMany({
    where: {
      userId,
      OR: [{ title: { contains: q } }, { body: { contains: q } }],
    },
    select: { id: true, title: true, parentId: true },
    orderBy: { updatedAt: "desc" },
    take: 25,
  });

  return NextResponse.json({ tree, matches });
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

  const parsed = createNotePageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const parentId = parsed.data.parentId ?? null;
  if (parentId) {
    const parent = await prisma.notePage.findFirst({ where: { id: parentId, userId } });
    if (!parent) {
      return NextResponse.json({ error: "La página padre no existe" }, { status: 400 });
    }
  }

  let sortOrder = parsed.data.sortOrder;
  if (sortOrder === undefined) {
    const agg = await prisma.notePage.aggregate({
      where: { userId, parentId },
      _max: { sortOrder: true },
    });
    sortOrder = (agg._max.sortOrder ?? -1) + 1;
  }

  const page = await prisma.notePage.create({
    data: {
      userId,
      parentId,
      title: parsed.data.title,
      sortOrder,
    },
    select: {
      id: true,
      title: true,
      body: true,
      parentId: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(page, { status: 201 });
}
