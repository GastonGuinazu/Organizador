"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type NotificationRow = {
  id: string;
  itemId: string;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
};

type Props = { initialItems: NotificationRow[] };

export function NotificationsList({ initialItems }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);

  async function markAll() {
    setBusy(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        const now = new Date().toISOString();
        setItems((prev) => prev.map((i) => ({ ...i, readAt: now })));
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function markOne(id: string) {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, readAt: new Date().toISOString() } : i)),
      );
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Los avisos aparecen cuando se procesa un recordatorio (correo y/o push, según tu configuración).
        </p>
        {items.some((i) => !i.readAt) ? (
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void markAll()}>
            Marcar todas como leídas
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-600 dark:text-slate-300">
          Todavía no hay avisos. Cuando llegue un recordatorio, lo verás aquí.
        </Card>
      ) : (
        <ul className="space-y-3" aria-label="Lista de avisos">
          {items.map((n) => (
            <li key={n.id}>
              <Card
                className={`p-4 ${n.readAt ? "opacity-80" : "border-teal-200 dark:border-teal-900"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-50">{n.title}</p>
                    {n.body ? (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{n.body}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(n.createdAt).toLocaleString("es")}
                    </p>
                    <Link
                      href={`/dashboard/items/${n.itemId}`}
                      className="mt-2 inline-block text-sm font-medium text-teal-700 underline dark:text-teal-400"
                    >
                      Ver actividad
                    </Link>
                  </div>
                  {!n.readAt ? (
                    <Button type="button" variant="ghost" onClick={() => void markOne(n.id)}>
                      Marcar leída
                    </Button>
                  ) : null}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
