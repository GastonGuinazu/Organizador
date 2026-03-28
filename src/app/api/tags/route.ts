import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { createTagSchema } from "@/lib/validators";

export async function GET() {
  const { userId, response } = await requireSession();
  if (!userId) return response!;

  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(tags);
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

  const parsed = createTagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const name = parsed.data.name.trim();
  try {
    const tag = await prisma.tag.create({
      data: {
        userId,
        name,
        color: parsed.data.color ?? null,
      },
    });
    return NextResponse.json(tag, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ya existe una etiqueta con ese nombre" }, { status: 409 });
  }
}
