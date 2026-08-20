import { NextResponse } from "next/server";
import { createResponsavel, getResponsaveisWithStats } from "@/lib/windbanner-responsaveis";

export async function GET() {
  const responsaveis = await getResponsaveisWithStats();
  return NextResponse.json(responsaveis);
}

export async function POST(request: Request) {
  const body = await request.json();
  const nome = typeof body.nome === "string" ? body.nome.trim() : "";
  if (!nome) return NextResponse.json({ error: "nome é obrigatório" }, { status: 400 });

  const cota = typeof body.cota === "number" ? body.cota : null;
  const responsavel = await createResponsavel({ nome, cota });
  return NextResponse.json(responsavel, { status: 201 });
}
