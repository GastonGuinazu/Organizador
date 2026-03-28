import type { Tag } from "@prisma/client";
import { Button } from "@/components/ui/button";

type Props = {
  filter: string;
  q?: string;
  tagId?: string;
  calYear?: number;
  calMonth?: number;
  tags: Tag[];
};

export function DashboardSearchForm({ filter, q, tagId, calYear, calMonth, tags }: Props) {
  return (
    <form
      method="get"
      action="/dashboard"
      className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <input type="hidden" name="filter" value={filter} />
      {calYear != null && calMonth != null ? (
        <>
          <input type="hidden" name="calYear" value={calYear} />
          <input type="hidden" name="calMonth" value={calMonth} />
        </>
      ) : null}
      <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
        <label htmlFor="dash-q" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Buscar
        </label>
        <input
          id="dash-q"
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Título o descripción"
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>
      <div className="flex min-w-[10rem] flex-col gap-1">
        <label htmlFor="dash-tag" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Etiqueta
        </label>
        <select
          id="dash-tag"
          name="tagId"
          defaultValue={tagId ?? ""}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="">Todas</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" variant="secondary" className="w-full sm:w-auto">
        Aplicar
      </Button>
    </form>
  );
}
