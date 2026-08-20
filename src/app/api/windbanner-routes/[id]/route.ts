import { NextResponse } from "next/server";
import { deleteRoute, getRouteWithPoints, updateRoute } from "@/lib/windbanners";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const route = await getRouteWithPoints(id);
  if (!route) return NextResponse.json({ error: "Rota não encontrada" }, { status: 404 });
  return NextResponse.json(route);
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await request.json();
  const route = await updateRoute(id, {
    nome: body.nome,
    responsavel: body.responsavel,
    dataPrevista: body.dataPrevista,
    status: body.status,
  });
  return NextResponse.json(route);
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  await deleteRoute(id);
  return NextResponse.json({ ok: true });
}
