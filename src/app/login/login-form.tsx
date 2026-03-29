"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    window.location.href = callbackUrl;
  }

  return (
    <div className="app-safe-x relative flex min-h-dvh items-center justify-center bg-slate-50 pb-8 pt-20 dark:bg-slate-950 sm:pt-12">
      <div className="absolute right-[max(1rem,env(safe-area-inset-right,0px))] top-[max(1rem,env(safe-area-inset-top,0px))] z-10">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Accede a tus actividades y recordatorios.
        </p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            label="Correo"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <PasswordField
            label="Contraseña"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          ¿No tienes cuenta?{" "}
          <a href="/register" className="font-medium text-teal-700 underline dark:text-teal-400">
            Regístrate
          </a>
        </p>
        <p className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-1 text-center text-xs text-slate-500 dark:text-slate-400">
          <a href="/privacidad" className="underline hover:text-teal-700 dark:hover:text-teal-400">
            Privacidad
          </a>
          <a href="/terminos" className="underline hover:text-teal-700 dark:hover:text-teal-400">
            Términos
          </a>
        </p>
      </Card>
    </div>
  );
}
