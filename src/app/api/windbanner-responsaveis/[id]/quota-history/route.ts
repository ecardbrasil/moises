import { NextResponse } from "next/server";
import { getQuotaHistory } from "@/lib/windbanner-responsaveis";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const history = await getQuotaHistory(id);
  return NextResponse.json(history);
}
