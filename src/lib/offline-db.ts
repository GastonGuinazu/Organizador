import Dexie, { type Table } from "dexie";
import type { ItemPayloadPlain } from "@/lib/item-plain";
import type { NotePageTreeNode } from "@/lib/note-pages";

export type DashboardTagPlain = {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  createdAt: string;
};

export type DashboardCachePayload = {
  userTimezone: string;
  items: ItemPayloadPlain[];
  tags: DashboardTagPlain[];
  calendar: {
    undated: ItemPayloadPlain[];
    itemsByDateKey: Record<string, ItemPayloadPlain[]>;
  };
};

export type DashboardCacheRow = {
  key: string;
  updatedAt: number;
  payload: DashboardCachePayload;
};

export type NotePageCacheRow = {
  id: string;
  title: string;
  body: string;
  parentId: string | null;
  updatedAt: number;
};

export type NoteTreeCacheRow = {
  id: string;
  updatedAt: number;
  tree: NotePageTreeNode[];
};

class OrganizadorOfflineDB extends Dexie {
  dashboardByKey!: Table<DashboardCacheRow, string>;
  notePages!: Table<NotePageCacheRow, string>;
  noteTree!: Table<NoteTreeCacheRow, string>;

  constructor() {
    super("organizador-offline");
    this.version(1).stores({
      dashboardByKey: "key",
      notePages: "id",
      noteTree: "id",
    });
  }
}

let dbPromise: Promise<OrganizadorOfflineDB> | null = null;

export function getOfflineDb(): Promise<OrganizadorOfflineDB> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("indexedDB unavailable"));
  }
  if (!dbPromise) {
    dbPromise = Promise.resolve(new OrganizadorOfflineDB());
  }
  return dbPromise;
}

export function dashboardCacheKey(params: {
  filter: string;
  q?: string;
  tagId?: string;
  calYear: number;
  calMonth: number;
}): string {
  const q = params.q?.trim() ?? "";
  const tag = params.tagId ?? "";
  return `${params.filter}|${q}|${tag}|${params.calYear}|${params.calMonth}`;
}

export async function readDashboardCache(key: string): Promise<DashboardCachePayload | null> {
  try {
    const db = await getOfflineDb();
    const row = await db.dashboardByKey.get(key);
    return row?.payload ?? null;
  } catch {
    return null;
  }
}

export async function writeDashboardCache(key: string, payload: DashboardCachePayload): Promise<void> {
  try {
    const db = await getOfflineDb();
    await db.dashboardByKey.put({ key, updatedAt: Date.now(), payload });
  } catch {
    /* ignore */
  }
}

export async function readNoteTreeCache(): Promise<NotePageTreeNode[] | null> {
  try {
    const db = await getOfflineDb();
    const row = await db.noteTree.get("default");
    return row?.tree ?? null;
  } catch {
    return null;
  }
}

export async function writeNoteTreeCache(tree: NotePageTreeNode[]): Promise<void> {
  try {
    const db = await getOfflineDb();
    await db.noteTree.put({ id: "default", updatedAt: Date.now(), tree });
  } catch {
    /* ignore */
  }
}

export async function readNotePageCache(id: string): Promise<NotePageCacheRow | null> {
  try {
    const db = await getOfflineDb();
    return (await db.notePages.get(id)) ?? null;
  } catch {
    return null;
  }
}

export async function writeNotePageCache(row: Omit<NotePageCacheRow, "updatedAt">): Promise<void> {
  try {
    const db = await getOfflineDb();
    await db.notePages.put({ ...row, updatedAt: Date.now() });
  } catch {
    /* ignore */
  }
}
