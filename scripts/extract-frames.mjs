// Turn one or more film clips into a single scroll-scrubbable image sequence.
// Usage: node scripts/extract-frames.mjs <name> <framesPerClip> <clip1.mp4> [clip2.mp4 ...]
//   → public/film/<name>/d/000.webp  (desktop, 1440px wide)
//   → public/film/<name>/m/000.webp  (phones: the middle MOBILE_CROP of a 1600px frame, full detail)
//   → public/film/<name>/meta.json   { frames, perClip, clips, aspect, mobileAspect, bg, version }
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
// Phones only ever see the middle of the frame (the sides are cropped off on screen), so their frames
// are cropped to that middle and keep full resolution there — much sharper than shrinking the whole frame.
const Q_M = Number(process.env.FRAME_QM ?? Q_D);
const MOBILE_CROP = Number(process.env.MOBILE_CROP ?? 0.6); // fraction of the frame width phones keep
const MASTER_WIDTH = 1600; // intermediate frames; desktop is resized to 1440 from these, phones are cropped from them
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
  const r = spawnSync(ffmpeg, ["-y", "-i", clip, "-vf", `fps=${(PER / duration).toFixed(6)},scale=${MASTER_WIDTH}:-2:flags=lanczos`, "-frames:v", String(PER), path.join(dir, "%03d.png")], { encoding: "utf8" });
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
let mobileAspect = aspect * MOBILE_CROP;
for (const [i, src] of pngs.entries()) {
  const id = String(i).padStart(3, "0");
  const graded = await sharp(src).linear(gain, [0, 0, 0]).toBuffer();
  const d = await sharp(graded).resize(1440).webp({ quality: Q_D, effort: 6 }).toFile(path.join(out, "d", `${id}.webp`));
  const full = await sharp(graded).metadata();
  const cropW = Math.round((full.width * MOBILE_CROP) / 2) * 2;
  const m = await sharp(graded)
    .extract({ left: Math.round((full.width - cropW) / 2), top: 0, width: cropW, height: full.height })
    .webp({ quality: Q_M, effort: 6 })
    .toFile(path.join(out, "m", `${id}.webp`));
  bytesD += d.size;
  bytesM += m.size;
  aspect = d.width / d.height;
  mobileAspect = m.width / m.height;
}

await fs.writeFile(path.join(out, "meta.json"), JSON.stringify({ frames: pngs.length, perClip: PER, clips: clips.length, aspect, mobileAspect, bg, version: Date.now() }, null, 2));
await fs.rm(tmp, { recursive: true, force: true });
console.log(`✓ ${name}: ${pngs.length} frames from ${clips.length} clip(s) · desktop ${(bytesD / 1e6).toFixed(1)} MB · mobile ${(bytesM / 1e6).toFixed(1)} MB · bg graded to ${bg} (gain ${gain.map((g) => g.toFixed(3)).join("/")})`);
