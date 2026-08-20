import type { PointStatus, RouteStatus, WindbannerPoint, WindbannerRoute, WindbannerRouteWithPoints } from "./windbanner-types";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Erro ${res.status}`);
  }
  return res.json();
}

export function fetchRoutes(): Promise<WindbannerRouteWithPoints[]> {
  return fetch("/api/windbanner-routes", { cache: "no-store" }).then((r) => handle(r));
}

export function fetchRoute(id: string): Promise<WindbannerRouteWithPoints> {
  return fetch(`/api/windbanner-routes/${id}`, { cache: "no-store" }).then((r) => handle(r));
}

export function createRoute(input: { nome: string; responsavel: string; dataPrevista?: string | null }): Promise<WindbannerRoute> {
  return fetch("/api/windbanner-routes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((r) => handle(r));
}

export function updateRoute(
  id: string,
  input: { nome?: string; responsavel?: string; dataPrevista?: string | null; status?: RouteStatus }
): Promise<WindbannerRoute> {
  return fetch(`/api/windbanner-routes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((r) => handle(r));
}

export function deleteRoute(id: string): Promise<{ ok: true }> {
  return fetch(`/api/windbanner-routes/${id}`, { method: "DELETE" }).then((r) => handle(r));
}

export function addPoint(routeId: string, input: { endereco: string; lat?: number | null; lng?: number | null }): Promise<WindbannerPoint> {
  return fetch(`/api/windbanner-routes/${routeId}/points`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((r) => handle(r));
}

export function updatePoint(
  id: string,
  input: Partial<{
    endereco: string;
    ordem: number;
    lat: number | null;
    lng: number | null;
    status: PointStatus;
    observacao: string | null;
  }>
): Promise<WindbannerPoint> {
  return fetch(`/api/windbanner-points/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((r) => handle(r));
}

export function deletePoint(id: string): Promise<{ ok: true }> {
  return fetch(`/api/windbanner-points/${id}`, { method: "DELETE" }).then((r) => handle(r));
}

export function reorderPoints(routeId: string, orderedIds: string[]): Promise<{ ok: true }> {
  return fetch(`/api/windbanner-routes/${routeId}/points/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds }),
  }).then((r) => handle(r));
}
