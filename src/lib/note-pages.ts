export type NotePageTreeRow = {
  id: string;
  parentId: string | null;
  title: string;
  sortOrder: number;
};

export type NotePageTreeNode = {
  id: string;
  title: string;
  sortOrder: number;
  children: NotePageTreeNode[];
};

/** Todas las páginas del subárbol con raíz `rootId` (incluye la raíz). */
export function collectNotePageSubtreeIds(
  rows: { id: string; parentId: string | null }[],
  rootId: string,
): string[] {
  const children = new Map<string, string[]>();
  for (const r of rows) {
    if (!r.parentId) continue;
    const arr = children.get(r.parentId) ?? [];
    arr.push(r.id);
    children.set(r.parentId, arr);
  }
  const out: string[] = [];
  const walk = (pid: string) => {
    out.push(pid);
    for (const c of children.get(pid) ?? []) walk(c);
  };
  walk(rootId);
  return out;
}

export function buildNotePageTree(rows: NotePageTreeRow[]): NotePageTreeNode[] {
  const byParent = new Map<string | null, NotePageTreeRow[]>();
  for (const r of rows) {
    const key = r.parentId ?? null;
    const list = byParent.get(key);
    if (list) list.push(r);
    else byParent.set(key, [r]);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  }
  function walk(parentKey: string | null): NotePageTreeNode[] {
    const list = byParent.get(parentKey) ?? [];
    return list.map((r) => ({
      id: r.id,
      title: r.title,
      sortOrder: r.sortOrder,
      children: walk(r.id),
    }));
  }
  return walk(null);
}
