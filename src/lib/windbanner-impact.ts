import type { LocationWithVotes } from "./types";
import type { WindbannerRouteWithPoints } from "./windbanner-types";

export const IMPACT_RADIUS_M = 300;

// Reuses the exact t > 0.33 cutoff MarkersLayer.colorFor already uses for
// amber/red markers, so "needs attention" lines up with the locations
// already highlighted in the markers view instead of inventing a second,
// uncalibrated threshold.
const HIGH_VOTE_RATIO = 0.33;

const EARTH_RADIUS_M = 6371000;

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export interface ImpactResult {
  /** location ids with a "colocado" windbanner point within IMPACT_RADIUS_M */
  impacted: Set<string>;
  /** high-vote location ids with no impacted windbanner nearby */
  needsAttention: Set<string>;
  impactedCount: number;
  needsAttentionCount: number;
  coveragePct: number;
}

// Ignores each route's `ativo` flag on purpose: a windbanner already placed
// in the field counts as impact even if its route was later deactivated.
export function computeImpact(locations: LocationWithVotes[], routes: WindbannerRouteWithPoints[]): ImpactResult {
  const placedPoints = routes
    .flatMap((r) => r.pontos)
    .filter((p) => p.status === "colocado" && p.lat != null && p.lng != null)
    .map((p) => ({ lat: p.lat as number, lng: p.lng as number }));

  const geocodedLocations = locations.filter((l) => l.lat != null && l.lng != null);
  const maxVotos = Math.max(1, ...locations.map((l) => l.votos));

  const impacted = new Set<string>();
  const needsAttention = new Set<string>();

  for (const location of geocodedLocations) {
    const point = { lat: location.lat as number, lng: location.lng as number };
    const isImpacted = placedPoints.some((p) => haversineMeters(point, p) <= IMPACT_RADIUS_M);
    if (isImpacted) {
      impacted.add(location.id);
      continue;
    }
    if (location.votos / maxVotos > HIGH_VOTE_RATIO) needsAttention.add(location.id);
  }

  return {
    impacted,
    needsAttention,
    impactedCount: impacted.size,
    needsAttentionCount: needsAttention.size,
    coveragePct: geocodedLocations.length > 0 ? (impacted.size / geocodedLocations.length) * 100 : 0,
  };
}
