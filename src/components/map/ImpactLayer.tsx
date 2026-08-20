"use client";

import { CircleMarker } from "react-leaflet";
import type { LocationWithVotes } from "@/lib/types";
import type { ImpactResult } from "@/lib/windbanner-impact";

interface ImpactLayerProps {
  locations: LocationWithVotes[];
  impact: ImpactResult;
}

// Rendered before HeatLayer/MarkersLayer in MapView so these rings paint
// underneath them; `interactive: false` keeps clicks passing through to the
// real marker on top.
export default function ImpactLayer({ locations, impact }: ImpactLayerProps) {
  return (
    <>
      {locations.map((loc) => {
        if (loc.lat == null || loc.lng == null) return null;
        if (impact.impacted.has(loc.id)) {
          return (
            <CircleMarker
              key={`impact-${loc.id}`}
              center={[loc.lat, loc.lng]}
              radius={16}
              interactive={false}
              pathOptions={{ color: "#16a34a", weight: 2, opacity: 0.7, fillOpacity: 0 }}
            />
          );
        }
        if (impact.needsAttention.has(loc.id)) {
          return (
            <CircleMarker
              key={`attention-${loc.id}`}
              center={[loc.lat, loc.lng]}
              radius={16}
              interactive={false}
              pathOptions={{ color: "#dc2626", weight: 2, opacity: 0.7, dashArray: "4 4", fillOpacity: 0 }}
            />
          );
        }
        return null;
      })}
    </>
  );
}
