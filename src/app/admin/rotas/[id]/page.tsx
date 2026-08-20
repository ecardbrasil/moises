"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { routeResponsavelLabel, type WindbannerRouteWithPoints } from "@/lib/windbanner-types";
import { addPoint, deletePoint, deleteRoute, fetchRoute, reorderPoints, updateRoute } from "@/lib/windbanner-client";
import { POINT_STATUS_BADGE_CLASS, POINT_STATUS_LABEL } from "@/lib/windbanner-status";
import { useToast } from "@/components/toast/useToast";

export default function RouteEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const routeId = params.id;
  const toast = useToast();

  const [route, setRoute] = useState<WindbannerRouteWithPoints | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [endereco, setEndereco] = useState("");
  const [adding, setAdding] = useState(false);

  function reload() {
    fetchRoute(routeId)
      .then(setRoute)
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  async function handleAddPoint(e: React.FormEvent) {
    e.preventDefault();
    if (!endereco.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await addPoint(routeId, { endereco: endereco.trim() });
      setEndereco("");
      reload();
      toast({ message: "Ponto adicionado" });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao adicionar ponto";
      setError(message);
      toast({ message, variant: "error" });
    } finally {
      setAdding(false);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!route) return;
    const target = index + direction;
    if (target < 0 || target >= route.pontos.length) return;
    const reordered = route.pontos.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setRoute({ ...route, pontos: reordered });
    await reorderPoints(routeId, reordered.map((p) => p.id));
    reload();
  }

  async function handleDeletePoint(pointId: string) {
    if (!route) return;
    const removed = route.pontos.find((p) => p.id === pointId);
    if (!confirm("Remover este ponto da rota?")) return;
    await deletePoint(pointId);
    reload();
    toast({
      message: "Ponto removido",
      actionLabel: removed ? "Desfazer" : undefined,
      onAction: removed
        ? () => {
            addPoint(routeId, { endereco: removed.endereco, lat: removed.lat, lng: removed.lng })
              .then(() => {
                reload();
                toast({ message: "Ponto restaurado" });
              })
              .catch((e) => toast({ message: e instanceof Error ? e.message : "Erro ao desfazer", variant: "error" }));
          }
        : undefined,
    });
  }

  async function handleDeleteRoute() {
    if (!confirm("Excluir esta rota inteira, incluindo todos os pontos?")) return;
    await deleteRoute(routeId);
    toast({ message: "Rota excluída" });
    router.push("/admin/windbanners");
  }

  async function handleStatusChange(status: WindbannerRouteWithPoints["status"]) {
    if (!route) return;
    await updateRoute(routeId, { status });
    reload();
    toast({ message: "Status atualizado" });
  }

  if (error) return <p className="p-6 text-sm text-red-700">{error}</p>;
  if (!route) return <p className="p-6 text-sm text-slate-400">Carregando…</p>;

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/admin/windbanners" className="text-sm text-slate-500 hover:text-slate-800">
          ← Rotas
        </Link>
        <Link
          href={`/campo/${routeId}`}
          className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Abrir checklist de campo
        </Link>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{route.nome}</h1>
          <p className="text-sm text-slate-500">
            {routeResponsavelLabel(route)} {route.dataPrevista ? `— ${route.dataPrevista}` : ""}
          </p>
        </div>
        <select
          value={route.status}
          onChange={(e) => handleStatusChange(e.target.value as WindbannerRouteWithPoints["status"])}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700"
        >
          <option value="planejada">Planejada</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
        </select>
      </div>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleAddPoint} className="mt-4 flex gap-2">
        <input
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          placeholder="Endereço do ponto (ex: Av. Ipiranga, 1000, Porto Alegre)"
          className="flex-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {adding ? "Geocodificando…" : "Adicionar"}
        </button>
      </form>

      <ol className="mt-4 space-y-2">
        {route.pontos.length === 0 && <li className="text-sm text-slate-400">Nenhum ponto cadastrado ainda.</li>}
        {route.pontos.map((point, i) => (
          <li key={point.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
            <span className="w-5 shrink-0 text-xs font-semibold text-slate-400">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-slate-800">{point.endereco}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${POINT_STATUS_BADGE_CLASS[point.status]}`}>
                  {POINT_STATUS_LABEL[point.status]}
                </span>
                {point.geocodeStatus === "approx" && <span className="text-xs text-amber-600">localização aproximada</span>}
                {point.geocodeStatus === "failed" && <span className="text-xs text-red-600">não geocodificado</span>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => handleMove(i, -1)}
                disabled={i === 0}
                aria-label="Mover para cima"
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => handleMove(i, 1)}
                disabled={i === route.pontos.length - 1}
                aria-label="Mover para baixo"
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => handleDeletePoint(point.id)}
                aria-label="Remover ponto"
                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ol>

      <button type="button" onClick={handleDeleteRoute} className="mt-6 text-xs text-red-600 hover:underline">
        Excluir rota
      </button>
    </div>
  );
}
