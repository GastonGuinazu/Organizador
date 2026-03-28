import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getItemForUser } from "@/lib/item-service";
import { ItemForm } from "@/components/item-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditItemPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const item = await getItemForUser(id, session.user.id);
  if (!item) notFound();

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
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">Editar actividad</h1>
      </div>
      <ItemForm mode="edit" tags={tags} item={item} />
    </div>
  );
}
