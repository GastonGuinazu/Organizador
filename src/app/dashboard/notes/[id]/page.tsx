import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildNotePageTree } from "@/lib/note-pages";
import { buildNoteBreadcrumbs } from "@/lib/note-breadcrumbs";
import { NoteWorkspace } from "@/components/note-workspace";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function NoteDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const { id } = await params;

  const allMeta = await prisma.notePage.findMany({
    where: { userId },
    select: { id: true, parentId: true, title: true, sortOrder: true },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
  });

  const page = await prisma.notePage.findFirst({
    where: { id, userId },
    select: { id: true, title: true, body: true, parentId: true },
  });
  if (!page) notFound();

  const tree = buildNotePageTree(allMeta);
  const breadcrumbs = buildNoteBreadcrumbs(allMeta, id);

  return (
    <NoteWorkspace
      tree={tree}
      page={{
        id: page.id,
        title: page.title,
        body: page.body,
        parentId: page.parentId,
      }}
      breadcrumbs={breadcrumbs}
    />
  );
}
