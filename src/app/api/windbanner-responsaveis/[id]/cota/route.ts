import { NextResponse } from "next/server";
import { setResponsavelCota } from "@/lib/windbanner-responsaveis";

interface Context {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await request.json();
  if (typeof body.cota !== "number") return NextResponse.json({ error: "cota é obrigatória" }, { status: 400 });

  const responsavel = await setResponsavelCota(id, body.cota, {
    motivo: typeof body.motivo === "string" ? body.motivo : undefined,
  });
  return NextResponse.json(responsavel);
}
