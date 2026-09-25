import { NextResponse, type NextRequest } from "next/server";
import { createReservation, listReservations, newId, updateReservation } from "@/lib/db";
import { isStaff } from "@/lib/staff";

const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;

export async function GET() {
  if (!(await isStaff())) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  return NextResponse.json({ reservations: await listReservations() });
}

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const name = (b.name ?? "").trim().slice(0, 80);
  const phone = (b.phone ?? "").replace(/[\s-]/g, "");
  const guests = Math.floor(Number(b.guests));
  const date = String(b.date ?? "");
  const time = String(b.time ?? "");

  if (name.length < 2) return NextResponse.json({ error: "Please add your name." }, { status: 400 });
  if (!BD_PHONE.test(phone)) return NextResponse.json({ error: "Enter a valid mobile number (01XXXXXXXXX)." }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Pick a date." }, { status: 400 });
  if (!/^\d{2}:\d{2}$/.test(time)) return NextResponse.json({ error: "Pick a time." }, { status: 400 });
  if (!(guests >= 1 && guests <= 30)) return NextResponse.json({ error: "Guests must be between 1 and 30." }, { status: 400 });
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) return NextResponse.json({ error: "That date has passed." }, { status: 400 });

  const r = await createReservation({
    id: newId(),
    createdAt: Date.now(),
    name,
    phone,
    date,
    time,
    guests,
    note: (b.note ?? "").trim().slice(0, 300) || undefined,
    status: "requested",
  });
  return NextResponse.json({ id: r.id });
}

export async function PATCH(req: NextRequest) {
  if (!(await isStaff())) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const { id, status } = (await req.json().catch(() => ({}))) as { id?: string; status?: "confirmed" | "declined" };
  if (!id || (status !== "confirmed" && status !== "declined")) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const r = await updateReservation(id, status);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
