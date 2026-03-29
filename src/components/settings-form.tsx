"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { PushNotificationsToggle } from "@/components/push-notifications-toggle";

type Props = {
  accountEmail: string;
  accountTimezone: string;
  initialNotificationEmail: string | null;
  initialNotificationPhone: string | null;
  initialReminderEmailEnabled: boolean;
  initialReminderSmsEnabled: boolean;
  initialQuietHoursStart: string | null;
  initialQuietHoursEnd: string | null;
  pushSubscriptionCount: number;
  showDevPushTest?: boolean;
  showDevEmailTest?: boolean;
};

export function SettingsForm({
  accountEmail,
  accountTimezone,
  initialNotificationEmail,
  initialNotificationPhone,
  initialReminderEmailEnabled,
  initialReminderSmsEnabled,
  initialQuietHoursStart,
  initialQuietHoursEnd,
  pushSubscriptionCount,
  showDevPushTest = false,
  showDevEmailTest = false,
}: Props) {
  const [reminderEmailEnabled, setReminderEmailEnabled] = useState(initialReminderEmailEnabled);
  const [reminderSmsEnabled, setReminderSmsEnabled] = useState(initialReminderSmsEnabled);
  const [notificationEmail, setNotificationEmail] = useState(initialNotificationEmail ?? "");
  const [notificationPhone, setNotificationPhone] = useState(initialNotificationPhone ?? "");
  const [quietHoursStart, setQuietHoursStart] = useState(initialQuietHoursStart ?? "");
  const [quietHoursEnd, setQuietHoursEnd] = useState(initialQuietHoursEnd ?? "");
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingSms, setSavingSms] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savingQuiet, setSavingQuiet] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [prefNote, setPrefNote] = useState<string | null>(null);
  const [smsNote, setSmsNote] = useState<string | null>(null);
  const [contactNote, setContactNote] = useState<string | null>(null);
  const [quietNote, setQuietNote] = useState<string | null>(null);
  const [emailTestBusy, setEmailTestBusy] = useState(false);
  const [emailTestNote, setEmailTestNote] = useState<string | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function saveEmailPref(next: boolean) {
    setSavingPrefs(true);
    setPrefNote(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderEmailEnabled: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setPrefNote(typeof j.error === "string" ? j.error : "No se pudo guardar.");
        return;
      }
      setReminderEmailEnabled(next);
      setPrefNote("Preferencia guardada.");
    } finally {
      setSavingPrefs(false);
    }
  }

  async function saveSmsPref(next: boolean) {
    setSavingSms(true);
    setSmsNote(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderSmsEnabled: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setSmsNote(typeof j.error === "string" ? j.error : "No se pudo guardar.");
        return;
      }
      setReminderSmsEnabled(next);
      setSmsNote("Preferencia guardada.");
    } finally {
      setSavingSms(false);
    }
  }

  async function saveContact(e: React.FormEvent) {
    e.preventDefault();
    setSavingContact(true);
    setContactNote(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationEmail: notificationEmail.trim() === "" ? "" : notificationEmail.trim(),
          notificationPhone: notificationPhone.trim() === "" ? "" : notificationPhone.trim(),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setContactNote(typeof j.error === "string" ? j.error : "No se pudo guardar.");
        return;
      }
      setContactNote("Datos de contacto guardados.");
    } finally {
      setSavingContact(false);
    }
  }

  async function saveQuiet(e: React.FormEvent) {
    e.preventDefault();
    setSavingQuiet(true);
    setQuietNote(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quietHoursStart: quietHoursStart.trim() === "" ? "" : quietHoursStart.trim(),
          quietHoursEnd: quietHoursEnd.trim() === "" ? "" : quietHoursEnd.trim(),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setQuietNote(typeof j.error === "string" ? j.error : "No se pudo guardar.");
        return;
      }
      setQuietNote("Horario silencioso guardado.");
    } finally {
      setSavingQuiet(false);
    }
  }

  async function sendDevEmailTest() {
    setEmailTestNote(null);
    setEmailTestBusy(true);
    try {
      const res = await fetch("/api/email/test", { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as { error?: string; to?: string };
      if (!res.ok) {
        setEmailTestNote(typeof j.error === "string" ? j.error : "No se pudo enviar.");
        return;
      }
      setEmailTestNote(`Correo de prueba enviado a ${j.to ?? "tu correo"}.`);
    } catch {
      setEmailTestNote("No se pudo enviar.");
    } finally {
      setEmailTestBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordFeedback(null);
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ ok: false, text: "La nueva contraseña y la confirmación no coinciden." });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPasswordFeedback({
          ok: false,
          text: typeof j.error === "string" ? j.error : "No se pudo cambiar la contraseña.",
        });
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordFeedback({ ok: true, text: "Contraseña actualizada." });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Correo y teléfono para avisos</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          El correo de tu cuenta es para iniciar sesión. Podés indicar otro correo solo para recordatorios por email
          (si no completás este campo, usamos el de la cuenta).
        </p>
        <form onSubmit={saveContact} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Correo de la cuenta</span>
            <p className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
              {accountEmail}
            </p>
          </div>
          <Input
            label="Correo para recordatorios (opcional)"
            name="notificationEmail"
            type="email"
            autoComplete="email"
            placeholder={`Por defecto: ${accountEmail}`}
            value={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.value)}
          />
          <Input
            label="Teléfono para SMS (opcional)"
            name="notificationPhone"
            type="tel"
            autoComplete="tel"
            placeholder="E.164, ej. +5491112345678"
            maxLength={40}
            value={notificationPhone}
            onChange={(e) => setNotificationPhone(e.target.value)}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            El correo opcional es el destino de los recordatorios por email si tenés activada esa opción. El teléfono se
            usa para SMS cuando activás la opción de abajo y el servidor tiene Twilio configurado.
          </p>
          <Button type="submit" disabled={savingContact}>
            {savingContact ? "Guardando…" : "Guardar correo y teléfono"}
          </Button>
        </form>
        {contactNote ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400" role="status">
            {contactNote}
          </p>
        ) : null}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Horario silencioso</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          En este rango (según tu zona{" "}
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{accountTimezone}</span>) no enviamos
          correo, push ni SMS por recordatorios; se pospone al siguiente ciclo del servidor cuando ya no sea horario
          silencioso.
        </p>
        <form onSubmit={saveQuiet} className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Desde (HH:mm)"
              name="quietHoursStart"
              type="time"
              value={quietHoursStart}
              onChange={(e) => setQuietHoursStart(e.target.value)}
            />
            <Input
              label="Hasta (HH:mm)"
              name="quietHoursEnd"
              type="time"
              value={quietHoursEnd}
              onChange={(e) => setQuietHoursEnd(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dejá ambos vacíos y guardá para desactivar. Para cruzar medianoche, poné por ejemplo 22:00 → 07:00.
          </p>
          <Button type="submit" disabled={savingQuiet}>
            {savingQuiet ? "Guardando…" : "Guardar horario silencioso"}
          </Button>
        </form>
        {quietNote ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400" role="status">
            {quietNote}
          </p>
        ) : null}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Recordatorios por correo</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Si está activado y el servidor tiene correo configurado (Resend), te enviamos un email al correo de
          recordatorios de la primera tarjeta o, si lo dejaste vacío, al correo de tu cuenta. El envío usa el mismo
          proceso programado que los push: el servidor revisa los recordatorios vencidos cada cierto tiempo (en Vercel,
          según el cron del proyecto), no en el segundo exacto. Si el correo falla, igual se registra el aviso en la app
          y se envía el push (si aplica).
        </p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Igual podés ver los avisos dentro de la app en <span className="font-medium">Avisos</span>.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              checked={reminderEmailEnabled}
              disabled={savingPrefs}
              onChange={(e) => void saveEmailPref(e.target.checked)}
            />
            Enviar recordatorios a mi correo
          </label>
        </div>
        {prefNote ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400" role="status">
            {prefNote}
          </p>
        ) : null}
        {showDevEmailTest ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
            <Button type="button" variant="secondary" onClick={() => void sendDevEmailTest()} disabled={emailTestBusy}>
              {emailTestBusy ? "Enviando…" : "Enviar correo de prueba"}
            </Button>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Solo desarrollo — <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">POST /api/email/test</code>
            </span>
          </div>
        ) : null}
        {emailTestNote ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400" role="status">
            {emailTestNote}
          </p>
        ) : null}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Recordatorios por SMS</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Requiere que el administrador configure{" "}
          <code className="rounded bg-slate-200 px-1 text-xs dark:bg-slate-800">TWILIO_ACCOUNT_SID</code>,{" "}
          <code className="rounded bg-slate-200 px-1 text-xs dark:bg-slate-800">TWILIO_AUTH_TOKEN</code> y{" "}
          <code className="rounded bg-slate-200 px-1 text-xs dark:bg-slate-800">TWILIO_FROM_NUMBER</code> en el servidor.
          Usamos el teléfono de la primera tarjeta (formato internacional recomendado).
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              checked={reminderSmsEnabled}
              disabled={savingSms}
              onChange={(e) => void saveSmsPref(e.target.checked)}
            />
            Enviar recordatorios por SMS
          </label>
        </div>
        {smsNote ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400" role="status">
            {smsNote}
          </p>
        ) : null}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Contraseña</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Escribí tu contraseña actual y elegí una nueva (mínimo 8 caracteres).
        </p>
        <form onSubmit={changePassword} className="mt-4 flex flex-col gap-4">
          <PasswordField
            label="Contraseña actual"
            name="currentPassword"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <PasswordField
            label="Nueva contraseña"
            name="newPassword"
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <PasswordField
            label="Confirmar nueva contraseña"
            name="confirmPassword"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button type="submit" disabled={savingPassword}>
            {savingPassword ? "Actualizando…" : "Cambiar contraseña"}
          </Button>
        </form>
        {passwordFeedback ? (
          <p
            className={
              passwordFeedback.ok
                ? "mt-3 text-sm text-slate-600 dark:text-slate-400"
                : "mt-3 text-sm text-red-600 dark:text-red-400"
            }
            role="status"
          >
            {passwordFeedback.text}
          </p>
        ) : null}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Notificaciones del navegador</h2>
        <div className="mt-3">
          <PushNotificationsToggle
            initialSubscriptionCount={pushSubscriptionCount}
            showDevPushTest={showDevPushTest}
          />
        </div>
      </Card>

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
