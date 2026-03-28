import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      userId: null as string | null,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }
  return { userId: session.user.id, response: null };
}
