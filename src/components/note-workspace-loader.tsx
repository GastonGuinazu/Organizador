"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { NoteWorkspace } from "@/components/note-workspace";
import { OfflineBanner } from "@/components/offline-banner";
import type { NotePageTreeNode } from "@/lib/note-pages";
import { flattenNoteTreeToRows, type NotePageTreeRow } from "@/lib/note-pages";
import { buildNoteBreadcrumbs } from "@/lib/note-breadcrumbs";
import {
  readNotePageCache,
  readNoteTreeCache,
  writeNotePageCache,
  writeNoteTreeCache,
} from "@/lib/offline-db";

type PageData = {
  id: string;
  title: string;
  body: string;
  parentId: string | null;
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; tree: NotePageTreeNode[]; page: PageData; breadcrumbs: { id: string; title: string }[]; stale: boolean }
  | { status: "notfound" };

export function NoteWorkspaceLoader({ pageId }: { pageId: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });

    let tree: NotePageTreeNode[] | null = await readNoteTreeCache();
    const cachedPage = await readNotePageCache(pageId);
    let page: PageData | null =
      cachedPage && cachedPage.id === pageId
        ? {
            id: cachedPage.id,
            title: cachedPage.title,
            body: cachedPage.body,
            parentId: cachedPage.parentId,
          }
        : null;

    let rows: NotePageTreeRow[] | null = tree ? flattenNoteTreeToRows(tree) : null;
    let listOk = false;
    let pageOk = false;

    try {
      const [listRes, pageRes] = await Promise.all([
        fetch("/api/note-pages"),
        fetch(`/api/note-pages/${pageId}`),
      ]);

      if (listRes.ok) {
        const data = (await listRes.json()) as {
          tree: NotePageTreeNode[];
          rows?: NotePageTreeRow[];
        };
        if (Array.isArray(data.tree)) {
          tree = data.tree;
          await writeNoteTreeCache(data.tree);
          rows = data.rows ?? flattenNoteTreeToRows(data.tree);
          listOk = true;
        }
      }

      if (pageRes.ok) {
        const p = (await pageRes.json()) as PageData;
        page = {
          id: p.id,
          title: p.title,
          body: p.body,
          parentId: p.parentId,
        };
        await writeNotePageCache(page);
        pageOk = true;
      } else if (pageRes.status === 404) {
        if (!page) {
          setState({ status: "notfound" });
          return;
        }
      }
    } catch {
      /* usar caché si existe */
    }

    if (!tree || !page || !rows) {
      setState({ status: "notfound" });
      return;
    }

    const stale = !listOk || !pageOk;

    const breadcrumbs = buildNoteBreadcrumbs(rows, pageId);
    setState({ status: "ready", tree, page, breadcrumbs, stale });
  }, [pageId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "loading") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-300">Cargando nota…</p>
      </div>
    );
  }

  if (state.status === "notfound") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="text-slate-700 dark:text-slate-200">No se encontró esta nota.</p>
        <Link href="/dashboard/notes" className="mt-4 inline-block text-teal-700 underline dark:text-teal-300">
          Volver a notas
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <OfflineBanner />
      {state.stale ? (
        <p className="text-xs text-slate-500 dark:text-slate-400" role="status">
          Datos en caché de este dispositivo.
        </p>
      ) : null}
      <NoteWorkspace
        tree={state.tree}
        page={state.page}
        breadcrumbs={state.breadcrumbs}
      />
    </div>
  );
}


