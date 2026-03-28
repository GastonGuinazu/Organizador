"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type NotifPreview = { id: string; itemId: string; title: string; readAt: string | null };

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotifPreview[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=6");
      if (!res.ok) return;
      const data = (await res.json()) as { items: NotifPreview[]; unreadCount: number };
      setItems(data.items ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <Button
        type="button"
        variant="ghost"
        className="relative min-h-11 min-w-11 gap-0 px-0"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={open ? "Cerrar avisos" : "Abrir avisos"}
        onClick={() => {
          setOpen((o) => !o);
          void load();
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-slate-700 dark:text-slate-200"
          aria-hidden
        >
          <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,20rem)] rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-900"
          role="menu"
        >
          <p className="px-3 pb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Recientes</p>
          {items.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-600 dark:text-slate-300">No hay avisos todavía.</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={`/dashboard/items/${n.itemId}`}
                    className={`block px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${
                      n.readAt ? "text-slate-600 dark:text-slate-300" : "font-medium text-slate-900 dark:text-slate-50"
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {n.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-slate-200 px-2 pt-2 dark:border-slate-700">
            <Link
              href="/dashboard/notifications"
              className="block rounded-lg px-2 py-2 text-center text-sm font-medium text-teal-700 hover:bg-slate-100 dark:text-teal-400 dark:hover:bg-slate-800"
              onClick={() => setOpen(false)}
            >
              Ver todos
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
