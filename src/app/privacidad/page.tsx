import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacidad — Organizador",
  description: "Información sobre el tratamiento de datos en Organizador.",
};

export default function PrivacidadPage() {
  return (
    <div className="app-safe-x mx-auto max-w-2xl py-12 text-slate-700 dark:text-slate-200">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Privacidad</h1>
      <p className="mt-4 text-sm leading-relaxed">
        Organizador almacena los datos de tu cuenta (correo, nombre opcional y contraseña cifrada) y el
        contenido que creás (actividades, notas, archivos asociados a notas). Los datos se asocian a tu
        usuario y no se comparten con otros usuarios de la aplicación.
      </p>
      <p className="mt-4 text-sm leading-relaxed">
        Si usás recordatorios por correo, el envío se hace a través del proveedor de email configurado en
        el servidor. Si activás notificaciones en el navegador, se guarda una suscripción técnica en el
        servidor para poder enviarte avisos.
      </p>
      <p className="mt-4 text-sm leading-relaxed">
        Para ejercer derechos de acceso, rectificación o supresión, contactá al responsable del servicio
        (el correo de soporte que definas en tu despliegue). Podés eliminar tu cuenta si la aplicación
        ofrece esa opción en el futuro; mientras tanto, solicitá la baja por el mismo canal.
      </p>
      <p className="mt-6">
        <Link href="/" className="text-teal-700 underline dark:text-teal-400">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
