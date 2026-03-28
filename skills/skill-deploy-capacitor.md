# Skill: despliegue web, Vercel y apps en tiendas (Capacitor)

Documentación para agentes y mantenimiento: qué se actualiza con un push y cuándo hace falta volver a publicar en Google Play o Apple App Store.

## Web en Vercel

- Con el repositorio conectado a Vercel, un **push** al branch de producción (p. ej. `main`) dispara un **nuevo deploy**.
- La URL de producción (p. ej. `https://tu-proyecto.vercel.app` o dominio custom) sirve la app Next.js; los usuarios web obtienen la versión nueva al recargar o al navegar.

### Checklist: recordatorios por correo, cron y push

Después de validar push con la prueba en desarrollo, en **producción** conviene seguir este orden (acciones en dashboard o navegador, no en el código):

1. **Variables en Vercel (Settings → Environment Variables)**  
   - `CRON_SECRET`: mismo valor que usará el Cron de Vercel (cabecera `Authorization: Bearer …`).  
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`: mismas tres que en local; sin ellas no hay suscripción push ni envío.  
   - Opcional: email de recordatorios `RESEND_API_KEY`, `EMAIL_FROM` (ver `.env.example`).  
   Tras cambiar variables, hacer **Redeploy** del último deployment para que el runtime las cargue.

2. **Push en el dominio HTTPS de producción**  
   Las suscripciones Web Push dependen del **origen** (`localhost` ≠ producción). Cada usuario debe entrar en **Ajustes** en la URL de producción y pulsar **Activar en este dispositivo** (permisos del navegador).

3. **Prueba E2E cron + push (o solo correo)**  
   - Crear una actividad con recordatorio cuyo `fireAt` ya haya pasado (respecto de la hora del servidor).  
   - Disparar el cron: en local, `npm run cron:reminders` (lee `CRON_SECRET` desde `.env` / `.env.local`). Contra producción: `CRON_BASE_URL=https://tu-dominio.vercel.app npm run cron:reminders`.  
   - Revisar en la respuesta JSON `processed`, `pushSent`, `pushFailed`.

4. **Frecuencia del cron en Vercel**  
   En [vercel.json](../vercel.json) el schedule actual procesa recordatorios **cada 15 minutos** (`*/15 * * * *`). Los avisos no son instantáneos: solo corren cuando se ejecuta esa ruta. Si el plan de Vercel impone límites o querés menos invocaciones, se puede pasar a algo más laxo (p. ej. cada hora `0 * * * *` o una vez al día). Ajustar según coste y expectativa del producto.

## App en Play Store y App Store (Capacitor)

El proyecto incluye Capacitor 8 con carpetas `android/` e `ios/`. La configuración relevante está en `capacitor.config.ts` en la raíz del repo.

### Estrategia actual: WebView con URL remota

- Si en el entorno de build nativo se define **`CAPACITOR_SERVER_URL`** con la **URL HTTPS de producción** (la misma que Vercel o tu hosting), la app instalada **carga el sitio remoto** dentro de la WebView.
- **Ventaja**: la mayoría de cambios (páginas, API, estilos, lógica servida por el servidor) llegan a los usuarios **sin** subir un APK/AAB/IPA nuevo: basta el deploy en Vercel (u otro hosting equivalente).
- **Importante**: el binario en la tienda **no se sustituye solo**; simplemente muchas actualizaciones **no requieren** nuevo binario mientras la URL siga siendo la correcta.

### Cuándo sí hay que generar un nuevo build y enviarlo a las tiendas

Hace falta incrementar versión en la tienda y pasar revisión cuando cambie algo del **contenedor nativo**, por ejemplo:

- Dependencias o versión de **Capacitor** o **plugins nativos** (`@capacitor/network`, cámara, etc.).
- Cambios en **Android** (`AndroidManifest`, Gradle, permisos, firma) o **iOS** (Info.plist, capacidades, firma, Swift).
- **Iconos**, **splash**, nombre visible del paquete, **bundle ID** / **applicationId**, u otros metadatos que solo viven en el proyecto nativo.
- Decisión de **empaquetar** el front estático dentro del APK/IPA en lugar de URL remota (no es el enfoque actual).

Flujo típico tras cambios nativos:

1. `npm run cap:sync`
2. Abrir el proyecto en Android Studio / Xcode (`npm run cap:open:android` / `npm run cap:open:ios`).
3. Generar **release** firmado (AAB para Play, archivo para App Store / TestFlight).
4. Subir en **Google Play Console** o **App Store Connect** y completar el proceso de revisión.

### Comandos npm del repo

- `npm run cap:sync` — copia `capacitor-www/` y config a `android/` e `ios/`.
- `npm run cap:open:android` / `npm run cap:open:ios` — abre el IDE nativo.

### Variables de entorno

- **`CAPACITOR_SERVER_URL`**: URL base HTTPS de la app en producción (sin barra final problemática; debe coincidir con cookies/sesión si usáis el mismo dominio). Se lee al ejecutar `cap sync` para inyectar `server.url` en la config nativa.
- En **local**, si no está definida, la app nativa puede usar solo el contenido de `capacitor-www/` (placeholder); para probar contra el dev server suele usarse algo como `http://IP-local:3000` con `cleartext` habilitado solo en desarrollo (ver comentarios en `capacitor.config.ts`).

## Datos y base de datos

- Los datos de usuario están en **PostgreSQL** vía `DATABASE_URL`. Un push o un deploy de Vercel **no** elimina datos por sí solo.
- Riesgos habituales: apuntar producción a otra base vacía, migraciones Prisma destructivas, o borrar datos en consola del proveedor. Ver también `skills/skill-db.md`.

## Offline y PWA

- Caché en cliente: `src/lib/offline-db.ts` (Dexie). No sustituye al deploy del servidor.
- El service worker en `public/sw.js` no cachea navegación RSC por decisión documentada en ese archivo; el offline útil depende de la caché IndexedDB y de tener sesión/datos previos.

## Referencias en código

- [capacitor.config.ts](../capacitor.config.ts)
- [capacitor-www/index.html](../capacitor-www/index.html)
- [package.json](../package.json) — scripts `cap:*`
