# Skill: producto Organizador

## Glosario

- **Item**: actividad o recordatorio del usuario (título, fecha límite opcional, descripción, checklist, recordatorios).
- **Reminder**: aviso asociado a un Item, definido por minutos antes de `dueAt` y hora de disparo UTC `fireAt`.
- **ChecklistItem**: subtarea con checkbox y orden.
- **Tag**: etiqueta opcional por usuario; un Item puede tener varias (fase opcional).

## MVP (v1)

- Registro e inicio de sesión.
- CRUD de Items propios del usuario.
- `dueAt` opcional, `allDay`, `timezone` por ítem.
- Varios recordatorios por ítem (offsets en minutos); envío por email cuando esté configurado Resend.
- Descripción (texto) y checklist.
- Filtros: próximos, vencidos, sin fecha, archivados.
- Completar y archivar ítem.

## Post-MVP en producto (implementado en código)

- **Calendario mensual** (columna en `/dashboard`, ~**1/4** del ancho en escritorio, lista ~**3/4**; modo `dense`): grilla con **un punto** por día con actividades; color = etiqueta con **`Tag.createdAt` más antiguo** entre las presentes ese día; **`+N`** = actividades adicionales (`N = total − 1`). Hover: títulos. Clic: panel con detalle. Bloque **sin fecha** con enlaces y acceso al filtro lista. Navegación mes / **Hoy**. Parámetros `calYear` / `calMonth` conservan el mes al filtrar o buscar. Ruta `/dashboard/calendar` redirige al tablero. Cada ítem se ubica en el día según `dueAt` + `Item.timezone` (día civil).
- **Búsqueda** en lista: texto en título y descripción; **filtro por etiqueta**.
- **Reprogramar**: botones que mueven `dueAt` (+1 h, mañana, +7 días) y recalculan recordatorios no enviados.

## Fuera de v1 (no-go explícito)

- App nativa / Capacitor (evaluar en fase posterior).
- Compartir listas entre usuarios.
- Sincronización calendario externo (Google/ICS).

## Adjuntos en notas (post-MVP)

- Imágenes, audio y video incrustados en el cuerpo de **NotePage** vía editor enriquecido; archivos en disco bajo `data/note-uploads/` (despliegues serverless requieren almacenamiento objeto, p. ej. S3/Blob).
- Metadatos en modelo **NoteMedia**; solo el dueño puede subir y ver por sesión.

## Recurrencia (opcional implementada de forma simple)

- Campo `recurrenceRule`: `NONE` | `DAILY` | `WEEKLY` | `MONTHLY`. La lógica de “siguiente ocurrencia” puede ampliarse después; el MVP guarda el valor para filtros futuros.
