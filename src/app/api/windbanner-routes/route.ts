import { NextResponse } from "next/server";
import { createRoute, getRoutesWithPoints } from "@/lib/windbanners";

export async function GET() {
  const routes = await getRoutesWithPoints();
  return NextResponse.json(routes);
}

export async function POST(request: Request) {
  const body = await request.json();
  const nome = typeof body.nome === "string" ? body.nome.trim() : "";
  const responsavel = typeof body.responsavel === "string" ? body.responsavel.trim() : "";
  if (!nome || !responsavel) {
    return NextResponse.json({ error: "nome e responsavel são obrigatórios" }, { status: 400 });
  }

  const route = await createRoute({
    nome,
    responsavel,
    dataPrevista: typeof body.dataPrevista === "string" ? body.dataPrevista : null,
  });
  return NextResponse.json(route, { status: 201 });
}
