import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

mkdirSync(publicDir, { recursive: true });

const color = { r: 13, g: 148, b: 136 };

for (const size of [192, 512]) {
  const out = join(publicDir, `icon-${size}.png`);
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: color,
    },
  })
    .png()
    .toFile(out);
  console.log("Wrote", out);
}
