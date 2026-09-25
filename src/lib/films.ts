import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export type FilmInfo = {
  frames: number;
  perClip: number;
  clips: number;
  /** width / height of a desktop frame */
  aspect: number;
  /** width / height of a phone frame (the cropped middle of the desktop one) */
  mobileAspect: number;
  /** phones get every n-th frame (keeps memory small); the page cross-fades between them */
  mobileStride: number;
  bg: string;
  /** changes whenever the frames are regenerated, so browsers never reuse stale ones */
  version: number;
};

/** Reads public/film/<name>/meta.json written by scripts/extract-frames.mjs. Null if not generated yet. */
export async function film(name: string): Promise<FilmInfo | null> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "public", "film", name, "meta.json"), "utf8");
    return JSON.parse(raw) as FilmInfo;
  } catch {
    return null;
  }
}
