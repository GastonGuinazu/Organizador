import Link from "next/link";
import { buildDashboardHref } from "@/lib/dashboard-url";

const tabs = [
  { key: "all", label: "Todas" },
  { key: "upcoming", label: "Próximas" },
  { key: "overdue", label: "Vencidas" },
  { key: "noDate", label: "Sin fecha" },
  { key: "archived", label: "Archivadas" },
] as const;

export function FilterTabs({
  current,
  q,
  tagId,
  cal,
}: {
  current: string;
  q?: string;
  tagId?: string;
  cal?: { calYear: number; calMonth: number };
}) {
  return (
    <nav className="mb-6 flex flex-wrap gap-2" aria-label="Filtros de actividades">
      {tabs.map((t) => {
        const active = current === t.key;
        return (
          <Link
            key={t.key}
            href={buildDashboardHref(t.key, q, tagId, cal)}
            className={`inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-teal-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
