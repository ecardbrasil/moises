"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { WindbannerResponsavelWithStats, WindbannerRouteWithPoints } from "@/lib/windbanner-types";
import {
  createResponsavel,
  createRoute,
  distributeCotaEqually,
  fetchResponsaveis,
  fetchRoutes,
  fetchSettings,
  updateResponsavel,
  updateSettings,
} from "@/lib/windbanner-client";
import { useToast } from "@/components/toast/useToast";
import ResponsavelList from "@/components/windbanner/ResponsavelList";
import ResponsavelPicker from "@/components/windbanner/ResponsavelPicker";

export default function WindbannersAdminPage() {
  const router = useRouter();
  const toast = useToast();

  const [responsaveis, setResponsaveis] = useState<WindbannerResponsavelWithStats[] | null>(null);
  const [routes, setRoutes] = useState<WindbannerRouteWithPoints[] | null>(null);
  const [totalDisponivel, setTotalDisponivel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showRouteForm, setShowRouteForm] = useState(false);
  const [routeNome, setRouteNome] = useState("");
  const [routeResponsavelId, setRouteResponsavelId] = useState<string | null>(null);
  const [savingRoute, setSavingRoute] = useState(false);

  const [savingTotal, setSavingTotal] = useState(false);
  const [distributing, setDistributing] = useState(false);

  function reload() {
    Promise.all([fetchResponsaveis(), fetchRoutes(), fetchSettings()])
      .then(([r, rt, s]) => {
        setResponsaveis(r);
        setRoutes(rt);
        setTotalDisponivel(s.totalDisponivel);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar"));
  }

  useEffect(() => {
    reload();
  }, []);

  const routesByResponsavel: Record<string, { id: string; nome: string }[]> = {};
  for (const route of routes ?? []) {
    if (!route.responsavelId) continue;
    (routesByResponsavel[route.responsavelId] ??= []).push({ id: route.id, nome: route.nome });
  }

  async function handleToggleAtivo(id: string, ativo: boolean) {
    try {
      await updateResponsavel(id, { ativo });
      reload();
      toast({ message: ativo ? "Responsável ativado" : "Responsável desativado" });
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : "Erro ao salvar", variant: "error" });
    }
  }

  async function handleCreateRoute(e: React.FormEvent) {
    e.preventDefault();
    if (!routeResponsavelId) {
      toast({ message: "Selecione um responsável", variant: "error" });
      return;
    }
    setSavingRoute(true);
    try {
      const route = await createRoute({ nome: routeNome, responsavelId: routeResponsavelId });
      setRouteNome("");
      setRouteResponsavelId(null);
      setShowRouteForm(false);
      toast({ message: "Rota criada" });
      router.push(`/admin/rotas/${route.id}`);
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : "Erro ao criar rota", variant: "error" });
    } finally {
      setSavingRoute(false);
    }
  }

  async function handleSaveTotal() {
    if (totalDisponivel == null) return;
    setSavingTotal(true);
    try {
      await updateSettings(totalDisponivel);
      toast({ message: "Total salvo" });
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : "Erro ao salvar", variant: "error" });
    } finally {
      setSavingTotal(false);
    }
  }

  async function handleDistribute() {
    if (!confirm("Redistribuir a cota igualmente entre os responsáveis ativos? Isso substitui a cota individual atual de cada um.")) return;
    setDistributing(true);
    try {
      await distributeCotaEqually();
      reload();
      toast({ message: "Cota distribuída igualmente" });
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : "Erro ao distribuir", variant: "error" });
    } finally {
      setDistributing(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Windbanners</h1>
          <p className="text-sm text-slate-500">Responsáveis, cotas e rotas de colocação.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowRouteForm((v) => !v)}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          {showRouteForm ? "Cancelar" : "Nova rota"}
        </button>
      </div>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {showRouteForm && (
        <form onSubmit={handleCreateRoute} className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-white p-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Nome da rota</label>
            <input
              required
              value={routeNome}
              onChange={(e) => setRouteNome(e.target.value)}
              placeholder="Ex: Zona Norte - Segunda-feira"
              className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Responsável</label>
            <div className="mt-1">
              <ResponsavelPicker
                responsaveis={(responsaveis ?? []).filter((r) => r.ativo)}
                value={routeResponsavelId}
                onChange={setRouteResponsavelId}
                onCreate={async (nome) => {
                  const created = await createResponsavel({ nome });
                  reload();
                  return created;
                }}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingRoute}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {savingRoute ? "Criando…" : "Criar rota"}
          </button>
        </form>
      )}

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Windbanners disponíveis</h2>
        <p className="text-xs text-slate-500">Total no estoque para distribuir entre os responsáveis.</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={0}
            value={totalDisponivel ?? ""}
            onChange={(e) => setTotalDisponivel(e.target.value === "" ? null : Number(e.target.value))}
            className="w-28 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSaveTotal}
            disabled={savingTotal || totalDisponivel == null}
            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={handleDistribute}
            disabled={distributing || !responsaveis?.some((r) => r.ativo)}
            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {distributing ? "Distribuindo…" : "Distribuir igualmente"}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <h2 className="text-sm font-semibold text-slate-900">Responsáveis</h2>
        <div className="mt-2">
          {responsaveis === null ? (
            <p className="text-sm text-slate-400">Carregando…</p>
          ) : (
            <ResponsavelList responsaveis={responsaveis} routesByResponsavel={routesByResponsavel} onToggleAtivo={handleToggleAtivo} />
          )}
        </div>
      </div>
    </div>
  );
}
