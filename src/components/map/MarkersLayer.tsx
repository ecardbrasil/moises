"use client";

import { CircleMarker, Tooltip } from "react-leaflet";
import type { LocationWithVotes } from "@/lib/types";

interface MarkersLayerProps {
  locations: LocationWithVotes[];
  selectedId: string | null;
  onSelect: (location: LocationWithVotes) => void;
  /** When false, markers render as small invisible click-targets (used to keep
   * points clickable while the heatmap layer is the visible representation). */
  visible?: boolean;
}

const MIN_RADIUS = 5;
const MAX_RADIUS = 32;

function radiusFor(votos: number, maxVotos: number) {
  const t = Math.sqrt(votos / maxVotos);
  return MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS);
}

function colorFor(votos: number, maxVotos: number) {
  const t = votos / maxVotos;
  if (t > 0.66) return "#ef4444";
  if (t > 0.33) return "#f59e0b";
  return "#3b82f6";
}

export default function MarkersLayer({ locations, selectedId, onSelect, visible = true }: MarkersLayerProps) {
  const maxVotos = Math.max(1, ...locations.map((l) => l.votos));

  return (
    <>
      {locations.map((loc) => {
        if (loc.lat == null || loc.lng == null) return null;
        const isSelected = loc.id === selectedId;
        return (
          <CircleMarker
            key={loc.id}
            center={[loc.lat, loc.lng]}
            radius={visible ? radiusFor(loc.votos, maxVotos) : 10}
            pathOptions={{
              color: visible ? (isSelected ? "#0f172a" : "#ffffff") : "transparent",
              weight: visible ? (isSelected ? 2.5 : 1) : 0,
              fillColor: colorFor(loc.votos, maxVotos),
              fillOpacity: visible ? 0.75 : 0,
              opacity: visible ? 1 : 0,
            }}
            eventHandlers={{ click: () => onSelect(loc) }}
          >
            {visible && (
              <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
                <div className="text-xs">
                  <div className="font-semibold">{loc.nome}</div>
                  <div>{loc.votos} votos</div>
                </div>
              </Tooltip>
            )}
          </CircleMarker>
        );
      })}
    </>
  );
}
