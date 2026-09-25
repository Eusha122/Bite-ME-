import { NextResponse, type NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");
const NAME = /^[a-f0-9-]{36}\.webp$/;

/** Public: serves uploaded dish photos. Files are content-named, so they cache forever. */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/uploads/[file]">) {
  const { file } = await ctx.params;
  if (!NAME.test(file)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const buf = await fs.readFile(path.join(UPLOAD_DIR, file));
    return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
