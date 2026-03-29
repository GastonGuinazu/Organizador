import { DateTime } from "luxon";

function parseMinutes(hhmm: string): number | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * Si start y end están definidos, indica si `now` (instante UTC) cae en la ventana silenciosa
 * interpretada en `userTimezone` (IANA). Soporta ventana que cruza medianoche (ej. 22:00–07:00).
 */
export function isWithinQuietHours(
  now: Date,
  userTimezone: string,
  quietHoursStart: string | null | undefined,
  quietHoursEnd: string | null | undefined,
): boolean {
  const startStr = quietHoursStart?.trim();
  const endStr = quietHoursEnd?.trim();
  if (!startStr || !endStr) return false;

  const start = parseMinutes(startStr);
  const end = parseMinutes(endStr);
  if (start === null || end === null) return false;

  const zone = userTimezone?.trim() || "UTC";
  const t = DateTime.fromJSDate(now, { zone: "utc" }).setZone(zone);
  if (!t.isValid) return false;

  const minutes = t.hour * 60 + t.minute;
  if (start < end) {
    return minutes >= start && minutes < end;
  }
  if (start > end) {
    return minutes >= start || minutes < end;
  }
  return false;
}
