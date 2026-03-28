import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3001";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

/** DB del servidor de prueba: Postgres (mismo motor que prod). En CI usa DATABASE_URL del workflow. */
const e2eDb =
  process.env.PLAYWRIGHT_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/organizador_e2e";

const e2eDirectDb =
  process.env.PLAYWRIGHT_DIRECT_URL ?? process.env.DIRECT_URL ?? e2eDb;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        baseURL,
      },
    },
  ],
  webServer: {
    command: "npx prisma migrate deploy && npm run start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      PORT: port,
      DATABASE_URL: e2eDb,
      DIRECT_URL: e2eDirectDb,
    },
  },
});
