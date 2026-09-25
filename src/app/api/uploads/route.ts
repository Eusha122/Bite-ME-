import { NextResponse, type NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { isStaff } from "@/lib/staff";

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Staff: upload a dish photo. Whatever is sent is decoded and re-encoded as a 900px WebP,
 * so only real images get through and every photo is web-sized.
 */
export async function POST(req: NextRequest) {
  if (!(await isStaff())) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "That photo is over 8 MB — try a smaller one." }, { status: 413 });

  try {
    const input = Buffer.from(await file.arrayBuffer());
    const meta = await sharp(input).metadata();
    const img = sharp(input).rotate().resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true });
    const out = await img.webp({ quality: 82, alphaQuality: 90 }).toBuffer();
    const name = `${crypto.randomUUID()}.webp`;
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, name), out);
    // a photo with transparency is a cut-out; a normal photo should fill its card
    return NextResponse.json({ url: `/api/uploads/${name}`, fit: meta.hasAlpha ? "contain" : "cover" });
  } catch {
    return NextResponse.json({ error: "That file isn't a photo we can read. Use a JPG, PNG or WebP." }, { status: 415 });
  }
}
