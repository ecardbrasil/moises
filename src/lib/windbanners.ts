import { getSupabase } from "./supabase";
import type { PointStatus, RouteStatus, WindbannerPoint, WindbannerRoute, WindbannerRouteWithPoints } from "./windbanner-types";
import type { GeocodeStatus } from "./types";

const ROUTE_SELECT = "*, windbanner_responsaveis(nome)";

interface RouteRow {
  id: string;
  nome: string;
  responsavel: string;
  responsavel_id: string | null;
  ativo: boolean;
  data_prevista: string | null;
  status: RouteStatus;
  created_at: string;
  updated_at: string;
  windbanner_responsaveis?: { nome: string } | null;
}

interface PointRow {
  id: string;
  route_id: string;
  ordem: number;
  endereco: string;
  lat: number | null;
  lng: number | null;
  geocode_status: GeocodeStatus;
  status: PointStatus;
  observacao: string | null;
  colocado_em: string | null;
  created_at: string;
  updated_at: string;
}

function rowToRoute(row: RouteRow): WindbannerRoute {
  return {
    id: row.id,
    nome: row.nome,
    responsavel: row.responsavel,
    responsavelId: row.responsavel_id,
    responsavelNome: row.windbanner_responsaveis?.nome ?? row.responsavel,
    ativo: row.ativo,
    dataPrevista: row.data_prevista,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToPoint(row: PointRow): WindbannerPoint {
  return {
    id: row.id,
    routeId: row.route_id,
    ordem: row.ordem,
    endereco: row.endereco,
    lat: row.lat,
    lng: row.lng,
    geocodeStatus: row.geocode_status,
    status: row.status,
    observacao: row.observacao,
    colocadoEm: row.colocado_em,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getRoutesWithPoints(options?: { ativoOnly?: boolean }): Promise<WindbannerRouteWithPoints[]> {
  const supabase = getSupabase();
  let query = supabase.from("windbanner_routes").select(ROUTE_SELECT).order("created_at", { ascending: false });
  if (options?.ativoOnly) query = query.eq("ativo", true);
  const { data: routeRows, error: routesError } = await query;
  if (routesError) throw routesError;

  const { data: pointRows, error: pointsError } = await supabase
    .from("windbanner_points")
    .select("*")
    .order("ordem", { ascending: true });
  if (pointsError) throw pointsError;

  const pointsByRoute = new Map<string, WindbannerPoint[]>();
  for (const row of (pointRows ?? []) as PointRow[]) {
    const point = rowToPoint(row);
    const list = pointsByRoute.get(point.routeId) ?? [];
    list.push(point);
    pointsByRoute.set(point.routeId, list);
  }

  return ((routeRows ?? []) as RouteRow[]).map((row) => ({
    ...rowToRoute(row),
    pontos: pointsByRoute.get(row.id) ?? [],
  }));
}

export async function getRouteWithPoints(id: string): Promise<WindbannerRouteWithPoints | null> {
  const supabase = getSupabase();
  const { data: routeRow, error: routeError } = await supabase.from("windbanner_routes").select(ROUTE_SELECT).eq("id", id).maybeSingle();
  if (routeError) throw routeError;
  if (!routeRow) return null;

  const { data: pointRows, error: pointsError } = await supabase
    .from("windbanner_points")
    .select("*")
    .eq("route_id", id)
    .order("ordem", { ascending: true });
  if (pointsError) throw pointsError;

  return {
    ...rowToRoute(routeRow as RouteRow),
    pontos: ((pointRows ?? []) as PointRow[]).map(rowToPoint),
  };
}

export interface CreateRouteInput {
  nome: string;
  /** @deprecated free-text fallback — prefer responsavelId once the caller has one */
  responsavel?: string;
  responsavelId?: string | null;
  dataPrevista?: string | null;
  ativo?: boolean;
}

export async function createRoute(input: CreateRouteInput): Promise<WindbannerRoute> {
  const supabase = getSupabase();
  let responsavelText = input.responsavel ?? "";
  if (input.responsavelId) {
    const { data: responsavelRow, error: responsavelError } = await supabase
      .from("windbanner_responsaveis")
      .select("nome")
      .eq("id", input.responsavelId)
      .single();
    if (responsavelError) throw responsavelError;
    responsavelText = responsavelRow.nome;
  }

  const { data, error } = await supabase
    .from("windbanner_routes")
    .insert({
      nome: input.nome,
      responsavel: responsavelText,
      responsavel_id: input.responsavelId ?? null,
      data_prevista: input.dataPrevista ?? null,
      ...(input.ativo !== undefined ? { ativo: input.ativo } : {}),
    })
    .select(ROUTE_SELECT)
    .single();
  if (error) throw error;
  return rowToRoute(data as RouteRow);
}

export interface UpdateRouteInput {
  nome?: string;
  /** @deprecated free-text fallback — prefer responsavelId once the caller has one */
  responsavel?: string;
  responsavelId?: string | null;
  dataPrevista?: string | null;
  status?: RouteStatus;
  ativo?: boolean;
}

export async function updateRoute(id: string, input: UpdateRouteInput): Promise<WindbannerRoute> {
  const supabase = getSupabase();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.nome !== undefined) patch.nome = input.nome;
  if (input.responsavel !== undefined) patch.responsavel = input.responsavel;
  if (input.responsavelId !== undefined) {
    patch.responsavel_id = input.responsavelId;
    if (input.responsavelId) {
      const { data: responsavelRow, error: responsavelError } = await supabase
        .from("windbanner_responsaveis")
        .select("nome")
        .eq("id", input.responsavelId)
        .single();
      if (responsavelError) throw responsavelError;
      patch.responsavel = responsavelRow.nome;
    }
  }
  if (input.dataPrevista !== undefined) patch.data_prevista = input.dataPrevista;
  if (input.status !== undefined) patch.status = input.status;
  if (input.ativo !== undefined) patch.ativo = input.ativo;

  const { data, error } = await supabase.from("windbanner_routes").update(patch).eq("id", id).select(ROUTE_SELECT).single();
  if (error) throw error;
  return rowToRoute(data as RouteRow);
}

export async function deleteRoute(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("windbanner_routes").delete().eq("id", id);
  if (error) throw error;
}

export interface AddPointInput {
  endereco: string;
  ordem: number;
  lat?: number | null;
  lng?: number | null;
  geocodeStatus?: GeocodeStatus;
}

export async function addPoint(routeId: string, input: AddPointInput): Promise<WindbannerPoint> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("windbanner_points")
    .insert({
      route_id: routeId,
      endereco: input.endereco,
      ordem: input.ordem,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      geocode_status: input.geocodeStatus ?? "pending",
    })
    .select("*")
    .single();
  if (error) throw error;
  return rowToPoint(data as PointRow);
}

export interface UpdatePointInput {
  endereco?: string;
  ordem?: number;
  lat?: number | null;
  lng?: number | null;
  geocodeStatus?: GeocodeStatus;
  status?: PointStatus;
  observacao?: string | null;
}

export async function updatePoint(id: string, input: UpdatePointInput): Promise<WindbannerPoint> {
  const supabase = getSupabase();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.endereco !== undefined) patch.endereco = input.endereco;
  if (input.ordem !== undefined) patch.ordem = input.ordem;
  if (input.lat !== undefined) patch.lat = input.lat;
  if (input.lng !== undefined) patch.lng = input.lng;
  if (input.geocodeStatus !== undefined) patch.geocode_status = input.geocodeStatus;
  if (input.observacao !== undefined) patch.observacao = input.observacao;
  if (input.status !== undefined) {
    patch.status = input.status;
    patch.colocado_em = input.status === "colocado" ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase.from("windbanner_points").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return rowToPoint(data as PointRow);
}

export async function deletePoint(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("windbanner_points").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderPoints(orderedIds: string[]): Promise<void> {
  const supabase = getSupabase();
  await Promise.all(orderedIds.map((id, index) => supabase.from("windbanner_points").update({ ordem: index }).eq("id", id)));
}
