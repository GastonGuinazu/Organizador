import { auth } from "@/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { listItemsForUser } from "@/lib/items-query";
import { FilterTabs } from "@/components/filter-tabs";
import { DashboardSearchForm } from "@/components/dashboard-search-form";
import { ItemCard } from "@/components/item-card";
import { fetchCalendarItems } from "@/lib/calendar-query";
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
import { DateTime } from "luxon";

const btnClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
    q?: string;
    tagId?: string;
    calYear?: string;
    calMonth?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const sp = await searchParams;
  const filter = sp.filter ?? "all";
  const q = sp.q;
  const tagId = sp.tagId;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });
  const userTimezone = user?.timezone && user.timezone.length > 0 ? user.timezone : "UTC";

  const now = DateTime.now().setZone(userTimezone);
  const calYearRaw = sp.calYear ? parseInt(sp.calYear, 10) : now.year;
  const calMonthRaw = sp.calMonth ? parseInt(sp.calMonth, 10) : now.month;
  const calYear = Number.isFinite(calYearRaw) ? calYearRaw : now.year;
  const calMonth =
    Number.isFinite(calMonthRaw) && calMonthRaw >= 1 && calMonthRaw <= 12 ? calMonthRaw : now.month;

  const cal = { calYear, calMonth };

  const [items, tags, { undated, itemsByDateKey }] = await Promise.all([
    listItemsForUser(session.user.id, filter, { q, tagId }),
    prisma.tag.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    }),
    fetchCalendarItems(session.user.id, calYear, calMonth, userTimezone),
  ]);

  const todayKey = todayDateKeyInZone(userTimezone);
  const grid = buildMonthGrid(calYear, calMonth, userTimezone, todayKey);

  const dayMeta: Record<string, DayPlainMeta> = {};
  for (const [dateKey, calItems] of Object.entries(itemsByDateKey)) {
    const sorted = sortItemsForDay(calItems, userTimezone);
    dayMeta[dateKey] = {
      dotColor: dotColorForItems(calItems),
      count: sorted.length,
      titles: sorted.map((i) => i.title),
      items: sorted.map(itemToPlain),
    };
  }

  const pm = prevMonth(calYear, calMonth);
  const nm = nextMonth(calYear, calMonth);
  const prevHref = buildDashboardHref(filter, q, tagId, { calYear: pm.year, calMonth: pm.month });
  const nextHref = buildDashboardHref(filter, q, tagId, { calYear: nm.year, calMonth: nm.month });
  const todayHref = buildDashboardHref(filter, q, tagId);

  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
      <section className="min-w-0 lg:col-span-9">
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
          tags={tags}
        />
        <FilterTabs current={filter} q={q} tagId={tagId} cal={cal} />

        {items.length === 0 ? (
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
              {items.map((item) => (
                <li key={item.id}>
                  <ItemCard item={item} />
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
            undatedItems={undated.map(itemToPlain)}
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
