import { NextResponse, type NextRequest } from "next/server";
import { getSoldOut, setSoldOut } from "@/lib/db";
import { isStaff } from "@/lib/staff";
import { getItem } from "@/config/menu";

export async function GET() {
  return NextResponse.json({ soldOut: await getSoldOut() });
}

export async function POST(req: NextRequest) {
  if (!(await isStaff())) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const { id, soldOut } = (await req.json().catch(() => ({}))) as { id?: string; soldOut?: boolean };
  if (!id || !getItem(id)) return NextResponse.json({ error: "Unknown item" }, { status: 400 });
  return NextResponse.json({ soldOut: await setSoldOut(id, !!soldOut) });
}
