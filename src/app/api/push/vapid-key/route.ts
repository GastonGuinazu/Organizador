import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getVapidPublicKey } from "@/lib/vapid-env";

/** Public VAPID key for Web Push subscription (client). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return NextResponse.json({ error: "Push no configurado en el servidor" }, { status: 503 });
  }

  return NextResponse.json({ publicKey });
}
