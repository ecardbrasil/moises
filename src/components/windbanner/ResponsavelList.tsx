"use client";

import Link from "next/link";
import type { WindbannerResponsavelWithStats } from "@/lib/windbanner-types";
import QuotaBar from "./QuotaBar";

interface RouteSummary {
  id: string;
  nome: string;
}

interface ResponsavelListProps {
  responsaveis: WindbannerResponsavelWithStats[];
  routesByResponsavel: Record<string, RouteSummary[]>;
  onToggleAtivo: (id: string, ativo: boolean) => void;
}

export default function ResponsavelList({ responsaveis, routesByResponsavel, onToggleAtivo }: ResponsavelListProps) {
  if (responsaveis.length === 0) {
    return <p className="text-sm text-slate-400">Nenhum responsável cadastrado ainda.</p>;
  }

  return (
    <ul className="space-y-2">
      {responsaveis.map((r) => {
        const rotas = routesByResponsavel[r.id] ?? [];
        return (
          <li key={r.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/admin/windbanners/responsaveis/${r.id}`} className="font-medium text-slate-900 hover:underline">
                    {r.nome}
                  </Link>
                  {!r.ativo && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">inativo</span>}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {r.totalRotas} {r.totalRotas === 1 ? "itinerário" : "itinerários"} — {r.pontosColocados}/{r.totalPontos} colocados
                </p>
                {rotas.length > 0 && (
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {rotas.map((rota) => (
                      <li key={rota.id}>
                        <Link
                          href={`/admin/windbanners/rotas/${rota.id}`}
                          className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
                        >
                          {rota.nome}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 max-w-xs">
                  <QuotaBar used={r.totalPontos} cota={r.cota} />
                </div>
              </div>
              <label className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
                <input type="checkbox" checked={r.ativo} onChange={(e) => onToggleAtivo(r.id, e.target.checked)} />
                Ativo
              </label>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
