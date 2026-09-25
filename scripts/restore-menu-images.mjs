// Re-encode every original dish photo in assets-src/menu that isn't yet in public/menu.
// Usage: node scripts/restore-menu-images.mjs
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const src = path.join(root, "assets-src", "menu");
const out = path.join(root, "public", "menu");
const have = new Set(fs.readdirSync(out).map((f) => f.replace(/\.webp$/, "")));

let n = 0;
for (const f of fs.readdirSync(src)) {
  const id = f.replace(/\.png$/, "");
  if (have.has(id)) continue;
  await sharp(path.join(src, f)).resize(768, 768, { fit: "inside" }).webp({ quality: 80, alphaQuality: 90 }).toFile(path.join(out, `${id}.webp`));
  n++;
}
console.log(`restored ${n} images · ${fs.readdirSync(out).length} total in public/menu`);
