import { DateTime } from "luxon";
import type { ItemPayload } from "@/lib/item-service";

export const DEFAULT_DOT_COLOR = "#0d9488";

/** Día civil YYYY-MM-DD del vencimiento en la zona del ítem (dueAt almacenado en UTC). */
export function dueAtToDateKey(dueAt: Date, itemTimezone: string): string {
  return DateTime.fromJSDate(dueAt, { zone: "utc" })
    .setZone(itemTimezone)
    .toFormat("yyyy-MM-dd");
}

export function todayDateKeyInZone(zone: string): string {
  return DateTime.now().setZone(zone).toFormat("yyyy-MM-dd");
}

export function monthBoundsUtc(year: number, month: number, zone: string): { start: Date; end: Date } {
  const start = DateTime.fromObject({ year, month, day: 1 }, { zone }).startOf("day");
  const end = start.endOf("month");
  return {
    start: start.toUTC().toJSDate(),
    end: end.toUTC().toJSDate(),
  };
}

export type CalendarCell =
  | { kind: "empty" }
  | { kind: "day"; dateKey: string; dayOfMonth: number; isToday: boolean };

export function buildMonthGrid(year: number, month: number, zone: string, todayKey: string): CalendarCell[] {
  const first = DateTime.fromObject({ year, month, day: 1 }, { zone });
  const daysInMonth = first.daysInMonth ?? 30;
  const leading = first.weekday - 1;
  const cells: CalendarCell[] = [];
  for (let i = 0; i < leading; i++) cells.push({ kind: "empty" });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = DateTime.fromObject({ year, month, day: d }, { zone }).toFormat("yyyy-MM-dd");
    cells.push({
      kind: "day",
      dateKey,
      dayOfMonth: d,
      isToday: dateKey === todayKey,
    });
  }
  while (cells.length % 7 !== 0) cells.push({ kind: "empty" });
  return cells;
}

/** Color del punto: etiqueta creada antes (`Tag.createdAt` más antiguo entre las presentes ese día). */
export function dotColorForItems(items: ItemPayload[]): string {
  const seen = new Map<string, { color: string | null; createdAt: Date }>();
  for (const item of items) {
    for (const it of item.itemTags) {
      const t = it.tag;
      if (!seen.has(t.id)) {
        seen.set(t.id, { color: t.color, createdAt: t.createdAt });
      }
    }
  }
  if (seen.size === 0) return DEFAULT_DOT_COLOR;
  const sorted = [...seen.values()].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return sorted[0].color ?? DEFAULT_DOT_COLOR;
}

export function sortItemsForDay(items: ItemPayload[], zone: string): ItemPayload[] {
  return [...items].sort((a, b) => {
    if (a.allDay !== b.allDay) return a.allDay ? 1 : -1;
    if (!a.dueAt || !b.dueAt) return a.title.localeCompare(b.title, "es");
    const ta = DateTime.fromJSDate(a.dueAt, { zone: "utc" }).setZone(zone);
    const tb = DateTime.fromJSDate(b.dueAt, { zone: "utc" }).setZone(zone);
    if (!a.allDay) {
      const ma = ta.hour * 60 + ta.minute;
      const mb = tb.hour * 60 + tb.minute;
      if (ma !== mb) return ma - mb;
    }
    return a.title.localeCompare(b.title, "es");
  });
}

export function prevMonth(year: number, month: number): { year: number; month: number } {
  if (month <= 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

export function nextMonth(year: number, month: number): { year: number; month: number } {
  if (month >= 12) return { year: year + 1, month: 1 };
  return { year, month: month + 1 };
}
