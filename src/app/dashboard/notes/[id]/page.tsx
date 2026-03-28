import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NoteWorkspaceLoader } from "@/components/note-workspace-loader";

type Props = { params: Promise<{ id: string }> };

export default async function NoteDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;
  return <NoteWorkspaceLoader pageId={id} />;
}
