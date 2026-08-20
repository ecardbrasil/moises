import type { PointStatus } from "./windbanner-types";

export const POINT_STATUS_LABEL: Record<PointStatus, string> = {
  pendente: "Pendente",
  colocado: "Colocado",
  removido: "Removido",
  problema: "Problema",
};

// Hex used by the Leaflet layer (CircleMarker doesn't take Tailwind classes)
// and the badge classes used by the DOM UI, kept in one place so both stay in sync.
export const POINT_STATUS_COLOR: Record<PointStatus, string> = {
  pendente: "#94a3b8", // slate-400
  colocado: "#16a34a", // green-600
  removido: "#64748b", // slate-500
  problema: "#dc2626", // red-600
};

export const POINT_STATUS_BADGE_CLASS: Record<PointStatus, string> = {
  pendente: "bg-slate-100 text-slate-600",
  colocado: "bg-green-100 text-green-700",
  removido: "bg-slate-200 text-slate-500",
  problema: "bg-red-100 text-red-700",
};
