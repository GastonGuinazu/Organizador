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
  /** Muestra botón que llama a POST /api/push/test (solo existe en desarrollo). */
  showDevPushTest?: boolean;
};

export function PushNotificationsToggle({ initialSubscriptionCount, showDevPushTest = false }: Props) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [serverPush, setServerPush] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [localSubscribed, setLocalSubscribed] = useState(false);
  const [testBusy, setTestBusy] = useState(false);

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

  async function sendDevTest() {
    setMessage(null);
    setTestBusy(true);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        sent?: number;
        failed?: number;
        subscriptions?: number;
      };
      if (!res.ok) {
        setMessage(typeof j.error === "string" ? j.error : "No se pudo enviar la prueba.");
        return;
      }
      setMessage(
        `Prueba enviada: ${j.sent ?? 0} correctas, ${j.failed ?? 0} fallidas (${j.subscriptions ?? 0} suscripciones).`,
      );
    } catch {
      setMessage("No se pudo enviar la prueba.");
    } finally {
      setTestBusy(false);
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
        {showDevPushTest && hasRemote && serverPush ? (
          <Button type="button" variant="secondary" onClick={() => void sendDevTest()} disabled={testBusy || busy}>
            {testBusy ? "Enviando…" : "Enviar notificación de prueba"}
          </Button>
        ) : null}
      </div>
      {showDevPushTest && hasRemote && serverPush ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Solo en desarrollo: <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">POST /api/push/test</code>.
        </p>
      ) : null}
      {message ? <p className="text-sm text-slate-700 dark:text-slate-200">{message}</p> : null}
    </div>
  );
}
