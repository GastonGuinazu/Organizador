"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FilterTabs } from "@/components/filter-tabs";
import { DashboardSearchForm } from "@/components/dashboard-search-form";
import { ItemCard } from "@/components/item-card";
import {
  buildMonthGrid,
  dotColorForItems,
  nextMonth,
  prevMonth,
  sortItemsForDay,
  todayDateKeyInZone,
} from "@/lib/calendar-utils";
import { itemToPlain } from "@/lib/item-plain";
import type { DayPlainMeta } from "@/components/month-calendar-view";
import { MonthCalendarView } from "@/components/month-calendar-view";
import { buildDashboardHref } from "@/lib/dashboard-url";
import type { ItemPayload } from "@/lib/item-service";
import type { ItemPayloadPlain } from "@/lib/item-plain";
import type { DashboardCachePayload } from "@/lib/offline-db";
import {
  dashboardCacheKey,
  readDashboardCache,
  writeDashboardCache,
} from "@/lib/offline-db";
import { OfflineBanner } from "@/components/offline-banner";

const btnClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950";

function plainToItemPayload(p: ItemPayloadPlain): ItemPayload {
  return {
    ...p,
    dueAt: p.dueAt ? new Date(p.dueAt) : null,
    completedAt: p.completedAt ? new Date(p.completedAt) : null,
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
    reminders: p.reminders.map((r) => ({
      ...r,
      fireAt: r.fireAt ? new Date(r.fireAt) : null,
      sentAt: r.sentAt ? new Date(r.sentAt) : null,
      createdAt: new Date(r.createdAt),
    })),
    checklistItems: p.checklistItems.map((c) => ({ ...c })),
    itemTags: p.itemTags.map((it) => ({
      ...it,
      tag: {
        ...it.tag,
        createdAt: new Date(it.tag.createdAt),
      },
    })),
  };
}

type Props = {
  userTimezone: string;
  filter: string;
  q?: string;
  tagId?: string;
  calYear: number;
  calMonth: number;
};

export function DashboardClient({ userTimezone, filter, q, tagId, calYear, calMonth }: Props) {
  const cal = useMemo(() => ({ calYear, calMonth }), [calYear, calMonth]);
  const cacheKey = useMemo(
    () => dashboardCacheKey({ filter, q, tagId, calYear, calMonth }),
    [filter, q, tagId, calYear, calMonth],
  );

  const [payload, setPayload] = useState<DashboardCachePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const cached = await readDashboardCache(cacheKey);
    if (cached) {
      setPayload(cached);
      setFromCache(true);
    }

    const sp = new URLSearchParams();
    if (filter && filter !== "all") sp.set("filter", filter);
    if (q?.trim()) sp.set("q", q.trim());
    if (tagId) sp.set("tagId", tagId);
    sp.set("calYear", String(calYear));
    sp.set("calMonth", String(calMonth));

    try {
      const res = await fetch(`/api/dashboard-data?${sp.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as DashboardCachePayload;
        setPayload(data);
        setFromCache(false);
        await writeDashboardCache(cacheKey, data);
      } else if (!cached) {
        setPayload(null);
      }
    } catch {
      if (!cached) setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, filter, q, tagId, calYear, calMonth]);

  useEffect(() => {
    void load();
  }, [load]);

  const itemsPlain = payload?.items ?? [];
  const tagsForForm = useMemo(
    () =>
      (payload?.tags ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
      })),
    [payload?.tags],
  );

  const tz = payload?.userTimezone ?? userTimezone;
  const todayKey = todayDateKeyInZone(tz);
  const grid = buildMonthGrid(calYear, calMonth, tz, todayKey);

  const dayMeta: Record<string, DayPlainMeta> = {};
  const byDate = payload?.calendar.itemsByDateKey ?? {};
  for (const [dateKey, calItems] of Object.entries(byDate)) {
    const asPayload = calItems.map(plainToItemPayload);
    const sorted = sortItemsForDay(asPayload, tz);
    dayMeta[dateKey] = {
      dotColor: dotColorForItems(asPayload),
      count: sorted.length,
      titles: sorted.map((i) => i.title),
      items: sorted.map(itemToPlain),
    };
  }

  const undatedPlain = payload?.calendar.undated ?? [];
  const pm = prevMonth(calYear, calMonth);
  const nm = nextMonth(calYear, calMonth);
  const prevHref = buildDashboardHref(filter, q, tagId, { calYear: pm.year, calMonth: pm.month });
  const nextHref = buildDashboardHref(filter, q, tagId, { calYear: nm.year, calMonth: nm.month });
  const todayHref = buildDashboardHref(filter, q, tagId);

  const showEmpty = !loading && itemsPlain.length === 0;

  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
      <section className="min-w-0 lg:col-span-9">
        <OfflineBanner />
        {fromCache ? (
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400" role="status">
            Datos en caché de este dispositivo.
          </p>
        ) : null}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Tus actividades</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Recordatorios y listas en un solo lugar.
            </p>
          </div>
          <Link href="/dashboard/new" className={`${btnClass} w-full shrink-0 sm:w-auto`}>
            Nueva actividad
          </Link>
        </div>

        <DashboardSearchForm
          filter={filter}
          q={q}
          tagId={tagId}
          calYear={calYear}
          calMonth={calMonth}
          tags={tagsForForm}
        />
        <FilterTabs current={filter} q={q} tagId={tagId} cal={cal} />

        {loading && !payload ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-slate-600 dark:text-slate-300">Cargando actividades…</p>
          </div>
        ) : showEmpty ? (
          <div
            className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900"
            role="status"
          >
            <p className="text-slate-700 dark:text-slate-200">Aún no hay actividades en esta vista.</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Crea tu primera actividad para empezar a organizarte.
            </p>
            <Link href="/dashboard/new" className={`mt-6 inline-block ${btnClass}`}>
              Crear actividad
            </Link>
          </div>
        ) : (
          <div
            role="region"
            aria-label="Lista de actividades"
            className="min-h-0 max-h-[min(28rem,52svh)] overflow-y-auto overscroll-y-contain rounded-2xl border border-slate-200/70 pr-1 dark:border-slate-700/70 lg:max-h-none lg:overflow-visible lg:border-0 lg:pr-0"
          >
            <ul className="flex flex-col gap-4">
              {itemsPlain.map((item) => (
                <li key={item.id}>
                  <ItemCard item={plainToItemPayload(item)} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <aside className="min-w-0 lg:col-span-3">
        <div className="lg:sticky lg:top-8">
          <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">Calendario</p>
          <MonthCalendarView
            year={calYear}
            month={calMonth}
            grid={grid}
            dayMeta={dayMeta}
            undatedItems={undatedPlain}
            prevHref={prevHref}
            nextHref={nextHref}
            todayHref={todayHref}
            variant="embedded"
          />
        </div>
      </aside>
    </div>
  );
}
