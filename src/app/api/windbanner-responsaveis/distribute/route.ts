import { NextResponse } from "next/server";
import { distributeCotaEqually } from "@/lib/windbanner-responsaveis";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const motivo = typeof body?.motivo === "string" ? body.motivo : undefined;
  const responsaveis = await distributeCotaEqually(motivo);
  return NextResponse.json(responsaveis);
}
