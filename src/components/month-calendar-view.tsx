"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CalendarCell } from "@/lib/calendar-utils";
import type { ItemPayloadPlain } from "@/lib/item-plain";
import { ItemSnoozeButtons } from "@/components/item-snooze-buttons";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
/** Cabecera compacta (L … D); X = miércoles, convención habitual en ES. */
const WEEKDAYS_COMPACT = ["L", "M", "X", "J", "V", "S", "D"];

/** Ancho del tooltip de día (equiv. Tailwind w-56); se usa para clamp horizontal en viewport. */
const DAY_HOVER_TOOLTIP_W_PX = 224;
const DAY_HOVER_TOOLTIP_PAD = 8;

export type DayPlainMeta = {
  dotColor: string;
  count: number;
  titles: string[];
  items: ItemPayloadPlain[];
};

type Props = {
  year: number;
  month: number;
  grid: CalendarCell[];
  dayMeta: Record<string, DayPlainMeta>;
  undatedItems: ItemPayloadPlain[];
  prevHref: string;
  nextHref: string;
  todayHref: string;
  /** `embedded`: más compacto para columna junto a la lista. */
  variant?: "page" | "embedded";
  /** Columna estrecha (~1/4 pantalla): celdas y controles aún más chicos. */
  dense?: boolean;
};

function formatItemTime(item: ItemPayloadPlain) {
  if (item.allDay) return "Todo el día";
  if (!item.dueAt) return "—";
  const tz = item.timezone || "UTC";
  return new Intl.DateTimeFormat("es", {
    timeStyle: "short",
    timeZone: tz,
  }).format(new Date(item.dueAt));
}

