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
  initialNotificationEmail: string | null;
  initialNotificationPhone: string | null;
  initialReminderEmailEnabled: boolean;
  pushSubscriptionCount: number;
  /** Solo true en servidor de desarrollo: muestra envío de push de prueba */
  showDevPushTest?: boolean;
};

export function SettingsForm({
  accountEmail,
  initialNotificationEmail,
  initialNotificationPhone,
  initialReminderEmailEnabled,
  pushSubscriptionCount,
  showDevPushTest = false,
}: Props) {
  const [reminderEmailEnabled, setReminderEmailEnabled] = useState(initialReminderEmailEnabled);
  const [notificationEmail, setNotificationEmail] = useState(initialNotificationEmail ?? "");
  const [notificationPhone, setNotificationPhone] = useState(initialNotificationPhone ?? "");
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [prefNote, setPrefNote] = useState<string | null>(null);
  const [contactNote, setContactNote] = useState<string | null>(null);
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
            label="Teléfono (opcional)"
            name="notificationPhone"
            type="tel"
            autoComplete="tel"
            placeholder="Ej. +54 9 11 1234-5678"
            maxLength={40}
            value={notificationPhone}
            onChange={(e) => setNotificationPhone(e.target.value)}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            El correo opcional de arriba es el destino de los recordatorios por email cuando tenés activada la casilla de
            &quot;Enviar recordatorios a mi correo&quot;. El teléfono solo se guarda en la cuenta:{" "}
            <span className="font-medium">todavía no enviamos SMS</span>; cuando haya un proveedor configurado, usaremos
            este número.
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
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Recordatorios por correo</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Si está activado y el servidor tiene correo configurado (Resend), te enviamos un email al correo de
          recordatorios de la primera tarjeta o, si lo dejaste vacío, al correo de tu cuenta. El envío usa el mismo
          proceso programado que los push: el servidor revisa los recordatorios vencidos cada cierto tiempo (en Vercel,
          según el cron del proyecto), no en el segundo exacto.
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
