import { DateTime } from "luxon";

/** Texto "vence …" usando la zona del ítem (dueAt en UTC en BD). */
export function formatDueForReminder(item: {
  dueAt: Date | null;
  allDay: boolean;
  timezone: string;
}): string {
  if (!item.dueAt) return "sin fecha";
  const zone = item.timezone?.trim() || "UTC";
  const dt = DateTime.fromJSDate(item.dueAt, { zone: "utc" }).setZone(zone);
  if (!dt.isValid) {
    return new Intl.DateTimeFormat("es", {
      dateStyle: "medium",
      timeStyle: item.allDay ? undefined : "short",
    }).format(item.dueAt);
  }
  if (item.allDay) {
    return dt.setLocale("es").toLocaleString({
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return dt.setLocale("es").toLocaleString(DateTime.DATETIME_SHORT);
}
