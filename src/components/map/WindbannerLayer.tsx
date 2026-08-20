"use client";

import { Fragment } from "react";
import { CircleMarker, Polyline, Tooltip } from "react-leaflet";
import type { WindbannerRouteWithPoints } from "@/lib/windbanner-types";
import { POINT_STATUS_COLOR, POINT_STATUS_LABEL } from "@/lib/windbanner-status";

interface WindbannerLayerProps {
  routes: WindbannerRouteWithPoints[];
}

export default function WindbannerLayer({ routes }: WindbannerLayerProps) {
  return (
    <>
      {routes.map((route) => {
        const geocoded = route.pontos.filter((p) => p.lat != null && p.lng != null);
        const positions = geocoded.map((p) => [p.lat as number, p.lng as number] as [number, number]);

        return (
          <Fragment key={route.id}>
            {positions.length > 1 && (
              <Polyline positions={positions} pathOptions={{ color: "#0f172a", weight: 2, opacity: 0.6, dashArray: "6 6" }} />
            )}
            {geocoded.map((point) => (
              <CircleMarker
                key={point.id}
                center={[point.lat as number, point.lng as number]}
                radius={7}
                pathOptions={{
                  color: "#ffffff",
                  weight: 1.5,
                  fillColor: POINT_STATUS_COLOR[point.status],
                  fillOpacity: 0.9,
                }}
              >
                <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
                  <div className="text-xs">
                    <div className="font-semibold">{route.nome}</div>
                    <div>{point.endereco}</div>
                    <div>{POINT_STATUS_LABEL[point.status]}</div>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </Fragment>
        );
      })}
    </>
  );
}
