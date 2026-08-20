import { NextResponse } from "next/server";
import { reorderPoints } from "@/lib/windbanners";

export async function POST(request: Request) {
  const body = await request.json();
  const orderedIds = Array.isArray(body.orderedIds) ? body.orderedIds.filter((v: unknown) => typeof v === "string") : null;
  if (!orderedIds) return NextResponse.json({ error: "orderedIds é obrigatório" }, { status: 400 });

  await reorderPoints(orderedIds);
  return NextResponse.json({ ok: true });
}