export function MonthCalendarView({
  year,
  month,
  grid,
  dayMeta,
  undatedItems,
  prevHref,
  nextHref,
  todayHref,
  variant = "page",
  dense = false,
}: Props) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [hoverTip, setHoverTip] = useState<{
    dateKey: string;
    left: number;
    top: number;
  } | null>(null);
  const embedded = variant === "embedded";
  const tight = embedded && dense;

  const title = useMemo(() => {
    return new Intl.DateTimeFormat("es", { month: "long", year: "numeric" }).format(
      new Date(year, month - 1, 1),
    );
  }, [year, month]);

  const openMeta = openKey ? dayMeta[openKey] : null;

  const cellMin = tight ? "min-h-[2.25rem]" : embedded ? "min-h-[2.75rem]" : "min-h-[4.5rem]";
  const dayNumClass = tight
    ? "text-[10px] font-semibold leading-tight text-slate-900 dark:text-slate-50"
    : embedded
      ? "text-xs font-semibold text-slate-900 dark:text-slate-50"
      : "text-sm font-semibold text-slate-900 dark:text-slate-50";
  const dotClass = tight ? "h-1.5 w-1.5" : embedded ? "h-2 w-2" : "h-2.5 w-2.5";
  const plusClass = tight ? "text-[9px] leading-none" : embedded ? "text-[10px]" : "text-xs";

  return (
    <div className={tight ? "space-y-2" : embedded ? "space-y-3" : "space-y-6"}>
      <div
        className={
          tight
            ? "flex flex-col gap-1.5"
            : embedded
              ? "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              : "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        }
      >
        {embedded ? (
          <h2
            className={
              tight
                ? "line-clamp-2 text-xs font-semibold capitalize leading-tight text-slate-900 dark:text-slate-50"
                : "text-base font-semibold capitalize text-slate-900 dark:text-slate-50"
            }
          >
            {title}
          </h2>
        ) : (
          <h1 className="text-2xl font-bold capitalize text-slate-900 dark:text-slate-50">{title}</h1>
        )}
        <div
          className={
            tight
              ? "grid grid-cols-3 gap-1"
              : embedded
                ? "grid w-full grid-cols-3 gap-1.5"
                : "flex flex-nowrap items-center gap-2"
          }
        >
          <Link href={prevHref} scroll={false} className={tight || embedded ? "min-w-0" : "shrink-0"}>
            <Button
              type="button"
              variant="secondary"
              className={
                tight
                  ? "h-8 w-full px-1 text-[10px] leading-tight"
                  : embedded
                    ? "h-9 w-full min-w-0 px-1.5 text-xs sm:px-2.5"
                    : ""
              }
            >
              {embedded ? "‹ Ant" : "Mes anterior"}
            </Button>
          </Link>
          <Link href={nextHref} scroll={false} className={tight || embedded ? "min-w-0" : "shrink-0"}>
            <Button
              type="button"
              variant="secondary"
              className={
                tight
                  ? "h-8 w-full px-1 text-[10px] leading-tight"
                  : embedded
                    ? "h-9 w-full min-w-0 px-1.5 text-xs sm:px-2.5"
                    : ""
              }
            >
              {embedded ? "Sig ›" : "Mes siguiente"}
            </Button>
          </Link>
          <Link href={todayHref} scroll={false} className={tight || embedded ? "min-w-0" : "shrink-0"}>
            <Button
              type="button"
              variant="primary"
              className={
                tight
                  ? "h-8 w-full px-1 text-[10px] leading-tight"
                  : embedded
                    ? "h-9 w-full min-w-0 px-2 text-xs sm:px-3"
                    : ""
              }
            >
              Hoy
            </Button>
          </Link>
        </div>
      </div>

      {undatedItems.length > 0 ? (
        <Card
          className={
            tight
              ? "border-amber-200 bg-amber-50/60 p-2 dark:border-amber-900/50 dark:bg-amber-950/30"
              : embedded
                ? "border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/50 dark:bg-amber-950/30"
                : "border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/30"
          }
        >
          <h3
            className={
              tight
                ? "text-[11px] font-semibold text-slate-900 dark:text-slate-50"
                : embedded
                  ? "text-sm font-semibold text-slate-900 dark:text-slate-50"
                  : "text-lg font-semibold text-slate-900 dark:text-slate-50"
            }
          >
            Sin fecha ({undatedItems.length})
          </h3>
          {!embedded ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Actividades pendientes que aún no tienen día en el calendario.
            </p>
          ) : null}
          <ul
            className={
              tight
                ? "mt-1 max-h-16 space-y-0.5 overflow-y-auto"
                : embedded
                  ? "mt-2 max-h-24 space-y-1 overflow-y-auto"
                  : "mt-3 flex flex-col gap-2"
            }
          >
            {undatedItems.map((it) => (
              <li key={it.id}>
                <Link
                  href={`/dashboard/items/${it.id}`}
                  className={
                    tight
                      ? "block truncate text-[10px] font-medium text-teal-800 underline dark:text-teal-300"
                      : embedded
                        ? "block truncate text-xs font-medium text-teal-800 underline dark:text-teal-300"
                        : "text-sm font-medium text-teal-800 underline dark:text-teal-300"
                  }
                >
                  {it.title}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard?filter=noDate"
            className={
              tight
                ? "mt-1 inline-block text-[10px] font-medium text-slate-700 underline dark:text-slate-200"
                : embedded
                  ? "mt-2 inline-block text-xs font-medium text-slate-700 underline dark:text-slate-200"
                  : "mt-3 inline-block text-sm font-medium text-slate-700 underline dark:text-slate-200"
            }
          >
            Ver en la lista
          </Link>
        </Card>
      ) : null}

      <div
        className={
          tight
            ? "overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
            : embedded
              ? "overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900"
              : "overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900"
        }
      >
        <div
          className={
            tight
              ? "mb-0.5 grid grid-cols-7 gap-px rounded-md bg-slate-100 p-0.5 text-center text-[9px] font-medium leading-none text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              : embedded
                ? "mb-1 grid grid-cols-7 gap-0.5 rounded-lg bg-slate-100 p-1 text-center text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                : "mb-1.5 grid grid-cols-7 gap-1 rounded-xl bg-slate-100 p-1.5 text-center text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:text-sm"
          }
        >
          {(embedded ? WEEKDAYS_COMPACT : WEEKDAYS).map((d) => (
            <div key={d} className={tight ? "py-0.5" : embedded ? "py-1" : "py-2"}>
              {d}
            </div>
          ))}
        </div>
        <div className={tight ? "grid grid-cols-7 gap-px" : embedded ? "grid grid-cols-7 gap-0.5" : "grid grid-cols-7 gap-1"}>
          {grid.map((cell, idx) => {
            if (cell.kind === "empty") {
              return (
                <div
                  key={`e-${idx}`}
                  className={`${cellMin} rounded-md bg-slate-50/50 dark:bg-slate-950/40`}
                />
              );
            }
            const meta = dayMeta[cell.dateKey];
            const count = meta?.count ?? 0;
            const dotColor = meta?.dotColor ?? "#94a3b8";
            const has = count > 0;

            return (
              <div key={cell.dateKey} className={`relative ${cellMin}`}>
                <button
                  type="button"
                  className={`flex h-full w-full flex-col items-center rounded-md border text-left transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    tight ? "p-0" : "p-0.5"
                  } ${
                    cell.isToday
                      ? "border-teal-500 bg-teal-50/80 dark:border-teal-600 dark:bg-teal-950/40"
                      : "border-transparent"
                  }`}
                  onMouseEnter={(e) => {
                    if (!meta?.titles.length) {
                      setHoverTip(null);
                      return;
                    }
                    const rect = e.currentTarget.getBoundingClientRect();
                    let left = rect.left + rect.width / 2 - DAY_HOVER_TOOLTIP_W_PX / 2;
                    left = Math.max(
                      DAY_HOVER_TOOLTIP_PAD,
                      Math.min(left, window.innerWidth - DAY_HOVER_TOOLTIP_W_PX - DAY_HOVER_TOOLTIP_PAD),
                    );
                    const top = rect.bottom + DAY_HOVER_TOOLTIP_PAD;
                    setHoverTip({ dateKey: cell.dateKey, left, top });
                  }}
                  onMouseLeave={() =>
                    setHoverTip((t) => (t?.dateKey === cell.dateKey ? null : t))
                  }
                  onClick={() => {
                    setOpenKey(cell.dateKey);
                    setHoverTip(null);
                  }}
                  aria-label={`Día ${cell.dayOfMonth}, ${count} actividades`}
                >
                  <span className={dayNumClass}>{cell.dayOfMonth}</span>
                  {has ? (
                    <span className={`flex items-center ${tight ? "mt-0 gap-px" : "mt-0.5 gap-0.5"}`}>
                      <span
                        className={`inline-block ${dotClass} shrink-0 rounded-full`}
                        style={{ backgroundColor: dotColor }}
                        aria-hidden
                      />
                      {count > 1 ? (
                        <span
                          className={`font-semibold text-slate-600 dark:text-slate-300 ${plusClass}`}
                        >
                          +{count - 1}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {openKey && openMeta ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="day-dialog-title"
          onClick={() => setOpenKey(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpenKey(null);
          }}
        >
          <Card
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 id="day-dialog-title" className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Actividades del {openKey}
              </h2>
              <Button type="button" variant="ghost" onClick={() => setOpenKey(null)} aria-label="Cerrar">
                Cerrar
              </Button>
            </div>
            {openMeta.items.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">No hay actividades este día.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-4">
                {openMeta.items.map((it) => {
                  const done = !!it.completedAt;
                  return (
                    <li
                      key={it.id}
                      className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/dashboard/items/${it.id}`}
                          className="font-semibold text-teal-800 hover:underline dark:text-teal-300"
                        >
                          {it.title}
                        </Link>
                        {done ? (
                          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs text-teal-800 dark:bg-teal-900/50 dark:text-teal-200">
                            Hecha
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {formatItemTime(it)}
                      </p>
                      {it.description ? (
                        <p className="mt-2 line-clamp-3 text-sm text-slate-500 dark:text-slate-400">
                          {it.description}
                        </p>
                      ) : null}
                      {it.itemTags.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {it.itemTags.map((x) => (
                            <span
                              key={x.tagId}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800"
                              style={
                                x.tag.color
                                  ? {
                                      backgroundColor: `${x.tag.color}33`,
                                      border: `1px solid ${x.tag.color}`,
                                    }
                                  : undefined
                              }
                            >
                              {x.tag.name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {it.checklistItems.length > 0 ? (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Checklist: {it.checklistItems.filter((c) => c.done).length}/{it.checklistItems.length}
                        </p>
                      ) : null}
                      {it.dueAt && !done ? (
                        <div className="mt-3">
                          <ItemSnoozeButtons itemId={it.id} />
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      ) : null}

      {(() => {
        if (!hoverTip || typeof document === "undefined") return null;
        const hm = dayMeta[hoverTip.dateKey];
        if (!hm?.titles.length) return null;
        return createPortal(
          <div
            className="pointer-events-none fixed z-40 rounded-lg border border-slate-500/70 bg-slate-800 p-2 text-left text-xs text-slate-100 shadow-xl ring-1 ring-black/15 dark:border-slate-500/50 dark:bg-slate-950 dark:text-slate-50 dark:ring-white/10"
            style={{
              left: hoverTip.left,
              top: hoverTip.top,
              width: DAY_HOVER_TOOLTIP_W_PX,
            }}
            role="tooltip"
          >
            <ul className="max-h-40 space-y-1 overflow-y-auto">
              {hm.titles.map((t, i) => (
                <li key={i} className="truncate">
                  {t}
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        );
      })()}
    </div>
  );
}
