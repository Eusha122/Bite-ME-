import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export type FilmInfo = { frames: number; perClip: number; clips: number; aspect: number; bg: string };

/** Reads public/film/<name>/meta.json written by scripts/extract-frames.mjs. Null if not generated yet. */
export async function film(name: string): Promise<FilmInfo | null> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "public", "film", name, "meta.json"), "utf8");
    return JSON.parse(raw) as FilmInfo;
  } catch {
    return null;
  }
}
