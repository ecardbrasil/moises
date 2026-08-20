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
  /** @deprecated legacy free-text value, display fallback only — use responsavelNome */
  responsavel: string;
  responsavelId: string | null;
  /** resolved display name: windbanner_responsaveis.nome via responsavelId, falling back to legacy `responsavel` */
  responsavelNome: string;
  ativo: boolean;
  /** @deprecated column retained non-destructively; no longer editable via UI */
  dataPrevista: string | null;
  /** @deprecated column retained non-destructively; no longer editable via UI */
  status: RouteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WindbannerRouteWithPoints extends WindbannerRoute {
  pontos: WindbannerPoint[];
}

export function routeResponsavelLabel(route: WindbannerRoute): string {
  return route.responsavelNome || route.responsavel || "—";
}

export interface WindbannerResponsavel {
  id: string;
  nome: string;
  ativo: boolean;
  cota: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface WindbannerResponsavelWithStats extends WindbannerResponsavel {
  totalRotas: number;
  totalPontos: number;
  pontosColocados: number;
  /** totalPontos > cota — soft warning only, never blocks adding more points */
  acimaDaCota: boolean;
}

export interface WindbannerQuotaHistoryEntry {
  id: string;
  responsavelId: string;
  cotaAnterior: number | null;
  cotaNova: number | null;
  alteradoEm: string;
  motivo: string | null;
  loteId: string | null;
}

export interface WindbannerSettings {
  totalDisponivel: number;
  updatedAt: string;
}
