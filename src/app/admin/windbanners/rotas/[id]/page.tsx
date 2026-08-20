"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { routeResponsavelLabel, type WindbannerRouteWithPoints } from "@/lib/windbanner-types";
import { addPoint, deletePoint, deleteRoute, fetchRoute, reorderPoints, updatePoint, updateRoute } from "@/lib/windbanner-client";
import type { GeocodeSuggestion } from "@/lib/geocode";
import { useToast } from "@/components/toast/useToast";
import AddressAutocomplete from "@/components/windbanner/AddressAutocomplete";
import PointList from "@/components/windbanner/PointList";

const RouteMapEditor = dynamic(() => import("@/components/windbanner/RouteMapEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-400">Carregando mapa…</div>
  ),
});

export default function RouteMapEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const routeId = params.id;
  const toast = useToast();

  const [route, setRoute] = useState<WindbannerRouteWithPoints | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [addingByClick, setAddingByClick] = useState(false);

  function reload() {
    fetchRoute(routeId)
      .then(setRoute)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar"));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  async function handleAddressSelect(suggestion: GeocodeSuggestion) {
    try {
      await addPoint(routeId, { endereco: suggestion.label, lat: suggestion.lat, lng: suggestion.lng });
      reload();
      toast({ message: "Ponto adicionado" });
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : "Erro ao adicionar ponto", variant: "error" });
    }
  }

  async function handleMapClick(lat: number, lng: number) {
    if (!addingByClick) return;
    try {
      await addPoint(routeId, { endereco: `Ponto (${lat.toFixed(5)}, ${lng.toFixed(5)})`, lat, lng });
      reload();
      toast({ message: "Ponto adicionado — edite o endereço na lista" });
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : "Erro ao adicionar ponto", variant: "error" });
    }
  }

  async function handleMovePoint(id: string, lat: number, lng: number) {
    try {
      await updatePoint(id, { lat, lng });
      reload();
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : "Erro ao mover ponto", variant: "error" });
    }
  }

  async function handleReorder(orderedIds: string[]) {
    try {
      await reorderPoints(routeId, orderedIds);
      reload();
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : "Erro ao reordenar", variant: "error" });
    }
  }

  async function handleRename(id: string, endereco: string) {
    try {
      await updatePoint(id, { endereco });
      reload();
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : "Erro ao renomear", variant: "error" });
    }
  }

  async function handleDeletePoint(id: string) {
    if (!route) return;
    const removed = route.pontos.find((p) => p.id === id);
    if (!confirm("Remover este ponto da rota?")) return;
    await deletePoint(id);
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

  async function handleToggleAtivo(ativo: boolean) {
    try {
      await updateRoute(routeId, { ativo });
      reload();
      toast({ message: ativo ? "Rota ativada" : "Rota desativada" });
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : "Erro ao salvar", variant: "error" });
    }
  }

  async function handleDeleteRoute() {
    if (!confirm("Excluir esta rota inteira, incluindo todos os pontos?")) return;
    await deleteRoute(routeId);
    toast({ message: "Rota excluída" });
    router.push("/admin/windbanners");
  }

  if (error) return <p className="p-6 text-sm text-red-700">{error}</p>;
  if (!route) return <p className="p-6 text-sm text-slate-400">Carregando…</p>;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 sm:p-6">
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

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{route.nome}</h1>
          <p className="text-sm text-slate-500">{routeResponsavelLabel(route)}</p>
        </div>
        <label className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
          <input type="checkbox" checked={route.ativo} onChange={(e) => handleToggleAtivo(e.target.checked)} />
          Ativo
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <AddressAutocomplete onSelect={handleAddressSelect} />
            </div>
            <button
              type="button"
              onClick={() => setAddingByClick((v) => !v)}
              className={`shrink-0 rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                addingByClick ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {addingByClick ? "Clique no mapa para adicionar" : "Adicionar clicando no mapa"}
            </button>
          </div>
          <div className="h-[50vh] overflow-hidden rounded-lg border border-slate-200 lg:h-[560px]">
            <RouteMapEditor points={route.pontos} onMovePoint={handleMovePoint} onMapClick={handleMapClick} selectedPointId={selectedPointId} />
          </div>
        </div>

        <div>
          <PointList
            points={route.pontos}
            onReorder={handleReorder}
            onDelete={handleDeletePoint}
            onRename={handleRename}
            onSelect={setSelectedPointId}
            selectedId={selectedPointId}
          />
        </div>
      </div>

      <button type="button" onClick={handleDeleteRoute} className="self-start text-xs text-red-600 hover:underline">
        Excluir rota
      </button>
    </div>
  );
}
