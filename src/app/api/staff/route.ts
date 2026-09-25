import { NextResponse, type NextRequest } from "next/server";
import { checkPin, isStaff, staffToken, STAFF_COOKIE } from "@/lib/staff";

export async function GET() {
  return NextResponse.json({ staff: await isStaff() });
}

export async function POST(req: NextRequest) {
  const { pin } = (await req.json().catch(() => ({}))) as { pin?: string };
  if (!pin || !checkPin(String(pin))) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(STAFF_COOKIE, staffToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 16,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(STAFF_COOKIE);
  return res;
}
