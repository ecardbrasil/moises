"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

interface HeatLayerProps {
  points: { lat: number; lng: number; votos: number }[];
}

export default function HeatLayer({ points }: HeatLayerProps) {
  const map = useMap();

  useEffect(() => {
    let layer: L.HeatLayer | undefined;
    let cancelled = false;

    (async () => {
      if (typeof window !== "undefined") {
        (window as unknown as { L: typeof L }).L = L;
      }
      await import("leaflet.heat");
      if (cancelled) return;

      const maxVotos = Math.max(1, ...points.map((p) => p.votos));
      const latlngs: [number, number, number][] = points.map((p) => [p.lat, p.lng, p.votos]);

      layer = L.heatLayer(latlngs, {
        radius: 30,
        blur: 22,
        maxZoom: 17,
        max: maxVotos,
        minOpacity: 0.35,
        gradient: { 0.2: "#3b82f6", 0.4: "#22d3ee", 0.6: "#facc15", 0.8: "#fb923c", 1: "#ef4444" },
      });
      layer.addTo(map);
    })();

    return () => {
      cancelled = true;
      if (layer) map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
}
