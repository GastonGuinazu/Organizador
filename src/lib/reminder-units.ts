export type ReminderUnit = "minutes" | "hours" | "days" | "weeks";

/** Orden del desplegable (de más corto a más largo). */
export const REMINDER_UNITS: ReminderUnit[] = ["minutes", "hours", "days", "weeks"];

const MULTIPLIERS: Record<ReminderUnit, number> = {
  minutes: 1,
  hours: 60,
  days: 1440,
  weeks: 10080,
};

export const REMINDER_UNIT_LABELS: Record<ReminderUnit, string> = {
  minutes: "Minutos",
  hours: "Horas",
  days: "Días",
  weeks: "Semanas",
};

export function toOffsetMinutes(value: number, unit: ReminderUnit): number {
  return Math.round(value * MULTIPLIERS[unit]);
}

/** Elige la unidad más legible para un offset guardado en minutos. */
export function offsetMinutesToValueAndUnit(offset: number): { value: number; unit: ReminderUnit } {
  if (!Number.isFinite(offset) || offset <= 0) {
    return { value: Math.max(0, offset), unit: "minutes" };
  }
  if (offset % MULTIPLIERS.weeks === 0) {
    return { value: offset / MULTIPLIERS.weeks, unit: "weeks" };
  }
  if (offset % MULTIPLIERS.days === 0) {
    return { value: offset / MULTIPLIERS.days, unit: "days" };
  }
  if (offset % MULTIPLIERS.hours === 0) {
    return { value: offset / MULTIPLIERS.hours, unit: "hours" };
  }
  return { value: offset, unit: "minutes" };
}
