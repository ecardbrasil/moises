import { getSupabase } from "./supabase";
import type {
  WindbannerQuotaHistoryEntry,
  WindbannerResponsavel,
  WindbannerResponsavelWithStats,
} from "./windbanner-types";

interface ResponsavelRow {
  id: string;
  nome: string;
  ativo: boolean;
  cota: number | null;
  created_at: string;
  updated_at: string;
}

interface QuotaHistoryRow {
  id: string;
  responsavel_id: string;
  cota_anterior: number | null;
  cota_nova: number | null;
  alterado_em: string;
  motivo: string | null;
  lote_id: string | null;
}

function rowToResponsavel(row: ResponsavelRow): WindbannerResponsavel {
  return {
    id: row.id,
    nome: row.nome,
    ativo: row.ativo,
    cota: row.cota,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToQuotaHistoryEntry(row: QuotaHistoryRow): WindbannerQuotaHistoryEntry {
  return {
    id: row.id,
    responsavelId: row.responsavel_id,
    cotaAnterior: row.cota_anterior,
    cotaNova: row.cota_nova,
    alteradoEm: row.alterado_em,
    motivo: row.motivo,
    loteId: row.lote_id,
  };
}

export async function getResponsaveis(): Promise<WindbannerResponsavel[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("windbanner_responsaveis").select("*").order("nome", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as ResponsavelRow[]).map(rowToResponsavel);
}

export async function getResponsaveisWithStats(): Promise<WindbannerResponsavelWithStats[]> {
  const supabase = getSupabase();
  const [{ data: responsavelRows, error: responsaveisError }, { data: routeRows, error: routesError }, { data: pointRows, error: pointsError }] =
    await Promise.all([
      supabase.from("windbanner_responsaveis").select("*").order("nome", { ascending: true }),
      supabase.from("windbanner_routes").select("id, responsavel_id"),
      supabase.from("windbanner_points").select("route_id, status"),
    ]);
  if (responsaveisError) throw responsaveisError;
  if (routesError) throw routesError;
  if (pointsError) throw pointsError;

  const routeToResponsavel = new Map<string, string | null>();
  const responsavelToRoutes = new Map<string, number>();
  for (const route of (routeRows ?? []) as { id: string; responsavel_id: string | null }[]) {
    routeToResponsavel.set(route.id, route.responsavel_id);
    if (route.responsavel_id) {
      responsavelToRoutes.set(route.responsavel_id, (responsavelToRoutes.get(route.responsavel_id) ?? 0) + 1);
    }
  }

  const responsavelToPoints = new Map<string, number>();
  const responsavelToColocados = new Map<string, number>();
  for (const point of (pointRows ?? []) as { route_id: string; status: string }[]) {
    const responsavelId = routeToResponsavel.get(point.route_id);
    if (!responsavelId) continue;
    responsavelToPoints.set(responsavelId, (responsavelToPoints.get(responsavelId) ?? 0) + 1);
    if (point.status === "colocado") {
      responsavelToColocados.set(responsavelId, (responsavelToColocados.get(responsavelId) ?? 0) + 1);
    }
  }

  return ((responsavelRows ?? []) as ResponsavelRow[]).map((row) => {
    const responsavel = rowToResponsavel(row);
    const totalPontos = responsavelToPoints.get(row.id) ?? 0;
    return {
      ...responsavel,
      totalRotas: responsavelToRoutes.get(row.id) ?? 0,
      totalPontos,
      pontosColocados: responsavelToColocados.get(row.id) ?? 0,
      acimaDaCota: responsavel.cota != null && totalPontos > responsavel.cota,
    };
  });
}

export async function getResponsavel(id: string): Promise<WindbannerResponsavel | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("windbanner_responsaveis").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToResponsavel(data as ResponsavelRow) : null;
}

export interface CreateResponsavelInput {
  nome: string;
  cota?: number | null;
}

export async function createResponsavel(input: CreateResponsavelInput): Promise<WindbannerResponsavel> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("windbanner_responsaveis")
    .insert({ nome: input.nome, cota: input.cota ?? null })
    .select("*")
    .single();
  if (error) throw error;
  return rowToResponsavel(data as ResponsavelRow);
}

export interface UpdateResponsavelInput {
  nome?: string;
  ativo?: boolean;
}

export async function updateResponsavel(id: string, input: UpdateResponsavelInput): Promise<WindbannerResponsavel> {
  const supabase = getSupabase();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.nome !== undefined) patch.nome = input.nome;
  if (input.ativo !== undefined) patch.ativo = input.ativo;

  const { data, error } = await supabase.from("windbanner_responsaveis").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return rowToResponsavel(data as ResponsavelRow);
}

export async function setResponsavelCota(
  id: string,
  novaCota: number,
  options?: { motivo?: string; loteId?: string }
): Promise<WindbannerResponsavel> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .rpc("set_windbanner_cota", {
      p_responsavel_id: id,
      p_nova_cota: novaCota,
      p_motivo: options?.motivo ?? null,
      p_lote_id: options?.loteId ?? null,
    })
    .single();
  if (error) throw error;
  return rowToResponsavel(data as ResponsavelRow);
}

export async function distributeCotaEqually(motivo?: string): Promise<WindbannerResponsavel[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("distribute_windbanner_cota_equally", {
    p_motivo: motivo ?? "Distribuição igualitária",
  });
  if (error) throw error;
  return ((data ?? []) as ResponsavelRow[]).map(rowToResponsavel);
}

export async function getQuotaHistory(responsavelId: string): Promise<WindbannerQuotaHistoryEntry[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("windbanner_quota_history")
    .select("*")
    .eq("responsavel_id", responsavelId)
    .order("alterado_em", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as QuotaHistoryRow[]).map(rowToQuotaHistoryEntry);
}
