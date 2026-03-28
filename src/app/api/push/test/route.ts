import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { configureWebPush, sendPushToSubscriptions } from "@/lib/web-push-server";

/** Solo en `NODE_ENV=development`: envía un push de prueba a las suscripciones del usuario. */
export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!configureWebPush()) {
    return NextResponse.json({ error: "Push no configurado en el servidor" }, { status: 503 });
  }

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: session.user.id },
  });

  if (subs.length === 0) {
    return NextResponse.json(
      { error: "No hay suscripciones guardadas. Activá las notificaciones push primero." },
      { status: 400 },
    );
  }

  const { sent, failed } = await sendPushToSubscriptions(subs, {
    title: "Prueba — Organizador",
    body: "Si ves esto, las notificaciones push están bien configuradas.",
    url: "/dashboard",
    tag: "organizador-push-test",
  });

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    subscriptions: subs.length,
  });
}
