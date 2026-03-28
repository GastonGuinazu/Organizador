import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TagCreateForm } from "@/components/tag-create-form";
import { Card } from "@/components/ui/card";

export default async function TagsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-400">
          ← Volver al tablero
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">Etiquetas</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Agrupa actividades con nombres sencillos (trabajo, familia, salud…).
        </p>
      </div>

      <TagCreateForm />

      <ul className="mt-6 flex flex-col gap-2">
        {tags.length === 0 ? (
          <Card className="text-sm text-slate-600 dark:text-slate-300">Aún no hay etiquetas.</Card>
        ) : (
          tags.map((t) => (
            <li key={t.id}>
              <Card className="flex items-center justify-between py-3">
                <span className="font-medium text-slate-900 dark:text-slate-50">{t.name}</span>
                {t.color ? (
                  <span
                    className="h-6 w-6 rounded-full border border-slate-200 dark:border-slate-700"
                    style={{ backgroundColor: t.color }}
                    aria-label={`Color ${t.color}`}
                  />
                ) : null}
              </Card>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
