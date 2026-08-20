"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { CandidateConfig, LocationWithVotes, Zona } from "@/lib/types";
import type { WindbannerRouteWithPoints } from "@/lib/windbanner-types";
import { fetchRoutes } from "@/lib/windbanner-client";
import StatCards from "./StatCards";
import ViewToggle, { type MapViewMode } from "./ViewToggle";
import ZonaFilter from "./ZonaFilter";
import LocationPanel from "./LocationPanel";
import GeocodingCoverage from "./GeocodingCoverage";

const MapView = dynamic(() => import("./map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-400">
      Carregando mapa…
    </div>
  ),
});

interface DashboardClientProps {
  candidate: CandidateConfig;
  zonas: Zona[];
  locations: LocationWithVotes[];
  totalVotos: number;
}

export default function DashboardClient({ candidate, zonas, locations, totalVotos }: DashboardClientProps) {
  const [mode, setMode] = useState<MapViewMode>("heatmap");
  const [selectedZonas, setSelectedZonas] = useState<Set<number>>(new Set(zonas.map((z) => z.zona)));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showWindbanners, setShowWindbanners] = useState(false);
  const [windbannerRoutes, setWindbannerRoutes] = useState<WindbannerRouteWithPoints[]>([]);

  useEffect(() => {
    fetchRoutes()
      .then(setWindbannerRoutes)
      .catch(() => {});
  }, []);

  const filteredLocations = useMemo(
    () => locations.filter((l) => selectedZonas.has(l.zona)),
    [locations, selectedZonas]
  );

  const selectedLocation = useMemo(
    () => filteredLocations.find((l) => l.id === selectedId) ?? null,
    [filteredLocations, selectedId]
  );

  const geocoded = filteredLocations.filter((l) => l.geocodeStatus === "ok").length;
  const approx = filteredLocations.filter((l) => l.geocodeStatus === "approx").length;
  const failedLocations = filteredLocations.filter(
    (l) => l.geocodeStatus === "failed" || l.geocodeStatus === "pending"
  );

  return (
    <div className="flex h-dvh flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">{candidate.nomeCurto}</h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              Mapa de calor da votação {candidate.cargo2024} 2024 — {candidate.cidade}/{candidate.estado}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <StatCards
            totalVotos={totalVotos}
            meta2026={candidate.meta2026}
            cargo2024={candidate.cargo2024}
            cargo2026={candidate.cargo2026}
          />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 sm:px-6">
        <ViewToggle mode={mode} onChange={setMode} />
        <ZonaFilter zonas={zonas} selected={selectedZonas} onChange={setSelectedZonas} />
        <button
          type="button"
          onClick={() => setShowWindbanners((v) => !v)}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            showWindbanners
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          Windbanners {windbannerRoutes.length > 0 ? `(${windbannerRoutes.length})` : ""}
        </button>
        <Link href="/admin" className="text-xs text-slate-400 hover:text-slate-700 hover:underline">
          Admin
        </Link>
        <span className="ml-auto text-xs text-slate-500">
          {filteredLocations.reduce((s, l) => s + l.votos, 0).toLocaleString("pt-BR")} votos em{" "}
          {filteredLocations.length} locais exibidos
        </span>
      </div>

      <div className="border-b border-slate-200 bg-white px-4 py-2 sm:px-6">
        <GeocodingCoverage
          ok={geocoded}
          approx={approx}
          failed={failedLocations.length}
          total={filteredLocations.length}
          failedLocations={failedLocations}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="min-h-[45vh] flex-1 md:min-h-0">
          <MapView
            locations={filteredLocations}
            mode={mode}
            selectedId={selectedId}
            onSelect={(l) => setSelectedId(l.id)}
            windbannerRoutes={windbannerRoutes}
            showWindbanners={showWindbanners}
          />
        </div>
        <aside className="w-full shrink-0 border-t border-slate-200 bg-white md:h-auto md:w-80 md:border-l md:border-t-0">
          <LocationPanel
            location={selectedLocation}
            zonas={zonas}
            locations={filteredLocations}
            onSelect={(l) => setSelectedId(l.id)}
            onClose={() => setSelectedId(null)}
          />
        </aside>
      </div>
    </div>
  );
}
