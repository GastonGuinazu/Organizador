# Organizador — blueprint del proyecto

## Visión

Aplicación web (PWA) para que cada usuario guarde **actividades importantes en el tiempo**, con **recordatorios anticipados**, **descripción** y **checklist** de subtareas. Enfoque en claridad, uso familiar y extensión gradual de features.

## Stack

- **Next.js 15** (App Router), **TypeScript**, **Tailwind CSS v4**, **Luxon** (calendario y reprogramar con zona horaria)
- **Prisma** + **SQLite** en desarrollo (`file:./dev.db`); en producción usar `DATABASE_URL` PostgreSQL
- **Auth.js (next-auth v5)** con proveedor **Credentials** (email + contraseña)
- **Resend** para emails de recordatorio (opcional si faltan API keys)
- **Notas**: cuerpo HTML + medios (imagen/audio/video) subidos por API; archivos locales en `data/note-uploads/` en desarrollo
- Cron: ruta `GET /api/cron/reminders` con header `Authorization: Bearer CRON_SECRET` (en Vercel, definir `CRON_SECRET` y usar [Cron Jobs](https://vercel.com/docs/cron-jobs); ver [vercel.json](vercel.json))

## Estructura de carpetas

- `src/app/` — rutas y layouts
- `src/app/api/` — API REST
- `src/lib/` — prisma, auth, utilidades
- `src/components/` — UI reutilizable
- `skills/` — documentación para agentes (producto, API, UI, DB)
- `prisma/schema.prisma` — fuente de verdad del modelo de datos

## Reglas para PRs y agentes

- No refactors colaterales; cada cambio debe servir al ticket actual.
- Multi-tenancy: toda lectura/escritura de ítems filtra por `userId` de la sesión.
- Consultar `skills/skill-product.md` para alcance MVP y glosario.

## Skills

| Archivo | Uso |
|---------|-----|
| [skills/skill-product.md](skills/skill-product.md) | Alcance, no-go, glosario |
| [skills/skill-api.md](skills/skill-api.md) | Convenciones REST y errores |
| [skills/skill-ui-design.md](skills/skill-ui-design.md) | UX family-friendly |
| [skills/skill-db.md](skills/skill-db.md) | Esquema y migraciones |
