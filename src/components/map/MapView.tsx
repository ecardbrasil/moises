"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LocationWithVotes } from "@/lib/types";
import type { WindbannerRouteWithPoints } from "@/lib/windbanner-types";
import type { ImpactResult } from "@/lib/windbanner-impact";
import type { MapViewMode } from "@/components/ViewToggle";
import HeatLayer from "./HeatLayer";
import MarkersLayer from "./MarkersLayer";
import MapLegend from "./MapLegend";
import WindbannerLayer from "./WindbannerLayer";
import ImpactLayer from "./ImpactLayer";

const PORTO_ALEGRE_CENTER: [number, number] = [-30.0446, -51.2177];

interface MapViewProps {
  locations: LocationWithVotes[];
  mode: MapViewMode;
  selectedId: string | null;
  onSelect: (location: LocationWithVotes) => void;
  windbannerRoutes?: WindbannerRouteWithPoints[];
  showWindbanners?: boolean;
  impact?: ImpactResult;
  showImpact?: boolean;
}

export default function MapView({
  locations,
  mode,
  selectedId,
  onSelect,
  windbannerRoutes = [],
  showWindbanners = false,
  impact,
  showImpact = false,
}: MapViewProps) {
  const geocoded = locations.filter((l) => l.lat != null && l.lng != null);

  return (
    <div className="relative isolate h-full w-full">
      <MapContainer
        center={PORTO_ALEGRE_CENTER}
        zoom={12}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showImpact && impact && <ImpactLayer locations={geocoded} impact={impact} />}
        {mode === "heatmap" && (
          <HeatLayer points={geocoded.map((l) => ({ lat: l.lat as number, lng: l.lng as number, votos: l.votos }))} />
        )}
        <MarkersLayer locations={geocoded} selectedId={selectedId} onSelect={onSelect} visible={mode === "markers"} />
        {showWindbanners && <WindbannerLayer routes={windbannerRoutes} />}
      </MapContainer>
      <MapLegend mode={mode} />
    </div>
  );
}
