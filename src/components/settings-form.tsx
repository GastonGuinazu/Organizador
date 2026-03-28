"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PushNotificationsToggle } from "@/components/push-notifications-toggle";

type Props = {
  initialReminderEmailEnabled: boolean;
  pushSubscriptionCount: number;
};

export function SettingsForm({ initialReminderEmailEnabled, pushSubscriptionCount }: Props) {
  const [reminderEmailEnabled, setReminderEmailEnabled] = useState(initialReminderEmailEnabled);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function saveEmailPref(next: boolean) {
    setSaving(true);
    setNote(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderEmailEnabled: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setNote(typeof j.error === "string" ? j.error : "No se pudo guardar.");
        return;
      }
      setReminderEmailEnabled(next);
      setNote("Preferencia guardada.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Recordatorios por correo</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Si está activado y el servidor tiene correo configurado, te enviamos un email cuando toque un
          recordatorio. Igual podés ver los avisos dentro de la app en{" "}
          <span className="font-medium">Avisos</span>.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              checked={reminderEmailEnabled}
              disabled={saving}
              onChange={(e) => void saveEmailPref(e.target.checked)}
            />
            Enviar recordatorios a mi correo
          </label>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Notificaciones del navegador</h2>
        <div className="mt-3">
          <PushNotificationsToggle initialSubscriptionCount={pushSubscriptionCount} />
        </div>
      </Card>

      {note ? (
        <p className="text-center text-sm text-slate-600 dark:text-slate-400" role="status">
          {note}
        </p>
      ) : null}

      <div className="text-center">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-950"
        >
          Volver al tablero
        </Link>
      </div>
    </div>
  );
}
