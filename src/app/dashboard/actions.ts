"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function assertItemOwner(id: string, userId: string) {
  const item = await prisma.item.findFirst({ where: { id, userId } });
  if (!item) throw new Error("No encontrado");
  return item;
}

export async function toggleItemComplete(id: string, completed: boolean) {
  const session = await auth();
  if (!session?.user?.id) return;
  await assertItemOwner(id, session.user.id);
  await prisma.item.update({
    where: { id },
    data: { completedAt: completed ? new Date() : null },
  });
  revalidatePath("/dashboard");
}

export async function toggleItemArchived(id: string, archived: boolean) {
  const session = await auth();
  if (!session?.user?.id) return;
  await assertItemOwner(id, session.user.id);
  await prisma.item.update({ where: { id }, data: { archived } });
  revalidatePath("/dashboard");
}

export async function deleteItem(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  await assertItemOwner(id, session.user.id);
  await prisma.item.delete({ where: { id } });
  revalidatePath("/dashboard");
}
