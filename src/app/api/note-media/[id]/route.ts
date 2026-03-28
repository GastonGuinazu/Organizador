import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getNoteMediaDiskPath } from "@/lib/note-media-storage";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { userId, response } = await requireSession();
  if (!userId) return response!;
  const { id } = await ctx.params;

  const row = await prisma.noteMedia.findFirst({ where: { id, userId } });
  if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  try {
    const buf = await readFile(getNoteMediaDiskPath(userId, id));
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": row.mimeType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "ENOENT") {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
    }
    throw e;
  }
}
