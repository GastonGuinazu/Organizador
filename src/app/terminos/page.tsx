import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos — Organizador",
  description: "Condiciones de uso de Organizador.",
};

export default function TerminosPage() {
  return (
    <div className="app-safe-x mx-auto max-w-2xl py-12 text-slate-700 dark:text-slate-200">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Términos de uso</h1>
      <p className="mt-4 text-sm leading-relaxed">
        Al usar Organizador aceptás utilizar el servicio de forma lícita y respetar las leyes aplicables.
        El servicio se ofrece “tal cual”; conviene mantener copias de seguridad de la información
        importante.
      </p>
      <p className="mt-4 text-sm leading-relaxed">
        El titular del despliegue puede modificar o interrumpir el servicio; en entornos autohospedados
        sos vos quien define disponibilidad y mantenimiento.
      </p>
      <p className="mt-6">
        <Link href="/" className="text-teal-700 underline dark:text-teal-400">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
