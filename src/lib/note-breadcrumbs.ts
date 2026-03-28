import type { NotePageTreeRow } from "@/lib/note-pages";

export function buildNoteBreadcrumbs(rows: NotePageTreeRow[], leafId: string) {
  const byId = new Map(rows.map((p) => [p.id, p]));
  const chain: { id: string; title: string }[] = [];
  let cur: string | null = leafId;
  while (cur) {
    const p = byId.get(cur);
    if (!p) break;
    chain.unshift({ id: p.id, title: p.title });
    cur = p.parentId;
  }
  return chain;
}
