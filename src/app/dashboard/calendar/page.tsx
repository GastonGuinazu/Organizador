import { redirect } from "next/navigation";

/** El calendario vive en el tablero principal; esta ruta evita enlaces rotos. */
export default async function CalendarRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const p = new URLSearchParams();
  if (sp.year) p.set("calYear", sp.year);
  if (sp.month) p.set("calMonth", sp.month);
  const q = p.toString();
  redirect(q ? `/dashboard?${q}` : "/dashboard");
}
