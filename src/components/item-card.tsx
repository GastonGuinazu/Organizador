import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ItemCardChecklist } from "@/components/item-card-checklist";
import { ItemRowActions } from "@/components/item-row-actions";
import { ItemSnoozeButtons } from "@/components/item-snooze-buttons";
import type { ItemPayload } from "@/lib/item-service";

function formatDue(dueAt: Date | null, allDay: boolean) {
  if (!dueAt) return "Sin fecha límite";
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: allDay ? undefined : "short",
  }).format(dueAt);
}

export function ItemCard({ item }: { item: ItemPayload }) {
  const completed = !!item.completedAt;
  const total = item.checklistItems.length;

  return (
    <Card className={completed ? "opacity-80" : ""}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              <Link href={`/dashboard/items/${item.id}`} className="hover:underline">
                {item.title}
              </Link>
            </h2>
            {completed ? (
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800 dark:bg-teal-900/40 dark:text-teal-200">
                Hecha
              </span>
            ) : null}
          </div>
          {item.itemTags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5" aria-label="Etiquetas">
              {item.itemTags.map((it) => (
                <span
                  key={it.tagId}
                  className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  style={
                    it.tag.color
                      ? { backgroundColor: `${it.tag.color}2a`, borderColor: it.tag.color }
                      : undefined
                  }
                >
                  {it.tag.name}
                </span>
              ))}
            </div>
          ) : null}
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {formatDue(item.dueAt, item.allDay)}
            {item.reminders.length > 0
              ? ` · ${item.reminders.length} recordatorio(s)`
              : null}
          </p>
          {item.description ? (
            <p className="line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
          ) : null}
          {total > 0 ? (
            <ItemCardChecklist
              itemId={item.id}
              items={item.checklistItems.map((c) => ({
                id: c.id,
                title: c.title,
                done: c.done,
              }))}
            />
          ) : null}
          {item.dueAt && !completed ? (
            <div className="pt-2">
              <ItemSnoozeButtons itemId={item.id} />
            </div>
          ) : null}
        </div>
        <ItemRowActions id={item.id} completed={completed} archived={item.archived} />
      </div>
    </Card>
  );
}
