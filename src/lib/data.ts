import locationsRaw from "../../data/processed/locations.json";
import zonasRaw from "../../data/processed/zonas.json";
import results2024Vereador from "../../data/processed/results-2024-vereador.json";
import candidateConfig from "../../data/config/candidate.json";
import type { CandidateConfig, ElectionResults, Location, LocationWithVotes, Zona } from "./types";

const locations = locationsRaw as Location[];
const zonas = zonasRaw as Zona[];

// Registry of election result sets. Adding a future election/candidate is a
// matter of dropping a new results-*.json (same shape as ElectionResults)
// and registering it here — locations are shared/reused by id.
const elections: Record<string, ElectionResults> = {
  "2024-vereador": results2024Vereador as ElectionResults,
};

export function getCandidateConfig(): CandidateConfig {
  return candidateConfig as CandidateConfig;
}

export function getZonas(): Zona[] {
  return zonas;
}

export function getElectionResults(eleicaoId: string): ElectionResults {
  const results = elections[eleicaoId];
  if (!results) throw new Error(`Eleição desconhecida: ${eleicaoId}`);
  return results;
}

export function getLocationsWithVotes(eleicaoId: string): LocationWithVotes[] {
  const results = getElectionResults(eleicaoId);
  const votesByLocationId = new Map(results.locais.map((r) => [r.locationId, r]));
  return locations
    .map((loc) => {
      const r = votesByLocationId.get(loc.id);
      if (!r) return null;
      return { ...loc, votos: r.votos, pctTotal: r.pctTotal };
    })
    .filter((l): l is LocationWithVotes => l !== null)
    .sort((a, b) => b.votos - a.votos);
}

export function getGeocodingSummary(eleicaoId: string) {
  const locs = getLocationsWithVotes(eleicaoId);
  const ok = locs.filter((l) => l.geocodeStatus === "ok");
  const approx = locs.filter((l) => l.geocodeStatus === "approx");
  const failed = locs.filter((l) => l.geocodeStatus === "failed" || l.geocodeStatus === "pending");
  return {
    total: locs.length,
    ok: ok.length,
    approx: approx.length,
    failed: failed.length,
    failedLocations: failed,
  };
}
