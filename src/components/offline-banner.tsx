"use client";

import { useNetworkOnline } from "@/components/use-network-status";

export function OfflineBanner() {
  const online = useNetworkOnline();
  if (online) return null;
  return (
    <div
      role="status"
      className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
    >
      Sin conexión: estás viendo datos guardados en este dispositivo. Los cambios pueden no guardarse hasta volver a tener
      internet.
    </div>
  );
}
