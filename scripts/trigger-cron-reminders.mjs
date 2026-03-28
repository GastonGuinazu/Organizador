/**
 * Dispara GET /api/cron/reminders con CRON_SECRET (útil para prueba E2E en local o contra una URL desplegada).
 * Lee .env.local y luego .env desde la raíz del repo (no sobrescribe variables ya definidas en el proceso).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(name) {
  const p = resolve(process.cwd(), name);
  if (!existsSync(p)) return;
  const text = readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const secret = process.env.CRON_SECRET?.trim();
const base = (process.env.CRON_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

if (!secret) {
  console.error("Falta CRON_SECRET en .env o .env.local");
  process.exit(1);
}

const url = `${base}/api/cron/reminders`;
const res = await fetch(url, {
  headers: { Authorization: `Bearer ${secret}` },
});

const text = await res.text();
let pretty = text;
try {
  pretty = JSON.stringify(JSON.parse(text), null, 2);
} catch {
  /* keep raw */
}

console.log(`${res.status} ${res.statusText}`);
console.log(pretty);
process.exit(res.ok ? 0 : 1);
