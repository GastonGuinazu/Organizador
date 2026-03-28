# Organizador ? blueprint del proyecto

## Visi?n

Aplicaci?n web (PWA) para que cada usuario guarde **actividades importantes en el tiempo**, con **recordatorios anticipados**, **descripci?n** y **checklist** de subtareas. Enfoque en claridad, uso familiar y extensi?n gradual de features.

## Stack

- **Next.js 15** (App Router), **TypeScript**, **Tailwind CSS v4**, **Luxon** (calendario y reprogramar con zona horaria)
- **Prisma** + **SQLite** en desarrollo (`file:./dev.db`); en producci?n usar `DATABASE_URL` PostgreSQL
- **Auth.js (next-auth v5)** con proveedor **Credentials** (email + contrase?a)
- **Resend** para emails de recordatorio (opcional si faltan API keys)
- **Notas**: cuerpo HTML + medios (imagen/audio/video) subidos por API; archivos locales en `data/note-uploads/` en desarrollo
- Cron: ruta `GET /api/cron/reminders` con header `Authorization: Bearer CRON_SECRET` (en Vercel, definir `CRON_SECRET` y usar [Cron Jobs](https://vercel.com/docs/cron-jobs); ver [vercel.json](vercel.json); prueba local `npm run cron:reminders`). Checklist producción (VAPID, cron, push): [skills/skill-deploy-capacitor.md](skills/skill-deploy-capacitor.md#checklist-recordatorios-por-correo-cron-y-push).
- **Capacitor 8** (`android/`, `ios/`): `webDir` en `capacitor-www/`; para builds de tienda definir `CAPACITOR_SERVER_URL` (HTTPS de producci?n) y `npm run cap:sync`. Plugin `@capacitor/network`. Detalle en [skills/skill-deploy-capacitor.md](skills/skill-deploy-capacitor.md).
- **Offline parcial**: IndexedDB con Dexie (`src/lib/offline-db.ts`), `GET /api/dashboard-data`, cach? de notas y banner sin conexi?n. Cola outbox para escritura offline: pendiente.

## Despliegue: web vs tiendas

| Qu? cambia | Vercel (push al repo) | Google Play / App Store |
|------------|------------------------|-------------------------|
| C?digo Next.js, API routes, UI servida desde tu dominio | Se actualiza con cada deploy autom?tico | No hace falta nuevo binario si la app nativa abre esa URL (`CAPACITOR_SERVER_URL`) |
| Proyecto `android/`, `ios/`, plugins nativos, permisos, iconos, `appId` | No modifica apps ya publicadas | Nuevo build firmado + subida de versi?n en la consola de cada tienda |

- Los **datos de usuario** viven en PostgreSQL (`DATABASE_URL`); commits y deploys **no** borran la base salvo migraciones destructivas o cambio de URL de base.
- M?s detalle operativo: [skills/skill-deploy-capacitor.md](skills/skill-deploy-capacitor.md).

## Estructura de carpetas

- `src/app/` ? rutas y layouts
- `src/app/api/` ? API REST
- `src/lib/` ? prisma, auth, utilidades
- `src/components/` ? UI reutilizable
- `skills/` ? documentaci?n para agentes (producto, API, UI, DB, despliegue)
- `prisma/schema.prisma` ? fuente de verdad del modelo de datos
- `capacitor-www/` ? assets m?nimos para Capacitor (`index.html`); la app en tiendas carga la web desde la URL de producci?n si est? configurada

## Reglas para PRs y agentes

- No refactors colaterales; cada cambio debe servir al ticket actual.
- Multi-tenancy: toda lectura/escritura de ?tems filtra por `userId` de la sesi?n.
- Consultar `skills/skill-product.md` para alcance MVP y glosario.
- Cambios que afecten **app nativa o publicaci?n en tiendas**: consultar `skills/skill-deploy-capacitor.md`.

## Skills

| Archivo | Uso |
|---------|-----|
| [skills/skill-product.md](skills/skill-product.md) | Alcance, no-go, glosario |
| [skills/skill-api.md](skills/skill-api.md) | Convenciones REST y errores |
| [skills/skill-ui-design.md](skills/skill-ui-design.md) | UX family-friendly |
| [skills/skill-db.md](skills/skill-db.md) | Esquema y migraciones |
| [skills/skill-deploy-capacitor.md](skills/skill-deploy-capacitor.md) | Vercel, Capacitor, Play Store, App Store |
