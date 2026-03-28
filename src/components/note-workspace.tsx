"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { NotePageTreeNode } from "@/lib/note-pages";
import { collectNoteTreeIds, NoteTree } from "@/components/note-tree";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NOTE_HTML_TEMPLATES } from "@/lib/note-templates";

const NoteRichEditor = dynamic(
  () => import("@/components/note-rich-editor").then((m) => ({ default: m.NoteRichEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[320px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        Cargando editor…
      </div>
    ),
  },
);

type PageData = {
  id: string;
  title: string;
  body: string;
  parentId: string | null;
};

type Props = {
  tree: NotePageTreeNode[];
  page: PageData;
  breadcrumbs: { id: string; title: string }[];
};

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function NoteWorkspace({ tree: initialTree, page: initialPage, breadcrumbs: initialBreadcrumbs }: Props) {
  const router = useRouter();
  const [tree, setTree] = useState(initialTree);
  const [title, setTitle] = useState(initialPage.title);
  const [body, setBody] = useState(initialPage.body);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set(collectNoteTreeIds(initialTree)));
  const [readOnly, setReadOnly] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [linkItems, setLinkItems] = useState<{ id: string; title: string }[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; title: string }[]>([]);
  const [pendingInsert, setPendingInsert] = useState<{ nonce: number; html: string } | null>(null);

  const skipSave = useRef(true);
  const pageId = initialPage.id;

  const consumePendingInsert = useCallback(() => setPendingInsert(null), []);

  useEffect(() => {
    let alive = true;
    fetch("/api/items?filter=all")
      .then((r) => r.json())
      .then((items: unknown) => {
        if (!alive || !Array.isArray(items)) return;
        setLinkItems(
          items
            .filter((x): x is { id: string; title: string } => typeof x === "object" && x !== null && "id" in x)
            .map((x) => ({ id: String(x.id), title: String(x.title ?? "") })),
        );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const q = searchQ.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/note-pages?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d: { matches?: { id: string; title: string }[] }) => {
          setSearchResults(Array.isArray(d.matches) ? d.matches : []);
        })
        .catch(() => setSearchResults([]));
    }, 320);
    return () => clearTimeout(t);
  }, [searchQ]);

  useEffect(() => {
    setTree(initialTree);
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const id of collectNoteTreeIds(initialTree)) next.add(id);
      return next;
    });
  }, [initialTree]);

  useEffect(() => {
    setTitle(initialPage.title);
    setBody(initialPage.body);
    setMediaError(null);
    skipSave.current = true;
  }, [initialPage.id, initialPage.title, initialPage.body]);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    if (readOnly) return;
    const t = setTimeout(async () => {
      setSaving(true);
      setSaveError(null);
      try {
        const res = await fetch(`/api/note-pages/${pageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim() || "Sin título", body }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          setSaveError(data.error ?? "No se pudo guardar");
        }
      } catch {
        setSaveError("No se pudo guardar");
      } finally {
        setSaving(false);
      }
    }, 650);
    return () => clearTimeout(t);
  }, [title, body, pageId, readOnly]);

  async function createChild() {
    const res = await fetch("/api/note-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Sin título", parentId: pageId }),
    });
    if (!res.ok) return;
    const created = (await res.json()) as { id: string };
    setSidebarOpen(false);
    router.push(`/dashboard/notes/${created.id}`);
    router.refresh();
  }

  async function createRoot() {
    const res = await fetch("/api/note-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Sin título" }),
    });
    if (!res.ok) return;
    const created = (await res.json()) as { id: string };
    setSidebarOpen(false);
    router.push(`/dashboard/notes/${created.id}`);
    router.refresh();
  }

  async function removePage() {
    if (
      !window.confirm(
        "¿Eliminar esta nota y todo lo que tiene dentro? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }
    const res = await fetch(`/api/note-pages/${pageId}`, { method: "DELETE" });
    if (!res.ok) return;
    const parentId = initialPage.parentId;
    if (parentId) {
      router.push(`/dashboard/notes/${parentId}`);
    } else {
      const tr = await fetch("/api/note-pages");
      const data = tr.ok ? ((await tr.json()) as { tree: NotePageTreeNode[] }) : { tree: [] };
      const first = data.tree[0];
      if (first) router.push(`/dashboard/notes/${first.id}`);
      else router.push("/dashboard/notes");
    }
    router.refresh();
  }

  function exportNoteHtml() {
    const safeTitle = (title.trim() || "nota").replace(/[/\\?%*:|"<>]/g, "-").slice(0, 80);
    const doc = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><title>${escapeXml(title.trim() || "Nota")}</title></head><body>${body}</body></html>`;
    const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${safeTitle}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const searchBlock = (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-slate-600 dark:text-slate-300" htmlFor="note-sidebar-search">
        Buscar en notas
      </label>
      <input
        id="note-sidebar-search"
        type="search"
        value={searchQ}
        onChange={(e) => setSearchQ(e.target.value)}
        placeholder="Título o contenido…"
        className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
        autoComplete="off"
      />
      {searchResults.length > 0 ? (
        <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto text-sm">
          {searchResults.map((m) => (
            <li key={m.id}>
              <Link
                href={`/dashboard/notes/${m.id}`}
                className="block truncate rounded-md px-2 py-1.5 text-teal-800 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-950/40"
                onClick={() => setSidebarOpen(false)}
              >
                {m.title.trim() || "Sin título"}
              </Link>
            </li>
          ))}
        </ul>
      ) : searchQ.trim() ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">Sin coincidencias.</p>
      ) : null}
    </div>
  );

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {searchBlock}
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button type="button" variant="secondary" className="min-h-11 text-xs sm:text-sm" onClick={createRoot}>
          Nueva principal
        </Button>
        <Button type="button" variant="secondary" className="min-h-11 text-xs sm:text-sm" onClick={createChild}>
          Nueva subpágina
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {tree.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No hay notas todavía.</p>
        ) : (
          <NoteTree nodes={tree} currentId={pageId} depth={0} expanded={expanded} toggle={toggle} />
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Tus notas</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Organizá resúmenes, materias y lo que necesites; todo en páginas anidadas.
        </p>
      </div>

      <div className="flex items-center gap-2 lg:hidden">
        <Button
          type="button"
          variant="secondary"
          className="min-h-11"
          onClick={() => setSidebarOpen(true)}
          aria-expanded={sidebarOpen}
        >
          Ver árbol
        </Button>
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Árbol de notas">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-[min(100%,20rem)] flex-col border-r border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Tus páginas</span>
              <Button type="button" variant="ghost" className="min-h-11 min-w-11 px-2" onClick={() => setSidebarOpen(false)}>
                Cerrar
              </Button>
            </div>
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="hidden w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:block lg:w-72">
          {sidebar}
        </aside>

        <Card className="min-h-[320px] flex-1 p-4 sm:p-6">
          <nav aria-label="Migas" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
            <Link href="/dashboard/notes" className="hover:text-teal-700 dark:hover:text-teal-400">
              Notas
            </Link>
            {initialBreadcrumbs.map((crumb, i) => (
              <span key={crumb.id} className="flex items-center gap-1">
                <span aria-hidden className="text-slate-400">
                  /
                </span>
                {i === initialBreadcrumbs.length - 1 ? (
                  <span className="font-medium text-slate-900 dark:text-slate-100">{crumb.title || "Sin título"}</span>
                ) : (
                  <Link href={`/dashboard/notes/${crumb.id}`} className="hover:text-teal-700 dark:hover:text-teal-400">
                    {crumb.title || "Sin título"}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="note-title" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Título
              </label>
              <input
                id="note-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                readOnly={readOnly}
                className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-lg font-semibold text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 read-only:opacity-80 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={readOnly ? "secondary" : "primary"}
                className="min-h-11"
                onClick={() => setReadOnly((r) => !r)}
              >
                {readOnly ? "Editar" : "Solo lectura"}
              </Button>
              <Button type="button" variant="secondary" className="min-h-11" onClick={exportNoteHtml}>
                Exportar HTML
              </Button>
              <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800">
                <span className="text-slate-600 dark:text-slate-300">Plantilla</span>
                <select
                  aria-label="Insertar plantilla en el contenido"
                  className="max-w-[10rem] rounded-md border-0 bg-transparent py-1 text-slate-900 focus:ring-0 dark:text-slate-100"
                  defaultValue=""
                  disabled={readOnly}
                  onChange={(e) => {
                    const id = e.target.value;
                    e.target.selectedIndex = 0;
                    const tpl = NOTE_HTML_TEMPLATES.find((x) => x.id === id);
                    if (tpl) setPendingInsert((p) => ({ nonce: (p?.nonce ?? 0) + 1, html: tpl.html }));
                  }}
                >
                  <option value="" disabled>
                    Elegir…
                  </option>
                  {NOTE_HTML_TEMPLATES.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <span id="note-body-label" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Contenido
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Podés insertar imagen, foto con la cámara, audio y video en el lugar del texto. Las notas en texto plano
                siguen mostrándose igual; al editarlas pasan a formato enriquecido.
              </p>
              <div aria-labelledby="note-body-label">
                <NoteRichEditor
                  key={pageId}
                  initialHtml={initialPage.body}
                  onHtmlChange={setBody}
                  notePageId={pageId}
                  onUploadError={(m) => setMediaError(m)}
                  linkItems={linkItems}
                  readOnly={readOnly}
                  pendingInsert={pendingInsert}
                  onConsumePendingInsert={consumePendingInsert}
                />
              </div>
              {mediaError ? <p className="text-sm text-red-600 dark:text-red-400">{mediaError}</p> : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="danger" className="min-h-11" onClick={removePage}>
                Eliminar esta nota
              </Button>
              {readOnly ? (
                <span className="text-sm text-slate-500 dark:text-slate-400">Modo solo lectura: no se guardan cambios.</span>
              ) : saving ? (
                <span className="text-sm text-slate-500 dark:text-slate-400">Guardando…</span>
              ) : (
                <span className="text-sm text-slate-500 dark:text-slate-400">Los cambios se guardan solos</span>
              )}
            </div>
            {saveError ? <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
