"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function TagCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#0d9488");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "No se pudo crear");
      return;
    }
    setName("");
    router.refresh();
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Nueva etiqueta</h2>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input label="Nombre" name="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="tag-color" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Color
          </label>
          <input
            id="tag-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-11 w-full min-w-[5rem] cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Creando…" : "Añadir"}
        </Button>
      </form>
      {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </Card>
  );
}
