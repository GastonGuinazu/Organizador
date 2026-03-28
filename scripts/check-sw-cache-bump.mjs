import { execSync } from "node:child_process";

const base = process.env.PR_BASE_SHA;
const head = process.env.PR_HEAD_SHA;

if (!base || !head) {
  console.log("check-sw-cache-bump: omitido (definí PR_BASE_SHA y PR_HEAD_SHA en CI para PRs)");
  process.exit(0);
}

function cacheAt(ref) {
  try {
    const txt = execSync(`git show ${ref}:public/sw.js`, { encoding: "utf8" });
    const m = txt.match(/const CACHE = "([^"]+)"/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

const names = execSync(`git diff --name-only ${base} ${head}`, { encoding: "utf8" })
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean);

if (!names.includes("public/sw.js")) {
  process.exit(0);
}

const oldC = cacheAt(base);
const newC = cacheAt(head);

if (oldC === newC) {
  console.error(
    "public/sw.js cambió en el PR pero la constante CACHE no (sigue siendo",
    JSON.stringify(oldC),
    "). Subí la versión del caché para que los clientes actualicen el service worker.",
  );
  process.exit(1);
}

console.log("check-sw-cache-bump: CACHE actualizado", oldC, "->", newC);
