import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const manifestPath = join(root, "public", "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const required = ["name", "short_name", "start_url", "display", "icons"];
for (const k of required) {
  if (manifest[k] === undefined || manifest[k] === null) {
    console.error(`manifest.json falta campo: ${k}`);
    process.exit(1);
  }
}

if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
  console.error("manifest.json: icons debe ser un array no vacío");
  process.exit(1);
}

let has512 = false;
for (const icon of manifest.icons) {
  if (!icon.src) {
    console.error("manifest icon sin src");
    process.exit(1);
  }
  const rel = icon.src.startsWith("/") ? icon.src.slice(1) : icon.src;
  const abs = join(root, "public", rel);
  if (!existsSync(abs)) {
    console.error(`Falta archivo de icono: public/${rel}`);
    process.exit(1);
  }
  const sizes = String(icon.sizes || "");
  if (sizes.includes("512")) has512 = true;
}

if (!has512) {
  console.error("manifest: se requiere un icono con sizes que incluya 512 (p. ej. 512x512)");
  process.exit(1);
}

console.log("PWA manifest OK");
