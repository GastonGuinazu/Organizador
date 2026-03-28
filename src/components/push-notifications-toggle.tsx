"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

type Props = {
  initialSubscriptionCount: number;
};

export function PushNotificationsToggle({ initialSubscriptionCount }: Props) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [serverPush, setServerPush] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [localSubscribed, setLocalSubscribed] = useState(false);

  const refreshServer = useCallback(async () => {
    const res = await fetch("/api/push/vapid-key");
    setServerPush(res.ok);
  }, []);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window);
    void refreshServer();
  }, [refreshServer]);

  useEffect(() => {
    if (!supported) return;
    void (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setLocalSubscribed(!!sub);
      } catch {
        setLocalSubscribed(false);
      }
    })();
  }, [supported]);

  const hasRemote = initialSubscriptionCount > 0 || localSubscribed;

  async function subscribe() {
    setMessage(null);
    setBusy(true);
    try {
      const keyRes = await fetch("/api/push/vapid-key");
      if (!keyRes.ok) {
        setMessage("Las notificaciones push no están configuradas en el servidor.");
        return;
      }
      const { publicKey } = (await keyRes.json()) as { publicKey: string };

      const reg = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Permisos denegados. Podés activarlos desde la configuración del navegador.");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        setMessage("No se pudo crear la suscripción.");
        return;
      }

      const save = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        }),
      });

      if (!save.ok) {
        const err = await save.json().catch(() => ({}));
        setMessage(typeof err.error === "string" ? err.error : "No se pudo guardar la suscripción.");
        return;
      }

      setLocalSubscribed(true);
      setMessage("Listo. Vas a recibir avisos en este dispositivo cuando venza un recordatorio.");
    } catch {
      setMessage("Algo salió mal. Probá de nuevo más tarde.");
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribeAll() {
    setMessage(null);
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      await fetch("/api/push/subscribe?all=1", { method: "DELETE" });

      setLocalSubscribed(false);
      setMessage("Notificaciones push desactivadas en el servidor y en este dispositivo.");
    } catch {
      setMessage("No se pudo completar la baja. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  if (supported === false) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Tu navegador no admite notificaciones push o no hay service worker.
      </p>
    );
  }

  if (serverPush === false) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        El administrador del sitio aún no configuró las claves VAPID (variables{" "}
        <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">VAPID_*</code> en el servidor).
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Recibí un aviso en el dispositivo cuando un recordatorio se dispare. Requiere HTTPS (excepto en
        desarrollo local).
      </p>
      <div className="flex flex-wrap gap-2">
        {!hasRemote ? (
          <Button type="button" onClick={() => void subscribe()} disabled={busy || supported === null}>
            {busy ? "Activando…" : "Activar en este dispositivo"}
          </Button>
        ) : (
          <Button type="button" variant="secondary" onClick={() => void unsubscribeAll()} disabled={busy}>
            {busy ? "Desactivando…" : "Desactivar notificaciones push"}
          </Button>
        )}
      </div>
      {message ? <p className="text-sm text-slate-700 dark:text-slate-200">{message}</p> : null}
    </div>
  );
}
