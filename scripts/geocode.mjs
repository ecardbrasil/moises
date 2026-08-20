// Geocodes the 339 unique locais de votação via Nominatim (OpenStreetMap),
// respecting the ~1 req/sec usage policy, and caches results to disk so the
// app never geocodes at runtime.
//
// Run: node scripts/geocode.mjs
// Re-run is safe/idempotent: locations already geocoded (status "ok") are
// skipped unless --force is passed; "approx"/"failed" are retried so
// improvements to the query-cleaning logic below can recover more of them.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LOCATIONS_PATH = path.join(ROOT, "data/processed/locations.json");

const FORCE = process.argv.includes("--force");
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "moises-heatmap-dashboard/1.0 (contato interno campanha, uso pontual)";
// Soft bias box for Porto Alegre, RS (left,top,right,bottom) — no "bounded"
// param, so results near the edge of the municipality (islands, Restinga,
// Belém Novo, Lami) aren't hard-excluded if they fall just outside it.
const POA_VIEWBOX = "-51.35,-29.90,-50.95,-30.35";

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

const CITY_SUFFIX = "Porto Alegre, RS, Brasil";

// A few TSE address rows are inconsistently formatted in ways that confuse a
// geocoder even though they have a real, findable street + number. Clean
// those patterns up before giving up on an "exact" match.
function cleanEndereco(endereco) {
  return endereco
    .replace(/\([^)]*\)/g, " ") // parenthetical notes: "(RESTINGA NOVA)", "(ESQ RUA X)"
    .replace(/\s+N[º°]?\s*(\d+)/i, ", $1") // "EDUARDO CHARTTIER N 360" -> "EDUARDO CHARTTIER, 360"
    .replace(/\s+-\s+ESQUINA.*/i, "") // "AV NITEROI - ESQUINA TRAV. VIAMAO" -> "AV NITEROI"
    .replace(/\s+/g, " ")
    .trim()
    .replace(/,\s*$/, "");
}

function streetOnly(endereco) {
  return endereco
    .replace(/,?\s*S\/?N\b.*/i, "") // drop "S/N ..." entirely
    .replace(/,\s*\d+.*/, "") // drop ", <number> ..."
    .replace(/\s+-\s+.*/, "") // drop " - <extra text>"
    .trim();
}

// Ordered geocoding strategies, tried until one succeeds. Each entry maps to
// a geocodeStatus label for whichever one finally works.
function buildAttempts(loc) {
  const raw = loc.enderecoNormalizado;
  const cleaned = cleanEndereco(raw);
  const street = streetOnly(cleaned);

  const attempts = [{ query: `${raw}, ${CITY_SUFFIX}`, status: "ok" }];
  if (cleaned !== raw) attempts.push({ query: `${cleaned}, ${CITY_SUFFIX}`, status: "ok" });
  if (street && street !== cleaned) attempts.push({ query: `${street}, ${CITY_SUFFIX}`, status: "approx" });
  // Last resort: search by the venue's own name (many schools/clubs are
  // mapped as named POIs in OSM even when the postal address string isn't).
  attempts.push({ query: `${loc.nome}, ${CITY_SUFFIX}`, status: "approx" });

  return attempts;
}

async function main() {
  const pending = locations.filter((l) => FORCE || l.geocodeStatus !== "ok");
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
      const attempts = buildAttempts(loc);
      let result = null;
      let status = "failed";

      for (let a = 0; a < attempts.length; a++) {
        if (a > 0) await sleep(1100);
        result = await geocodeOne(attempts[a].query);
        if (result) {
          status = attempts[a].status;
          break;
        }
      }

      if (result) {
        loc.lat = result.lat;
        loc.lng = result.lng;
        loc.geocodeStatus = status;
        loc.geocodeDisplayName = result.displayName;
        delete loc.geocodeError;
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
  console.log(`Aproximado (rua sem número, ou local encontrado pelo nome): ${approx}`);
  console.log(`Falhou: ${failed}`);
  console.log(`Total: ${locations.length}`);
}

main();
