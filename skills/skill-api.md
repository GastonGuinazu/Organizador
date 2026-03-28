# Skill: API Organizador

## Autenticación

- Sesión vía cookie (Auth.js). Las rutas API deben usar `auth()` y rechazar si no hay sesión (excepto auth público y cron).

## Convenciones REST

- JSON con `Content-Type: application/json`.
- IDs: strings `cuid`.
- Errores: `{ "error": string }` y códigos HTTP apropiados (400, 401, 403, 404, 500).

## Rutas

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/register` | Crear usuario (email, password, name opcional) |
| GET/POST | `/api/auth/*` | Auth.js |
| GET | `/api/items` | Lista items del usuario (`?filter=upcoming\|overdue\|nodate\|archived\|all`) |
| POST | `/api/items` | Crear item (+ reminders, checklist opcional) |
| GET | `/api/items/[id]` | Detalle |
| PATCH | `/api/items/[id]` | Actualizar |
| DELETE | `/api/items/[id]` | Eliminar |
| GET | `/api/tags` | Listar etiquetas del usuario |
| POST | `/api/tags` | Crear etiqueta |
| GET | `/api/note-pages` | Árbol (`{ tree }`); con `?q=` texto opcional añade `matches` (título/cuerpo, máx. 25) |
| POST | `/api/note-pages/[id]/media` | Subir archivo (`multipart/form-data`, campo `file`); respuesta `{ id, url, kind }` |
| GET | `/api/note-media/[id]` | Descargar o ver medio de una nota (misma sesión, dueño) |
| POST | `/api/note-pages` | Crear página (`title`, `parentId` opcional, `sortOrder` opcional) |
| GET | `/api/note-pages/[id]` | Detalle de una página |
| PATCH | `/api/note-pages/[id]` | Actualizar título, cuerpo, `parentId`, `sortOrder` |
| DELETE | `/api/note-pages/[id]` | Eliminar página (cascade a subpáginas) |
| GET | `/api/cron/reminders` | Procesar recordatorios pendientes; header `Authorization: Bearer CRON_SECRET` (respuesta incluye `pushSent` / `pushFailed`) |
| PATCH | `/api/user/settings` | Preferencias: `reminderEmailEnabled`, `notificationEmail` (vacío = usar correo de cuenta), `notificationPhone` |
| PATCH | `/api/user/password` | Cambiar contraseña (`currentPassword`, `newPassword`, mín. 8) |
| GET | `/api/notifications` | Lista avisos (`?limit=`); respuesta `{ items, unreadCount }` |
| PATCH | `/api/notifications` | Marcar leídas: `{ ids: string[] }` o `{ markAllRead: true }` |
| GET | `/api/push/vapid-key` | Clave pública VAPID si el servidor tiene push configurado (`VAPID_PUBLIC_KEY` o respaldo `NEXT_PUBLIC_VAPID_PUBLIC_KEY`) |
| POST | `/api/push/subscribe` | Guardar suscripción push (`endpoint`, `keys.p256dh`, `keys.auth`) |
| DELETE | `/api/push/subscribe` | Quitar suscripción: cuerpo `{ endpoint }` o `?all=1` para todas |
| POST | `/api/push/test` | Solo `NODE_ENV=development`: push de prueba al usuario en sesión; requiere VAPID y suscripciones guardadas |

## Paginación (futuro)

- Por ahora sin paginación; añadir `cursor` cuando haya muchos ítems.
