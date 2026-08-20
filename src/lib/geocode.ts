import type { GeocodeStatus } from "./types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "moises-heatmap-dashboard/1.0 (contato interno campanha, uso pontual)";
// Soft bias box for Porto Alegre, RS (left,top,right,bottom).
const POA_VIEWBOX = "-51.35,-29.90,-50.95,-30.35";
const CITY_SUFFIX = "Porto Alegre, RS, Brasil";

export interface GeocodeResult {
  lat: number;
  lng: number;
  status: GeocodeStatus;
  displayName: string;
}

async function query(q: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("viewbox", POA_VIEWBOX);

  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const data = await res.json();
  if (!data.length) return null;
  return { lat: Number(data[0].lat), lng: Number(data[0].lon), displayName: data[0].display_name };
}

// Geocodes a single free-text address typed by an admin. Tries the address
// as given first ("ok"); if that fails, retries without the city suffix
// stripped down to just the street ("approx"). One point at a time — this is
// called interactively from the admin UI, not in bulk, so no rate limiting
// like scripts/geocode.mjs is needed here.
export async function geocodeAddress(endereco: string): Promise<GeocodeResult | null> {
  const attempts: Array<{ q: string; status: GeocodeStatus }> = [
    { q: `${endereco}, ${CITY_SUFFIX}`, status: "ok" },
    { q: endereco, status: "approx" },
  ];

  for (const attempt of attempts) {
    const result = await query(attempt.q);
    if (result) return { ...result, status: attempt.status };
  }
  return null;
}
