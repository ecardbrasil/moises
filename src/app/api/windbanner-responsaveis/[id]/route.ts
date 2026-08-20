import { NextResponse } from "next/server";
import { getResponsavel, updateResponsavel } from "@/lib/windbanner-responsaveis";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const responsavel = await getResponsavel(id);
  if (!responsavel) return NextResponse.json({ error: "Responsável não encontrado" }, { status: 404 });
  return NextResponse.json(responsavel);
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await request.json();
  const responsavel = await updateResponsavel(id, {
    nome: typeof body.nome === "string" ? body.nome : undefined,
    ativo: typeof body.ativo === "boolean" ? body.ativo : undefined,
  });
  return NextResponse.json(responsavel);
}
