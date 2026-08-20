import { supabase } from "./supabase";
import type { PointStatus, RouteStatus, WindbannerPoint, WindbannerRoute, WindbannerRouteWithPoints } from "./windbanner-types";
import type { GeocodeStatus } from "./types";

interface RouteRow {
  id: string;
  nome: string;
  responsavel: string;
  data_prevista: string | null;
  status: RouteStatus;
  created_at: string;
  updated_at: string;
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

export async function getRoutesWithPoints(): Promise<WindbannerRouteWithPoints[]> {
  const { data: routeRows, error: routesError } = await supabase
    .from("windbanner_routes")
    .select("*")
    .order("created_at", { ascending: false });
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
  const { data: routeRow, error: routeError } = await supabase.from("windbanner_routes").select("*").eq("id", id).maybeSingle();
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
  responsavel: string;
  dataPrevista?: string | null;
}

export async function createRoute(input: CreateRouteInput): Promise<WindbannerRoute> {
  const { data, error } = await supabase
    .from("windbanner_routes")
    .insert({ nome: input.nome, responsavel: input.responsavel, data_prevista: input.dataPrevista ?? null })
    .select("*")
    .single();
  if (error) throw error;
  return rowToRoute(data as RouteRow);
}

export interface UpdateRouteInput {
  nome?: string;
  responsavel?: string;
  dataPrevista?: string | null;
  status?: RouteStatus;
}

export async function updateRoute(id: string, input: UpdateRouteInput): Promise<WindbannerRoute> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.nome !== undefined) patch.nome = input.nome;
  if (input.responsavel !== undefined) patch.responsavel = input.responsavel;
  if (input.dataPrevista !== undefined) patch.data_prevista = input.dataPrevista;
  if (input.status !== undefined) patch.status = input.status;

  const { data, error } = await supabase.from("windbanner_routes").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return rowToRoute(data as RouteRow);
}

export async function deleteRoute(id: string): Promise<void> {
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
  const { error } = await supabase.from("windbanner_points").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderPoints(orderedIds: string[]): Promise<void> {
  await Promise.all(orderedIds.map((id, index) => supabase.from("windbanner_points").update({ ordem: index }).eq("id", id)));
}
