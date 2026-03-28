"use server";

import { revalidatePath } from "next/cache";
import { DateTime } from "luxon";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resyncUnsentReminderTimes } from "@/lib/item-service";

export type SnoozePreset = "1h" | "tomorrow" | "7d";

export async function snoozeItemDue(itemId: string, preset: SnoozePreset) {
  const session = await auth();
  if (!session?.user?.id) return;

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: session.user.id, archived: false },
  });
  if (!item?.dueAt) return;

  const tz = item.timezone || "UTC";
  const current = DateTime.fromJSDate(item.dueAt, { zone: "utc" }).setZone(tz);

  let nextZoned: DateTime;
  if (preset === "1h") {
    nextZoned = current.plus({ hours: 1 });
  } else if (preset === "7d") {
    nextZoned = current.plus({ days: 7 });
  } else {
    nextZoned = current.plus({ days: 1 });
  }

  const newDueUtc = nextZoned.setZone("utc").toJSDate();

  await prisma.$transaction(async (tx) => {
    await tx.item.update({
      where: { id: itemId },
      data: { dueAt: newDueUtc },
    });
    await resyncUnsentReminderTimes(tx, itemId, newDueUtc);
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/items/${itemId}`);
}
