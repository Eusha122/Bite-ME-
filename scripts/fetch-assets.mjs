// Usage: node scripts/fetch-assets.mjs <kind> <name>=<url> [<name>=<url> ...]
//   kind = menu      → public/menu/<name>.webp   (768px, alpha kept)
//   kind = backdrop  → public/backdrops/<name>.jpg (+ <name>-sm.jpg for phones)
//   kind = model     → public/models/<name>.glb  (raw; run optimise step separately)
// Originals are kept in assets-src/ so they can be re-processed later.
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [kind, ...pairs] = process.argv.slice(2);
const root = path.resolve(import.meta.dirname, "..");
const srcDir = path.join(root, "assets-src", kind);
await fs.mkdir(srcDir, { recursive: true });

for (const pair of pairs) {
  const eq = pair.indexOf("=");
  const name = pair.slice(0, eq);
  const url = pair.slice(eq + 1);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`✗ ${name}: HTTP ${res.status}`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = kind === "model" ? ".glb" : ".png";
  await fs.writeFile(path.join(srcDir, name + ext), buf);

  if (kind === "menu") {
    const out = path.join(root, "public", "menu", `${name}.webp`);
    await sharp(buf).resize(768, 768, { fit: "inside" }).webp({ quality: 82, alphaQuality: 90 }).toFile(out);
  } else if (kind === "backdrop") {
    const dir = path.join(root, "public", "backdrops");
    await sharp(buf).resize(2048, null, { withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(dir, `${name}.jpg`));
    await sharp(buf).resize(1024, null).jpeg({ quality: 72, mozjpeg: true }).toFile(path.join(dir, `${name}-sm.jpg`));
  } else if (kind === "model") {
    await fs.writeFile(path.join(root, "public", "models", `${name}.glb`), buf);
  }
  console.log(`✓ ${name}`);
}
