import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { updateNotePageSchema } from "@/lib/validators";
import { sanitizeNoteHtml } from "@/lib/sanitize-note-html";
import { collectNotePageSubtreeIds } from "@/lib/note-pages";
import { deleteNoteMediaFile } from "@/lib/note-media-storage";

type Ctx = { params: Promise<{ id: string }> };

async function wouldCreateCycle(userId: string, nodeId: string, newParentId: string | null) {
  if (newParentId === null) return false;
  if (newParentId === nodeId) return true;

  const pages = await prisma.notePage.findMany({
    where: { userId },
    select: { id: true, parentId: true },
  });
  const parentOf = new Map(pages.map((p) => [p.id, p.parentId]));
  let cur: string | null = newParentId;
  while (cur) {
    if (cur === nodeId) return true;
    cur = parentOf.get(cur) ?? null;
  }
  return false;
}

export async function GET(_req: Request, ctx: Ctx) {
  const { userId, response } = await requireSession();
  if (!userId) return response!;
  const { id } = await ctx.params;

  const page = await prisma.notePage.findFirst({
    where: { id, userId },
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
  if (!page) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(page);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { userId, response } = await requireSession();
  if (!userId) return response!;
  const { id } = await ctx.params;

  const existing = await prisma.notePage.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = updateNotePageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      await prisma.notePage.findFirstOrThrow({
        where: { id, userId },
        select: {
          id: true,
          title: true,
          body: true,
          parentId: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    );
  }

  if (data.parentId !== undefined) {
    const newParentId = data.parentId;
    if (newParentId) {
      const parent = await prisma.notePage.findFirst({ where: { id: newParentId, userId } });
      if (!parent) {
        return NextResponse.json({ error: "La página padre no existe" }, { status: 400 });
      }
    }
    const cyclic = await wouldCreateCycle(userId, id, newParentId);
    if (cyclic) {
      return NextResponse.json({ error: "No se puede mover una página dentro de sí misma" }, { status: 400 });
    }
  }

  const updated = await prisma.notePage.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.body !== undefined ? { body: sanitizeNoteHtml(data.body) } : {}),
      ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
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

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { userId, response } = await requireSession();
  if (!userId) return response!;
  const { id } = await ctx.params;

  const existing = await prisma.notePage.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const allPages = await prisma.notePage.findMany({
    where: { userId },
    select: { id: true, parentId: true },
  });
  const subtreeIds = collectNotePageSubtreeIds(allPages, id);
  const mediaRows = await prisma.noteMedia.findMany({
    where: { notePageId: { in: subtreeIds } },
    select: { id: true },
  });
  for (const m of mediaRows) {
    await deleteNoteMediaFile(userId, m.id);
  }

  await prisma.notePage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
