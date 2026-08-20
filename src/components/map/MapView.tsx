"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LocationWithVotes } from "@/lib/types";
import type { MapViewMode } from "@/components/ViewToggle";
import HeatLayer from "./HeatLayer";
import MarkersLayer from "./MarkersLayer";
import MapLegend from "./MapLegend";

const PORTO_ALEGRE_CENTER: [number, number] = [-30.0446, -51.2177];

interface MapViewProps {
  locations: LocationWithVotes[];
  mode: MapViewMode;
  selectedId: string | null;
  onSelect: (location: LocationWithVotes) => void;
}

export default function MapView({ locations, mode, selectedId, onSelect }: MapViewProps) {
  const geocoded = locations.filter((l) => l.lat != null && l.lng != null);

  return (
    <div className="relative h-full w-full">
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
        {mode === "heatmap" && (
          <HeatLayer points={geocoded.map((l) => ({ lat: l.lat as number, lng: l.lng as number, votos: l.votos }))} />
        )}
        <MarkersLayer locations={geocoded} selectedId={selectedId} onSelect={onSelect} visible={mode === "markers"} />
      </MapContainer>
      <MapLegend mode={mode} />
    </div>
  );
}
