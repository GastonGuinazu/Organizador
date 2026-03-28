import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ItemForm } from "@/components/item-form";

export default async function NewItemPage() {
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
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">Nueva actividad</h1>
      </div>
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          ¿Necesitas una etiqueta nueva? Créala en{" "}
          <Link href="/dashboard/tags" className="font-medium text-teal-700 underline dark:text-teal-400">
            Etiquetas
          </Link>
          .
        </p>
      </div>
      <ItemForm mode="create" tags={tags} />
    </div>
  );
}
