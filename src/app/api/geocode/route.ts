import { NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/geocode";

export async function POST(request: Request) {
  const body = await request.json();
  const endereco = typeof body.endereco === "string" ? body.endereco.trim() : "";
  if (!endereco) return NextResponse.json({ error: "endereco é obrigatório" }, { status: 400 });

  const result = await geocodeAddress(endereco);
  if (!result) return NextResponse.json({ error: "Endereço não encontrado" }, { status: 404 });

  return NextResponse.json(result);
}
