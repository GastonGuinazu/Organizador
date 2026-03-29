export type TwilioSendResult = { ok: true } | { ok: false; status: number; body: string };

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_FROM_NUMBER?.trim(),
  );
}

export async function sendTwilioSms(to: string, body: string): Promise<TwilioSendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  if (!sid || !token || !from) {
    return { ok: false, status: 503, body: "Twilio no configurado" };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({ From: from, To: to.trim(), Body: body });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, body: text.slice(0, 500) };
  }
  return { ok: true };
}
