"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { PointStatus, WindbannerRouteWithPoints } from "@/lib/windbanner-types";
import { fetchRoute, updatePoint } from "@/lib/windbanner-client";
import { POINT_STATUS_BADGE_CLASS, POINT_STATUS_LABEL } from "@/lib/windbanner-status";

const ACTIONS: { status: PointStatus; label: string }[] = [
  { status: "colocado", label: "Colocado" },
  { status: "problema", label: "Problema" },
  { status: "pendente", label: "Pendente" },
];

export default function FieldChecklistPage() {
  const params = useParams<{ id: string }>();
  const routeId = params.id;

  const [route, setRoute] = useState<WindbannerRouteWithPoints | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  function reload() {
    fetchRoute(routeId)
      .then(setRoute)
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  async function handleSetStatus(pointId: string, status: PointStatus) {
    setSavingId(pointId);
    try {
      await updatePoint(pointId, { status });
      reload();
    } finally {
      setSavingId(null);
    }
  }

  if (error) return <p className="p-6 text-sm text-red-700">{error}</p>;
  if (!route) return <p className="p-6 text-sm text-slate-400">Carregando…</p>;

  const total = route.pontos.length;
  const colocados = route.pontos.filter((p) => p.status === "colocado").length;

  return (
    <div className="mx-auto max-w-lg p-3 pb-10 sm:p-4">
      <div className="sticky top-0 z-10 -mx-3 border-b border-slate-200 bg-white px-3 py-3 sm:-mx-4 sm:px-4">
        <h1 className="text-base font-bold text-slate-900">{route.nome}</h1>
        <p className="text-sm text-slate-500">
          {route.responsavel} — {colocados}/{total} colocados
        </p>
      </div>

      <ul className="mt-3 space-y-3">
        {route.pontos.map((point, i) => (
          <li key={point.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 w-5 shrink-0 text-xs font-semibold text-slate-400">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">{point.endereco}</p>
                <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${POINT_STATUS_BADGE_CLASS[point.status]}`}>
                  {POINT_STATUS_LABEL[point.status]}
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {ACTIONS.map((action) => (
                <button
                  key={action.status}
                  type="button"
                  disabled={savingId === point.id}
                  onClick={() => handleSetStatus(point.id, action.status)}
                  className={`rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                    point.status === action.status
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
