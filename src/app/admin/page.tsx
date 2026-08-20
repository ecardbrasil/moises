"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { WindbannerRouteWithPoints } from "@/lib/windbanner-types";
import { createRoute, fetchRoutes } from "@/lib/windbanner-client";

function pointsSummary(route: WindbannerRouteWithPoints) {
  const total = route.pontos.length;
  const colocados = route.pontos.filter((p) => p.status === "colocado").length;
  return `${colocados}/${total} colocados`;
}

export default function AdminPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<WindbannerRouteWithPoints[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [dataPrevista, setDataPrevista] = useState("");
  const [saving, setSaving] = useState(false);

  function reload() {
    fetchRoutes()
      .then(setRoutes)
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const route = await createRoute({ nome, responsavel, dataPrevista: dataPrevista || null });
      setNome("");
      setResponsavel("");
      setDataPrevista("");
      setShowForm(false);
      reload();
      router.push(`/admin/rotas/${route.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar rota");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Rotas de windbanners</h1>
          <p className="text-sm text-slate-500">Cadastre os locais onde os windbanners serão colocados.</p>
        </div>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          ← Mapa
        </Link>
      </div>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          {showForm ? "Cancelar" : "Nova rota"}
        </button>

        {showForm && (
          <form onSubmit={handleCreate} className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-white p-4">
            <div>
              <label className="text-xs font-medium text-slate-600">Nome da rota</label>
              <input
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Zona Norte - Segunda-feira"
                className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Responsável</label>
              <input
                required
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Data prevista</label>
              <input
                type="date"
                value={dataPrevista}
                onChange={(e) => setDataPrevista(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Criando…" : "Criar rota"}
            </button>
          </form>
        )}
      </div>

      <ul className="mt-4 space-y-2">
        {routes === null && <li className="text-sm text-slate-400">Carregando…</li>}
        {routes?.length === 0 && <li className="text-sm text-slate-400">Nenhuma rota cadastrada ainda.</li>}
        {routes?.map((route) => (
          <li key={route.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Link href={`/admin/rotas/${route.id}`} className="font-medium text-slate-900 hover:underline">
                  {route.nome}
                </Link>
                <p className="text-xs text-slate-500">
                  {route.responsavel} {route.dataPrevista ? `— ${route.dataPrevista}` : ""} — {pointsSummary(route)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/campo/${route.id}`}
                  className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Checklist de campo
                </Link>
                <Link
                  href={`/admin/rotas/${route.id}`}
                  className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Editar
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
