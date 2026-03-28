"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Row = { id: string; title: string; done: boolean };

type Props = {
  itemId: string;
  items: Row[];
};

export function ItemCardChecklist({ itemId, items: initialItems }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Row[]>(initialItems);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const snapshot = JSON.stringify(
    initialItems.map((i) => ({ id: i.id, title: i.title, done: i.done })),
  );
  useEffect(() => {
    setItems(JSON.parse(snapshot) as Row[]);
  }, [snapshot]);

  const done = items.filter((c) => c.done).length;
  const total = items.length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  async function toggleRow(checklistItemId: string, next: boolean) {
    const prev = items;
    setItems((rows) => rows.map((r) => (r.id === checklistItemId ? { ...r, done: next } : r)));
    setLoadingId(checklistItemId);
    try {
      const res = await fetch(`/api/items/${itemId}/checklist/${checklistItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: next }),
      });
      if (!res.ok) {
        setItems(prev);
        return;
      }
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={open ? "Ocultar tareas" : "Ver tareas"}
        className="flex w-full min-h-11 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/80"
        aria-expanded={open}
        aria-controls={`checklist-${itemId}`}
      >
        <div
          className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Tareas: ${done} de ${total} hechas`}
        >
          <div
            className="h-full rounded-full bg-teal-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="shrink-0 tabular-nums text-slate-600 dark:text-slate-300">
          {done}/{total}
        </span>
        <span className="shrink-0 text-slate-400 dark:text-slate-500" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open ? (
        <ul
          id={`checklist-${itemId}`}
          className="space-y-1 border-t border-slate-200 px-2 py-2 dark:border-slate-700"
          role="list"
        >
          {items.map((c) => (
            <li key={c.id}>
              <label className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-0.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60">
                <input
                  type="checkbox"
                  checked={c.done}
                  disabled={loadingId === c.id}
                  onChange={(e) => toggleRow(c.id, e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-slate-600"
                  aria-label={c.done ? `Marcar como pendiente: ${c.title}` : `Marcar como hecha: ${c.title}`}
                />
                <span className={c.done ? "text-slate-400 line-through dark:text-slate-500" : ""}>
                  {c.title}
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
