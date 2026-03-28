"use client";

import { useEffect, useState } from "react";

export function useNetworkOnline(): boolean {
  // Mismo valor en SSR y en el primer render del cliente para evitar errores de hidratación.
  // `navigator.onLine` solo se aplica después del mount (useEffect).
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);

    let cancelled = false;

    async function attachCapacitor() {
      try {
        const { Network } = await import("@capacitor/network");
        const s = await Network.getStatus();
        if (!cancelled) setOnline(s.connected);

        const h = await Network.addListener("networkStatusChange", (st) => {
          setOnline(st.connected);
        });
        return () => {
          void h.remove();
        };
      } catch {
        return undefined;
      }
    }

    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    let removeCap: (() => void) | undefined;
    void attachCapacitor().then((fn) => {
      removeCap = fn;
    });

    return () => {
      cancelled = true;
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      removeCap?.();
    };
  }, []);

  return online;
}
