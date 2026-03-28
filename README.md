# Organizador

App Next.js (calendario, notas, recordatorios). Convenciones en [Agent.md](./Agent.md) y en `/skills`.

## Arranque local

1. Copiá `.env.example` a `.env` y completá variables (sobre todo `DATABASE_URL` y `AUTH_SECRET`).
2. `npx prisma migrate deploy` (base nueva en Supabase) o `npx prisma migrate dev` en desarrollo.
3. `npm run dev` → [http://localhost:3000](http://localhost:3000)

**Prisma en Windows:** si `npx prisma generate` falla con `EPERM`, cerrá procesos Node (`npm run dev`, etc.) y volvé a ejecutar.

**Supabase / `P1001` (“Can't reach database server …:5432”):** el PC no abre TCP a ese host (firewall, ISP, IPv6, etc.). En el panel de Supabase comprobá que el proyecto no esté pausado y la contraseña sea la de la base. Si **solo falla en local** y en Vercel anda, cambiá en tu `.env` la `DATABASE_URL` por la de **Connection pooling** (puerto **6543**, usuario tipo `postgres.PROJECT_REF`, query `pgbouncer=true`); copiala tal cual de **Database → Connection string**. Para `prisma migrate dev` a veces hace falta además la URI directa; si migrás solo en CI/Vercel, puede alcanzar con el pooler en local para desarrollar.

**Web Push (Vercel):** `VAPID_PUBLIC_KEY` (clave pública larga), `VAPID_PRIVATE_KEY` (corta), `VAPID_SUBJECT` (ej. `mailto:…`). También se acepta `NEXT_PUBLIC_VAPID_PUBLIC_KEY` como respaldo de la pública. Tras cambiar variables en Vercel, hacé redeploy.

**Vercel / Supabase:** definí `DATABASE_URL` (pooler si querés) y **`DIRECT_URL`** (conexión directa `db.*.supabase.co:5432`) para que Prisma Migrate y el cliente se inicialicen bien. Si no existe `DIRECT_URL`, fallará al arrancar.

## Scripts útiles

Ver `package.json`: `typecheck`, `test`, `test:e2e`, `generate:pwa-icons`, `validate:pwa`, etc.

**E2E:** Playwright usa `PLAYWRIGHT_DATABASE_URL` o `DATABASE_URL`. Por defecto asume Postgres en `127.0.0.1:5432` (`organizador_e2e`); creá esa DB o definí la variable.
