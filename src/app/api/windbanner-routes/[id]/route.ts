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
    nome: typeof body.nome === "string" ? body.nome : undefined,
    responsavelId: typeof body.responsavelId === "string" ? body.responsavelId : undefined,
    status: body.status,
    ativo: typeof body.ativo === "boolean" ? body.ativo : undefined,
  });
  return NextResponse.json(route);
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  await deleteRoute(id);
  return NextResponse.json({ ok: true });
}
