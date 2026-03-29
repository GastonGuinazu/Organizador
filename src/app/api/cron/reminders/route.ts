import { NextResponse } from "next/server";
import { processDueReminders } from "@/lib/process-reminders";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await processDueReminders(new Date());

  return NextResponse.json({
    processed: result.processed,
    deferredQuietHours: result.deferredQuietHours,
    emailsSent: result.emailsSent,
    skippedEmailErrors: result.skippedEmailErrors,
    pushSent: result.pushSent,
    pushFailed: result.pushFailed,
    smsSent: result.smsSent,
    smsFailed: result.smsFailed,
    mode: result.mode,
  });
}
