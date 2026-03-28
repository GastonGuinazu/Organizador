import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import {
  NOTE_MEDIA_ALLOWED_MIMES,
  NOTE_MEDIA_MAX_BYTES,
  noteMediaKindFromMime,
  noteMediaPublicPath,
  writeNoteMediaFile,
} from "@/lib/note-media-storage";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { userId, response } = await requireSession();
  if (!userId) return response!;
  const { id: notePageId } = await ctx.params;

  const page = await prisma.notePage.findFirst({ where: { id: notePageId, userId } });
  if (!page) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formulario inválido" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }

  if (file.size > NOTE_MEDIA_MAX_BYTES) {
    return NextResponse.json(
      { error: `El archivo supera el máximo de ${Math.round(NOTE_MEDIA_MAX_BYTES / (1024 * 1024))} MB` },
      { status: 400 },
    );
  }

  const mime = (file.type || "").trim() || "application/octet-stream";
  if (!NOTE_MEDIA_ALLOWED_MIMES.has(mime)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
  }

  const kind = noteMediaKindFromMime(mime);
  if (!kind) {
    return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const media = await prisma.noteMedia.create({
    data: {
      userId,
      notePageId,
      mimeType: mime,
      sizeBytes: buffer.length,
    },
  });

  try {
    await writeNoteMediaFile(userId, media.id, buffer);
  } catch (e) {
    await prisma.noteMedia.delete({ where: { id: media.id } }).catch(() => {});
    throw e;
  }

  return NextResponse.json({
    id: media.id,
    url: noteMediaPublicPath(media.id),
    kind,
  });
}
