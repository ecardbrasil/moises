import type { GeocodeStatus } from "./types";

export type RouteStatus = "planejada" | "em_andamento" | "concluida";
export type PointStatus = "pendente" | "colocado" | "removido" | "problema";

export interface WindbannerPoint {
  id: string;
  routeId: string;
  ordem: number;
  endereco: string;
  lat: number | null;
  lng: number | null;
  geocodeStatus: GeocodeStatus;
  status: PointStatus;
  observacao: string | null;
  colocadoEm: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WindbannerRoute {
  id: string;
  nome: string;
  responsavel: string;
  dataPrevista: string | null;
  status: RouteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WindbannerRouteWithPoints extends WindbannerRoute {
  pontos: WindbannerPoint[];
}
