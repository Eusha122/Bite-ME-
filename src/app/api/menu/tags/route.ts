import { NextResponse, type NextRequest } from "next/server";
import { tagOperation, type TagOp } from "@/lib/db";
import { isStaff } from "@/lib/staff";

const ACTIONS = ["create", "rename", "delete", "move", "assign"];

/** Staff: create, rename, delete, reorder tags, or choose which dishes carry a tag. */
export async function POST(req: NextRequest) {
  if (!(await isStaff())) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !ACTIONS.includes(String(body.action))) return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  if (body.action === "assign" && !Array.isArray(body.dishIds)) return NextResponse.json({ error: "dishIds must be a list." }, { status: 400 });
  if (body.action === "move" && body.direction !== 1 && body.direction !== -1) return NextResponse.json({ error: "Bad direction." }, { status: 400 });

  const result = await tagOperation(body as unknown as TagOp);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json(result);
}
