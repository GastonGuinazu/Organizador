"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function NotesEmpty() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createFirst() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/note-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Mi primera nota" }),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear la nota");
        return;
      }
      if (data.id) router.push(`/dashboard/notes/${data.id}`);
    } catch {
      setError("No se pudo crear la nota");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Tus notas</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Organizá resúmenes, materias y lo que necesites; todo en páginas anidadas.
        </p>
      </div>
      <Card className="max-w-lg p-6">
        <p className="text-slate-600 dark:text-slate-300">
          Todavía no tenés ninguna nota. Creá la primera para armar tu árbol (por ejemplo “Casa” y “Facultad” como
          páginas principales).
        </p>
        <Button type="button" className="mt-6 min-h-11" disabled={busy} onClick={createFirst}>
          {busy ? "Creando…" : "Crear tu primera nota"}
        </Button>
        {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      </Card>
    </div>
  );
}
