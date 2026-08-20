import { NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/geocode";
import { addPoint, getRouteWithPoints } from "@/lib/windbanners";

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Context) {
  const { id: routeId } = await params;
  const body = await request.json();
  const endereco = typeof body.endereco === "string" ? body.endereco.trim() : "";
  if (!endereco) return NextResponse.json({ error: "endereco é obrigatório" }, { status: 400 });

  const route = await getRouteWithPoints(routeId);
  if (!route) return NextResponse.json({ error: "Rota não encontrada" }, { status: 404 });

  let lat: number | null = typeof body.lat === "number" ? body.lat : null;
  let lng: number | null = typeof body.lng === "number" ? body.lng : null;
  let geocodeStatus: "pending" | "ok" | "approx" | "failed" = "pending";

  if (lat === null || lng === null) {
    const geocoded = await geocodeAddress(endereco);
    if (geocoded) {
      lat = geocoded.lat;
      lng = geocoded.lng;
      geocodeStatus = geocoded.status;
    } else {
      geocodeStatus = "failed";
    }
  } else {
    geocodeStatus = "ok";
  }

  const ordem = route.pontos.length;
  const point = await addPoint(routeId, { endereco, ordem, lat, lng, geocodeStatus });
  return NextResponse.json(point, { status: 201 });
}
