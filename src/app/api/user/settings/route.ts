import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userSettingsPatchSchema } from "@/lib/validators";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = userSettingsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const data: {
    reminderEmailEnabled?: boolean;
    reminderSmsEnabled?: boolean;
    notificationEmail?: string | null;
    notificationPhone?: string | null;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
  } = {};

  if (parsed.data.reminderEmailEnabled !== undefined) {
    data.reminderEmailEnabled = parsed.data.reminderEmailEnabled;
  }
  if (parsed.data.reminderSmsEnabled !== undefined) {
    data.reminderSmsEnabled = parsed.data.reminderSmsEnabled;
  }
  if (parsed.data.notificationEmail !== undefined) {
    const v = parsed.data.notificationEmail;
    data.notificationEmail = v === "" ? null : v.toLowerCase();
  }
  if (parsed.data.notificationPhone !== undefined) {
    const v = parsed.data.notificationPhone.trim();
    data.notificationPhone = v === "" ? null : v;
  }
  if (parsed.data.quietHoursStart !== undefined) {
    const v = parsed.data.quietHoursStart.trim();
    data.quietHoursStart = v === "" ? null : v;
  }
  if (parsed.data.quietHoursEnd !== undefined) {
    const v = parsed.data.quietHoursEnd.trim();
    data.quietHoursEnd = v === "" ? null : v;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  return NextResponse.json({ ok: true });
}
