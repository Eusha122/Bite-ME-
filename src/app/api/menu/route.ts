import { NextResponse, type NextRequest } from "next/server";
import { getCatalog } from "@/lib/db";
import { isStaff } from "@/lib/staff";

/**
 * The live menu. Guests get visible dishes and the tags that still have dishes;
 * staff asking with ?all=1 also get hidden dishes and empty tags.
 */
export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all") === "1";
  if (all && !(await isStaff())) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  return NextResponse.json(await getCatalog(all), { headers: { "Cache-Control": "no-store" } });
}
