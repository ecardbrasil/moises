import { NextResponse } from "next/server";
import { suggestAddresses } from "@/lib/geocode";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) return NextResponse.json({ error: "q precisa ter ao menos 3 caracteres" }, { status: 400 });

  const limitParam = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 8) : 5;

  const suggestions = await suggestAddresses(q, limit);
  return NextResponse.json(suggestions);
}
