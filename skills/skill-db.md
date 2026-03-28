# Skill: base de datos

## Fuente de verdad

- [prisma/schema.prisma](../prisma/schema.prisma)

## Reglas

- Tiempos: guardar `dueAt` y `fireAt` en **UTC** (`DateTime` Prisma).
- `Item.timezone`: IANA string (ej. `America/Argentina/Buenos_Aires`) para interpretar `allDay` en UI.
- Migraciones: `npx prisma migrate dev` en desarrollo; no editar SQL a mano salvo migraciones custom documentadas.

## Tag

- `Tag.createdAt`: define el orden “etiqueta creada primero” (p. ej. color del punto en el calendario).

## Relaciones

- `User` 1—N `Item`, `Tag`, `NotePage`, `NotificationEvent`, `PushSubscription`
- `Item` 1—N `Reminder`, `ChecklistItem`
- `Item` N—N `Tag` vía `ItemTag`
- `NotePage` jerárquico: `parentId` opcional (raíz); `onDelete: Cascade` elimina subpáginas al borrar el padre

## NotePage

- `title`, `body` (texto; Markdown opcional en UI), `sortOrder` entre hermanos (`parentId` + `userId`).
- Índice `@@index([userId, parentId, sortOrder])` para listar hijos ordenados.

## NoteMedia

- Archivo asociado a una **NotePage** (`notePageId`, `onDelete: Cascade`), propiedad `userId`.
- Binario en `data/note-uploads/{userId}/{id}`; `mimeType` y `sizeBytes` en fila. El HTML de la nota referencia `/api/note-media/{id}`.

## Recordatorios

- Al crear/actualizar un Item con `dueAt`, recalcular `Reminder.fireAt = dueAt - offsetMinutes`.
- Si no hay `dueAt`, los reminders no tienen `fireAt` válido: no programar envío hasta que exista fecha.

## Preferencias y avisos

- `User.reminderEmailEnabled` (default `true`): si es `false`, el cron no intenta enviar correo por ese usuario; igual crea `NotificationEvent` y marca `Reminder.sentAt`.
- `NotificationEvent`: historial in-app por recordatorio procesado (`channel` típico `reminder`).
- `PushSubscription`: endpoint + claves por usuario/dispositivo para Web Push (VAPID en servidor: `VAPID_PUBLIC_KEY` o `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, más `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT`).
