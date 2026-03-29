import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="app-safe-x relative flex min-h-dvh flex-col items-center justify-center gap-8 bg-slate-50 px-4 pb-10 pt-20 text-center dark:bg-slate-950 sm:pt-12">
      <div className="absolute right-[max(1rem,env(safe-area-inset-right,0px))] top-[max(1rem,env(safe-area-inset-top,0px))] z-10">
        <ThemeToggle />
      </div>
      <div className="max-w-lg space-y-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Organizador</h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Guarda lo que importa, con fecha, recordatorios y listas para ir tachando pasos.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Puedes instalar la app en tu teléfono desde el navegador (PWA) cuando quieras tener el acceso a mano.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <a
          href="/register"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-600 px-6 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          Crear cuenta
        </a>
        <a
          href="/login"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-6 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Ya tengo cuenta
        </a>
      </div>
      <footer className="mt-auto flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/privacidad" className="underline hover:text-teal-700 dark:hover:text-teal-400">
          Privacidad
        </Link>
        <Link href="/terminos" className="underline hover:text-teal-700 dark:hover:text-teal-400">
          Términos
        </Link>
      </footer>
    </div>
  );
}
