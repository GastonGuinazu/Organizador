import { NextResponse } from "next/server";
import { Resend } from "resend";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { escapeHtml } from "@/lib/escape-html";
import { getAppBaseUrl } from "@/lib/app-base-url";

/** Solo en desarrollo: envía un correo de prueba vía Resend al destino de recordatorios del usuario. */
export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!key || !from) {
    return NextResponse.json(
      { error: "Resend no configurado (RESEND_API_KEY y EMAIL_FROM)" },
      { status: 503 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, notificationEmail: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const to = user.notificationEmail?.trim() || user.email;
  const base = getAppBaseUrl();
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Prueba — Organizador",
    html: `<p>Si recibís esto, <strong>Resend</strong> está bien configurado.</p>
      <p><a href="${escapeHtml(`${base}/dashboard/settings`)}">Ir a Ajustes</a></p>`,
  });

  if (error) {
    const msg =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : "Error al enviar";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  return NextResponse.json({ ok: true, to });
}
