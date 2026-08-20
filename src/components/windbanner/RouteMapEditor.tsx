"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { WindbannerPoint } from "@/lib/windbanner-types";
import { POINT_STATUS_COLOR } from "@/lib/windbanner-status";

const PORTO_ALEGRE_CENTER: [number, number] = [-30.0446, -51.2177];

function numberedIcon(index: number, color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:26px;height:26px;border-radius:9999px;background:${color};color:#fff;font-weight:600;font-size:12px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);">${index + 1}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function FitBounds({ points }: { points: WindbannerPoint[] }) {
  const map = useMap();
  const geocoded = points.filter((p) => p.lat != null && p.lng != null);
  const pointCount = geocoded.length;

  useEffect(() => {
    if (pointCount === 0) return;
    if (pointCount === 1) {
      map.setView([geocoded[0].lat as number, geocoded[0].lng as number], 16);
      return;
    }
    const bounds = L.latLngBounds(geocoded.map((p) => [p.lat as number, p.lng as number] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, pointCount]);

  return null;
}

function ClickToAdd({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface RouteMapEditorProps {
  points: WindbannerPoint[];
  onMovePoint: (id: string, lat: number, lng: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
  selectedPointId?: string | null;
}

export default function RouteMapEditor({ points, onMovePoint, onMapClick, selectedPointId }: RouteMapEditorProps) {
  const geocoded = points.filter((p) => p.lat != null && p.lng != null);
  const positions = useMemo(() => geocoded.map((p) => [p.lat as number, p.lng as number] as [number, number]), [geocoded]);

  return (
    <div className="relative isolate h-full w-full">
      <MapContainer center={PORTO_ALEGRE_CENTER} zoom={13} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        <ClickToAdd onMapClick={onMapClick} />
        {positions.length > 1 && <Polyline positions={positions} pathOptions={{ color: "#0f172a", weight: 2.5, opacity: 0.7 }} />}
        {geocoded.map((point, i) => (
          <Marker
            key={point.id}
            position={[point.lat as number, point.lng as number]}
            draggable
            icon={numberedIcon(i, point.id === selectedPointId ? "#0f172a" : POINT_STATUS_COLOR[point.status])}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target as L.Marker;
                const { lat, lng } = marker.getLatLng();
                onMovePoint(point.id, lat, lng);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -14]} opacity={0.95}>
              <div className="text-xs">
                <div className="font-semibold">
                  {i + 1}. {point.endereco}
                </div>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
