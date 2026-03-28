import { NextResponse } from "next/server";
import { auth } from "@/auth";

/** Public VAPID key for Web Push subscription (client). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  if (!publicKey) {
    return NextResponse.json({ error: "Push no configurado en el servidor" }, { status: 503 });
  }

  return NextResponse.json({ publicKey });
}
