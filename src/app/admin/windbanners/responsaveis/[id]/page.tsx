"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { WindbannerQuotaHistoryEntry, WindbannerResponsavel, WindbannerRouteWithPoints } from "@/lib/windbanner-types";
import { fetchQuotaHistory, fetchResponsavel, fetchRoutes, setResponsavelCota, updateResponsavel } from "@/lib/windbanner-client";
import { useToast } from "@/components/toast/useToast";
import QuotaHistoryList from "@/components/windbanner/QuotaHistoryList";

export default function ResponsavelDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const toast = useToast();

  const [responsavel, setResponsavel] = useState<WindbannerResponsavel | null>(null);
  const [routes, setRoutes] = useState<WindbannerRouteWithPoints[] | null>(null);
  const [history, setHistory] = useState<WindbannerQuotaHistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cotaInput, setCotaInput] = useState("");
  const [savingCota, setSavingCota] = useState(false);

  function reload() {
    Promise.all([fetchResponsavel(id), fetchRoutes(), fetchQuotaHistory(id)])
      .then(([r, allRoutes, h]) => {
        setResponsavel(r);
        setCotaInput(r.cota != null ? String(r.cota) : "");
        setRoutes(allRoutes.filter((route) => route.responsavelId === id));
        setHistory(h);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar"));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleToggleAtivo(ativo: boolean) {
    try {
      await updateResponsavel(id, { ativo });
      reload();
      toast({ message: ativo ? "Responsável ativado" : "Responsável desativado" });
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : "Erro ao salvar", variant: "error" });
    }
  }

  async function handleSaveCota(e: React.FormEvent) {
    e.preventDefault();
    const cota = cotaInput === "" ? NaN : Number(cotaInput);
    if (Number.isNaN(cota) || cota < 0) {
      toast({ message: "Informe uma cota válida", variant: "error" });
      return;
    }
    setSavingCota(true);
    try {
      await setResponsavelCota(id, cota);
      reload();
      toast({ message: "Cota atualizada" });
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : "Erro ao salvar cota", variant: "error" });
    } finally {
      setSavingCota(false);
    }
  }

  if (error) return <p className="p-6 text-sm text-red-700">{error}</p>;
  if (!responsavel) return <p className="p-6 text-sm text-slate-400">Carregando…</p>;

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <Link href="/admin/windbanners" className="text-sm text-slate-500 hover:text-slate-800">
        ← Responsáveis
      </Link>

      <div className="mt-3 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-slate-900">{responsavel.nome}</h1>
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          <input type="checkbox" checked={responsavel.ativo} onChange={(e) => handleToggleAtivo(e.target.checked)} />
          Ativo
        </label>
      </div>

      <form onSubmit={handleSaveCota} className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="text-xs font-medium text-slate-600">Cota de windbanners</label>
          <input
            type="number"
            min={0}
            value={cotaInput}
            onChange={(e) => setCotaInput(e.target.value)}
            className="mt-1 w-28 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={savingCota}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {savingCota ? "Salvando…" : "Salvar cota"}
        </button>
      </form>

      <div className="mt-4">
        <h2 className="text-sm font-semibold text-slate-900">Itinerários</h2>
        <ul className="mt-2 space-y-2">
          {routes?.length === 0 && <li className="text-sm text-slate-400">Nenhuma rota ainda.</li>}
          {routes?.map((route) => (
            <li key={route.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <Link href={`/admin/rotas/${route.id}`} className="font-medium text-slate-900 hover:underline">
                {route.nome}
              </Link>
              <p className="text-xs text-slate-500">{route.pontos.length} pontos</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <h2 className="text-sm font-semibold text-slate-900">Histórico de cota</h2>
        <div className="mt-2">{history && <QuotaHistoryList history={history} />}</div>
      </div>
    </div>
  );
}
