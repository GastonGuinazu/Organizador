import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

export { NOTE_MEDIA_MAX_BYTES } from "./note-media-constants";

const ALLOWED = new Map<string, readonly string[]>([
  ["image", ["image/jpeg", "image/png", "image/gif", "image/webp"]],
  ["audio", ["audio/mpeg", "audio/webm", "audio/wav", "audio/ogg", "audio/mp4"]],
  ["video", ["video/mp4", "video/webm", "video/quicktime"]],
]);

export const NOTE_MEDIA_ALLOWED_MIMES = new Set(
  [...ALLOWED.values()].flat() as string[],
);

export type NoteMediaKind = "image" | "audio" | "video";

export function noteMediaKindFromMime(mime: string): NoteMediaKind | null {
  for (const [kind, list] of ALLOWED) {
    if ((list as readonly string[]).includes(mime)) return kind as NoteMediaKind;
  }
  return null;
}

export function getNoteUploadRoot(): string {
  const override = process.env.NOTE_UPLOAD_DIR?.trim();
  return path.join(process.cwd(), override && override.length > 0 ? override : "data", "note-uploads");
}

export function getNoteMediaDiskPath(userId: string, mediaId: string): string {
  return path.join(getNoteUploadRoot(), userId, mediaId);
}

export async function writeNoteMediaFile(userId: string, mediaId: string, buffer: Buffer): Promise<void> {
  const dir = path.join(getNoteUploadRoot(), userId);
  await mkdir(dir, { recursive: true });
  await writeFile(getNoteMediaDiskPath(userId, mediaId), buffer);
}

export async function deleteNoteMediaFile(userId: string, mediaId: string): Promise<void> {
  try {
    await unlink(getNoteMediaDiskPath(userId, mediaId));
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code !== "ENOENT") throw e;
  }
}

/** Ruta pública relativa de la app para el HTML guardado. */
export function noteMediaPublicPath(mediaId: string): string {
  return `/api/note-media/${mediaId}`;
}
