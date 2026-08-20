import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/windbanner-settings";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  if (typeof body.totalDisponivel !== "number") {
    return NextResponse.json({ error: "totalDisponivel é obrigatório" }, { status: 400 });
  }
  const settings = await updateSettings({ totalDisponivel: body.totalDisponivel });
  return NextResponse.json(settings);
}
