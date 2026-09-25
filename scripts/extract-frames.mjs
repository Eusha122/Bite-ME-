// Turn one or more film clips into a single scroll-scrubbable image sequence.
// Usage: node scripts/extract-frames.mjs <name> <framesPerClip> <clip1.mp4> [clip2.mp4 ...]
//   → public/film/<name>/d/000.webp  (desktop, 1440px wide)
//   → public/film/<name>/m/000.webp  (phones, 900px wide)
//   → public/film/<name>/meta.json   { frames, perClip, clips, aspect, bg }
// Clips are concatenated in order, so chained clips (end frame = next start frame) play as one film.
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ffmpeg from "ffmpeg-static";
import sharp from "sharp";

const [name, perClipArg, ...clips] = process.argv.slice(2);
if (!name || !perClipArg || !clips.length) {
  console.error("usage: node scripts/extract-frames.mjs <name> <framesPerClip> <clip.mp4...>");
  process.exit(1);
}
const PER = Number(perClipArg);
// per-film overrides for heavily textured films, e.g. FRAME_Q=58 node scripts/extract-frames.mjs ...
const Q_D = Number(process.env.FRAME_Q ?? 70);
const Q_M = Number(process.env.FRAME_QM ?? Q_D - 4);
const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "public", "film", name);
const tmp = await fs.mkdtemp(path.join(os.tmpdir(), `frames-${name}-`));

const pngs = [];
for (const [c, clip] of clips.entries()) {
  const probe = spawnSync(ffmpeg, ["-i", clip], { encoding: "utf8" });
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(probe.stderr);
  if (!m) throw new Error(`could not read duration of ${clip}`);
  const duration = +m[1] * 3600 + +m[2] * 60 + +m[3];
  const dir = path.join(tmp, String(c));
  await fs.mkdir(dir);
  // evenly sample PER frames across the clip, lanczos-scaled, lossless intermediates
  const r = spawnSync(ffmpeg, ["-y", "-i", clip, "-vf", `fps=${(PER / duration).toFixed(6)},scale=1440:-2:flags=lanczos`, "-frames:v", String(PER), path.join(dir, "%03d.png")], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr.slice(-800));
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".png")).sort();
  pngs.push(...files.map((f) => path.join(dir, f)));
}

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(path.join(out, "d"), { recursive: true });
await fs.mkdir(path.join(out, "m"), { recursive: true });

// The background baked into this film (per-channel median of the first frame's corners)…
const { data, info } = await sharp(pngs[0]).raw().toBuffer({ resolveWithObject: true });
const px = (x, y) => {
  const i = (y * info.width + x) * info.channels;
  return [data[i], data[i + 1], data[i + 2]];
};
const corners = [px(8, 8), px(info.width - 8, 8), px(8, info.height - 8), px(info.width - 8, info.height - 8)];
const baked = [0, 1, 2].map((k) => corners.map((c) => c[k]).sort((a, b) => a - b)[1]);
// …is nudged onto the page colour with a tiny per-channel gain, so every film sits on the exact same cream.
const TARGET = process.env.FILM_BG ?? "#f0e4d2";
const target = [1, 3, 5].map((o) => parseInt(TARGET.slice(o, o + 2), 16));
const gain = baked.map((b, k) => target[k] / Math.max(1, b));
const bg = TARGET;

let bytesD = 0;
let bytesM = 0;
let aspect = 16 / 9;
for (const [i, src] of pngs.entries()) {
  const id = String(i).padStart(3, "0");
  const graded = await sharp(src).linear(gain, [0, 0, 0]).toBuffer();
  const d = await sharp(graded).webp({ quality: Q_D, effort: 6 }).toFile(path.join(out, "d", `${id}.webp`));
  const m = await sharp(graded).resize(900).webp({ quality: Q_M, effort: 6 }).toFile(path.join(out, "m", `${id}.webp`));
  bytesD += d.size;
  bytesM += m.size;
  aspect = d.width / d.height;
}

await fs.writeFile(path.join(out, "meta.json"), JSON.stringify({ frames: pngs.length, perClip: PER, clips: clips.length, aspect, bg }, null, 2));
await fs.rm(tmp, { recursive: true, force: true });
console.log(`✓ ${name}: ${pngs.length} frames from ${clips.length} clip(s) · desktop ${(bytesD / 1e6).toFixed(1)} MB · mobile ${(bytesM / 1e6).toFixed(1)} MB · bg graded to ${bg} (gain ${gain.map((g) => g.toFixed(3)).join("/")})`);
