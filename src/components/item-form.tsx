"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Tag } from "@prisma/client";
import type { ItemPayload } from "@/lib/item-service";
import {
  offsetMinutesToValueAndUnit,
  REMINDER_UNIT_LABELS,
  REMINDER_UNITS,
  toOffsetMinutes,
  type ReminderUnit,
} from "@/lib/reminder-units";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props =
  | { mode: "create"; tags: Tag[] }
  | { mode: "edit"; tags: Tag[]; item: ItemPayload };

const timezones = [
  "UTC",
  "America/Argentina/Buenos_Aires",
  "America/Mexico_City",
  "America/Bogota",
  "America/Santiago",
  "Europe/Madrid",
  "Europe/London",
];

function toDatetimeLocalValue(d: Date, allDay: boolean) {
  if (allDay) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}T00:00`;
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Fecha local de hoy a medianoche, para nueva actividad “todo el día”. */
function defaultDueLocalAllDay(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}T00:00`;
}

export function ItemForm(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const isCreate = props.mode === "create";
  const item = isEdit ? props.item : null;

  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [hasDue, setHasDue] = useState(isCreate ? true : !!item?.dueAt);
  const [allDay, setAllDay] = useState(isCreate ? true : (item?.allDay ?? false));
  const [dueLocal, setDueLocal] = useState(
    item?.dueAt
      ? toDatetimeLocalValue(new Date(item.dueAt), item.allDay)
      : isCreate
        ? defaultDueLocalAllDay()
        : "",
  );
  const [timezone, setTimezone] = useState(item?.timezone ?? "America/Argentina/Buenos_Aires");
  const [recurrenceRule, setRecurrenceRule] = useState<
    "NONE" | "DAILY" | "WEEKLY" | "MONTHLY"
  >((item?.recurrenceRule as "NONE" | "DAILY" | "WEEKLY" | "MONTHLY") ?? "NONE");

  type ReminderRow = { value: number; unit: ReminderUnit };

  const initialReminderRows = useMemo((): ReminderRow[] => {
    if (item?.reminders?.length) {
      return item.reminders.map((r) => offsetMinutesToValueAndUnit(r.offsetMinutes));
    }
    return [{ value: 1, unit: "days" }];
  }, [item]);
  const [reminderRows, setReminderRows] = useState<ReminderRow[]>(initialReminderRows);

  const initialChecklist = useMemo(
    () =>
      item?.checklistItems?.map((c) => ({ title: c.title, done: c.done })) ?? [
        { title: "", done: false },
      ],
    [item],
  );
  const [checklist, setChecklist] = useState<{ title: string; done: boolean }[]>(initialChecklist);

  const initialTagIds = useMemo(
    () => new Set(item?.itemTags?.map((t) => t.tagId) ?? []),
    [item],
  );
  const [tagIds, setTagIds] = useState<Set<string>>(initialTagIds);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleTag(id: string) {
    setTagIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function dueAtIso(): string | null {
    if (!hasDue || !dueLocal) return null;
    const d = new Date(dueLocal);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const reminders = reminderRows
      .map((row) => toOffsetMinutes(Math.round(row.value), row.unit))
      .filter((m) => m >= 0)
      .map((offsetMinutes) => ({ offsetMinutes }));

    const checklistItems = checklist
      .map((c, sortOrder) => ({
        title: c.title.trim(),
        done: c.done,
        sortOrder,
      }))
      .filter((c) => c.title.length > 0);

    const body = {
      title: title.trim(),
      description,
      dueAt: dueAtIso(),
      allDay,
      timezone,
      recurrenceRule,
      reminders,
      checklistItems,
      tagIds: Array.from(tagIds),
    };

    const url = isEdit ? `/api/items/${item!.id}` : "/api/items";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "No se pudo guardar");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Input label="Título" name="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea
          label="Descripción"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <fieldset className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-1 text-sm font-medium text-slate-700 dark:text-slate-200">Fecha</legend>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Si elegís fecha, el día es lo principal; la hora es opcional (por defecto es para todo el día).
          </p>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={hasDue}
              onChange={(e) => {
                const on = e.target.checked;
                setHasDue(on);
                if (on && !dueLocal.trim()) {
                  setDueLocal(defaultDueLocalAllDay());
                  setAllDay(true);
                }
              }}
              className="h-4 w-4 rounded border-slate-300"
            />
            Tiene fecha límite
          </label>
          {hasDue ? (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {allDay ? "Día" : "Fecha y hora"}
                </span>
                <input
                  type={allDay ? "date" : "datetime-local"}
                  required
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  value={allDay && dueLocal.includes("T") ? dueLocal.slice(0, 10) : dueLocal}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDueLocal(allDay ? `${v}T00:00` : v);
                  }}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={!allDay}
                  onChange={(e) => {
                    const addTime = e.target.checked;
                    if (addTime) {
                      setAllDay(false);
                      setDueLocal((prev) => {
                        const datePart = prev.split("T")[0] || defaultDueLocalAllDay().split("T")[0];
                        return `${datePart}T09:00`;
                      });
                    } else {
                      setAllDay(true);
                      setDueLocal((prev) => {
                        const datePart = prev.split("T")[0] || defaultDueLocalAllDay().split("T")[0];
                        return `${datePart}T00:00`;
                      });
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Añadir hora específica
              </label>
              <div className="flex flex-col gap-1">
                <label htmlFor="tz" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Zona horaria
                </label>
                <select
                  id="tz"
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}
        </fieldset>

        <div className="flex flex-col gap-1">
          <label htmlFor="rec" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Repetición
          </label>
          <select
            id="rec"
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            value={recurrenceRule}
            onChange={(e) => setRecurrenceRule(e.target.value as typeof recurrenceRule)}
          >
            <option value="NONE">No se repite</option>
            <option value="DAILY">Cada día</option>
            <option value="WEEKLY">Cada semana</option>
            <option value="MONTHLY">Cada mes</option>
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            El valor se guarda para el futuro; la generación automática de nuevas fechas puede añadirse después.
          </p>
        </div>

        <fieldset className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            Recordatorios
          </legend>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Elegí cuánto antes de la fecha límite querés el aviso (minutos, horas, días o semanas).
          </p>
          {reminderRows.map((row, i) => (
            <div key={i} className="flex flex-wrap gap-2">
              <input
                type="number"
                min={0}
                aria-label="Cantidad de tiempo antes del vencimiento"
                className="min-h-11 min-w-[5rem] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                value={Number.isNaN(row.value) ? "" : row.value}
                onChange={(e) => {
                  const raw = e.target.value;
                  const v = raw === "" ? NaN : Number(raw);
                  setReminderRows((prev) => prev.map((r, j) => (j === i ? { ...r, value: v } : r)));
                }}
              />
              <select
                aria-label="Unidad de tiempo del recordatorio"
                className="min-h-11 min-w-[8rem] rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={row.unit}
                onChange={(e) => {
                  const unit = e.target.value as ReminderUnit;
                  setReminderRows((prev) => prev.map((r, j) => (j === i ? { ...r, unit } : r)));
                }}
              >
                {REMINDER_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {REMINDER_UNIT_LABELS[u]}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setReminderRows((prev) => prev.filter((_, j) => j !== i))}
              >
                Quitar
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setReminderRows((prev) => [...prev, { value: 1, unit: "hours" }])}
          >
            Añadir recordatorio
          </Button>
        </fieldset>

        <fieldset className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-1 text-sm font-medium text-slate-700 dark:text-slate-200">Checklist</legend>
          {checklist.map((line, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={line.done}
                  onChange={(e) =>
                    setChecklist((prev) =>
                      prev.map((row, j) => (j === i ? { ...row, done: e.target.checked } : row)),
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                Hecho
              </label>
              <input
                className="min-h-11 min-w-[12rem] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                value={line.title}
                placeholder="Paso o subtarea"
                onChange={(e) =>
                  setChecklist((prev) =>
                    prev.map((row, j) => (j === i ? { ...row, title: e.target.value } : row)),
                  )
                }
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setChecklist((prev) => prev.filter((_, j) => j !== i))}
              >
                Quitar
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setChecklist((prev) => [...prev, { title: "", done: false }])}
          >
            Añadir ítem
          </Button>
        </fieldset>

        {props.tags.length > 0 ? (
          <fieldset className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <legend className="px-1 text-sm font-medium text-slate-700 dark:text-slate-200">Etiquetas</legend>
            <div className="flex flex-wrap gap-3">
              {props.tags.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={tagIds.has(t.id)}
                    onChange={() => toggleTag(t.id)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear actividad"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      </form>
    </Card>
  );
}
