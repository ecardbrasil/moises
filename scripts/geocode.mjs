// Geocodes the 339 unique locais de votação via Nominatim (OpenStreetMap),
// respecting the ~1 req/sec usage policy, and caches results to disk so the
// app never geocodes at runtime.
//
// Run: node scripts/geocode.mjs
// Re-run is safe/idempotent: locations already geocoded (status "ok") are
// skipped unless --force is passed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LOCATIONS_PATH = path.join(ROOT, "data/processed/locations.json");

const FORCE = process.argv.includes("--force");
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "moises-heatmap-dashboard/1.0 (contato interno campanha, uso pontual)";
// Bounding box for Porto Alegre, RS (viewbox as lon/lat pairs: left,top,right,bottom)
const POA_VIEWBOX = "-51.30,-29.95,-51.02,-30.28";

const locations = JSON.parse(fs.readFileSync(LOCATIONS_PATH, "utf-8"));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocodeOne(query) {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("viewbox", POA_VIEWBOX);
  url.searchParams.set("bounded", "1");

  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.length) return null;
  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
    displayName: data[0].display_name,
    importance: data[0].importance,
  };
}

// Fallback query without a street number, for "S/N" addresses or when the
// exact address isn't found (falls back to the street/neighborhood).
function fallbackQuery(loc) {
  const streetOnly = loc.enderecoNormalizado
    .replace(/,?\s*S\/?N\b.*/i, "")
    .replace(/,\s*\d+.*/, "");
  return `${streetOnly}, Porto Alegre, RS, Brasil`;
}

async function main() {
  let pending = locations.filter((l) => FORCE || l.geocodeStatus !== "ok");
  console.log(`Geocodificando ${pending.length} de ${locations.length} locais (1 req/seg)...`);

  let ok = 0;
  let approx = 0;
  let failed = 0;

  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    if (!FORCE && loc.geocodeStatus === "ok") {
      ok++;
      continue;
    }

    process.stdout.write(`[${i + 1}/${locations.length}] ${loc.nome.slice(0, 50)}... `);

    try {
      let result = await geocodeOne(loc.geocodeQuery);
      let status = "ok";

      if (!result) {
        await sleep(1100);
        result = await geocodeOne(fallbackQuery(loc));
        status = "approx";
      }

      if (result) {
        loc.lat = result.lat;
        loc.lng = result.lng;
        loc.geocodeStatus = status;
        loc.geocodeDisplayName = result.displayName;
        if (status === "ok") ok++;
        else approx++;
        console.log(`${status === "ok" ? "OK" : "APROXIMADO"} (${result.lat.toFixed(5)}, ${result.lng.toFixed(5)})`);
      } else {
        loc.geocodeStatus = "failed";
        failed++;
        console.log("FALHOU");
      }
    } catch (err) {
      loc.geocodeStatus = "failed";
      loc.geocodeError = String(err);
      failed++;
      console.log(`ERRO: ${err}`);
    }

    fs.writeFileSync(LOCATIONS_PATH, JSON.stringify(locations, null, 2));
    await sleep(1100);
  }

  console.log("\n--- Resumo da geocodificação ---");
  console.log(`OK (endereço exato): ${ok}`);
  console.log(`Aproximado (fallback sem número): ${approx}`);
  console.log(`Falhou: ${failed}`);
  console.log(`Total: ${locations.length}`);
}

main();
