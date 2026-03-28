import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NotesEmpty } from "@/components/notes-empty";
import { redirect } from "next/navigation";

export default async function NotesIndexPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const first = await prisma.notePage.findFirst({
    where: { userId: session.user.id, parentId: null },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });

  if (!first) return <NotesEmpty />;
  redirect(`/dashboard/notes/${first.id}`);
}
