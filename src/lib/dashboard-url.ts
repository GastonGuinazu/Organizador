export type DashboardCalendarParams = {
  calYear: number;
  calMonth: number;
};

/** Construye la URL del tablero conservando filtro, búsqueda, etiqueta y mes del calendario. */
export function buildDashboardHref(
  filter: string,
  q?: string,
  tagId?: string,
  cal?: DashboardCalendarParams,
) {
  const p = new URLSearchParams();
  if (filter && filter !== "all") p.set("filter", filter);
  if (q?.trim()) p.set("q", q.trim());
  if (tagId) p.set("tagId", tagId);
  if (cal) {
    p.set("calYear", String(cal.calYear));
    p.set("calMonth", String(cal.calMonth));
  }
  const s = p.toString();
  return s ? `/dashboard?${s}` : "/dashboard";
}
