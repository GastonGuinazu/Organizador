"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || undefined, email, password }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "No se pudo registrar");
      return;
    }
    const sign = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (sign?.error) {
      setError("Cuenta creada, pero no se pudo iniciar sesión. Prueba en Iniciar sesión.");
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <div className="app-safe-x relative flex min-h-dvh items-center justify-center bg-slate-50 pb-8 pt-20 dark:bg-slate-950 sm:pt-12">
      <div className="absolute right-[max(1rem,env(safe-area-inset-right,0px))] top-[max(1rem,env(safe-area-inset-top,0px))] z-10">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Crear cuenta</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Guarda tus actividades de forma privada.
        </p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            label="Nombre (opcional)"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Correo"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Contraseña (mín. 8 caracteres)"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Creando…" : "Registrarme"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-teal-700 underline dark:text-teal-400">
            Entrar
          </Link>
        </p>
        <p className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-1 text-center text-xs text-slate-500 dark:text-slate-400">
          <Link href="/privacidad" className="underline hover:text-teal-700 dark:hover:text-teal-400">
            Privacidad
          </Link>
          <Link href="/terminos" className="underline hover:text-teal-700 dark:hover:text-teal-400">
            Términos
          </Link>
        </p>
      </Card>
    </div>
  );
}
