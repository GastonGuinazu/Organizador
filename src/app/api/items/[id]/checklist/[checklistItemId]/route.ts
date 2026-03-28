import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

type Ctx = { params: Promise<{ id: string; checklistItemId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { userId, response } = await requireSession();
  if (!userId) return response!;

  const { id, checklistItemId } = await ctx.params;

  const item = await prisma.item.findFirst({ where: { id, userId } });
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const row = await prisma.checklistItem.findFirst({
    where: { id: checklistItemId, itemId: id },
  });
  if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const done = (body as { done?: unknown }).done;
  if (typeof done !== "boolean") {
    return NextResponse.json({ error: "Se requiere done (boolean)" }, { status: 400 });
  }

  await prisma.checklistItem.update({
    where: { id: checklistItemId },
    data: { done },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/items/${id}`);

  return NextResponse.json({ ok: true, done });
}
