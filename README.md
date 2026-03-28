# Organizador

App Next.js (calendario, notas, recordatorios). Convenciones en [Agent.md](./Agent.md) y en `/skills`.

## Arranque local

1. Copiá `.env.example` a `.env` y completá variables (sobre todo `DATABASE_URL` y `AUTH_SECRET`).
2. `npx prisma migrate dev` (o el flujo de DB que uses).
3. `npm run dev` → [http://localhost:3000](http://localhost:3000)

**Prisma en Windows:** si `npx prisma generate` falla con `EPERM`, cerrá procesos Node (`npm run dev`, etc.) y volvé a ejecutar.

**Supabase / `P1001`:** comprobá que el proyecto no esté pausado, que `DATABASE_URL` use `postgresql://…` con contraseña correcta y `sslmode=require` si hace falta. Si tu red bloquea el puerto 5432, usá la URI de **connection pooling** desde el panel de Supabase.

**Web Push (Vercel):** `VAPID_PUBLIC_KEY` (clave pública larga), `VAPID_PRIVATE_KEY` (corta), `VAPID_SUBJECT` (ej. `mailto:…`). También se acepta `NEXT_PUBLIC_VAPID_PUBLIC_KEY` como respaldo de la pública. Tras cambiar variables en Vercel, hacé redeploy.

## Scripts útiles

Ver `package.json`: `typecheck`, `test`, `test:e2e`, `generate:pwa-icons`, `validate:pwa`, etc.
