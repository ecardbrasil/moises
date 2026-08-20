export type GeocodeStatus = "pending" | "ok" | "approx" | "failed";

export interface Location {
  id: string;
  nome: string;
  endereco: string;
  enderecoNormalizado: string;
  zona: number;
  cidade: string;
  estado: string;
  pais: string;
  semNumero: boolean;
  geocodeQuery: string;
  lat: number | null;
  lng: number | null;
  geocodeStatus: GeocodeStatus;
  geocodeDisplayName?: string;
  geocodeError?: string;
}

export interface Zona {
  zona: number;
  regiao: string;
  votos: number;
  secoes: number;
  locais: number;
  pctTotal: number;
}

export interface LocalResult {
  locationId: string;
  votos: number;
  pctTotal: number;
}

export interface ElectionResults {
  eleicaoId: string;
  ano: number;
  cargo: string;
  cidade: string;
  estado: string;
  totalVotos: number;
  zonas: Zona[];
  locais: LocalResult[];
}

export interface CandidateConfig {
  nomeCompleto: string;
  nomeCurto: string;
  cargo2024: string;
  cargo2026: string;
  cidade: string;
  estado: string;
  meta2026: number;
  eleicaoAtiva: string;
}

// A location joined with its vote result for a given election — the shape
// the map and list components actually consume.
export interface LocationWithVotes extends Location {
  votos: number;
  pctTotal: number;
}
