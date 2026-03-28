/**
 * Indica si `src` de una imagen apunta a un medio de nota de esta app.
 * Acepta ruta relativa `/api/note-media/:id` o URL absoluta del mismo origen (ignora ?query y #hash).
 */
export function isNoteMediaImageSrc(src: string): boolean {
  const raw = src.trim();
  if (!raw) return false;
  let pathname: string;
  try {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      if (typeof window === "undefined") return false;
      const u = new URL(raw);
      if (u.origin !== window.location.origin) return false;
      pathname = u.pathname;
    } else {
      pathname = new URL(raw, "https://placeholder.invalid").pathname;
    }
  } catch {
    return false;
  }
  const m = pathname.match(/^\/api\/note-media\/([^/]+)$/i);
  if (!m) return false;
  return /^[a-z0-9]+$/i.test(m[1]);
}
