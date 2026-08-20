import { NextResponse } from "next/server";
import { deletePoint, updatePoint } from "@/lib/windbanners";

interface Context {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await request.json();
  const point = await updatePoint(id, {
    endereco: body.endereco,
    ordem: body.ordem,
    lat: body.lat,
    lng: body.lng,
    geocodeStatus: body.geocodeStatus,
    status: body.status,
    observacao: body.observacao,
  });
  return NextResponse.json(point);
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  await deletePoint(id);
  return NextResponse.json({ ok: true });
}
