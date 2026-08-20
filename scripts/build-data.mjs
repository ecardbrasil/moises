// Reads the pre-processed TSE CSVs (data/raw) and produces normalized JSON
// used by the app and by the geocoding script (data/processed).
//
// Run: node scripts/build-data.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCSV } from "./lib/csv.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW = path.join(ROOT, "data/raw");
const OUT = path.join(ROOT, "data/processed");

fs.mkdirSync(OUT, { recursive: true });

function slugify(str) {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

// --- Zonas -----------------------------------------------------------------
const zonaRows = parseCSV(fs.readFileSync(path.join(RAW, "dados_por_zona.csv"), "utf-8"));
const zonas = zonaRows.map((r) => ({
  zona: Number(r.NR_ZONA),
  regiao: r.regiao,
  votos: Number(r.votos),
  secoes: Number(r.secoes),
  locais: Number(r.locais),
  pctTotal: Number(r.pct_total),
}));

// --- Locais de votação -------------------------------------------------------
const localRows = parseCSV(fs.readFileSync(path.join(RAW, "dados_por_local_votacao.csv"), "utf-8"));

const totalVotos = localRows.reduce((sum, r) => sum + Number(r.QT_VOTOS), 0);

const seenIds = new Map();
const locations = [];
const results = [];

for (const r of localRows) {
  const nome = r.NM_LOCAL_VOTACAO;
  const endereco = r.DS_LOCAL_VOTACAO_ENDERECO;
  const zona = Number(r.NR_ZONA);
  const votos = Number(r.QT_VOTOS);

  const baseId = `${zona}-${slugify(nome)}`;
  let id = baseId;
  let n = 2;
  while (seenIds.has(id)) {
    id = `${baseId}-${n}`;
    n++;
  }
  seenIds.set(id, true);

  const enderecoNormalizado = normalizeEndereco(endereco);
  const semNumero = /\bS\/?N\b/i.test(endereco);

  locations.push({
    id,
    nome,
    endereco,
    enderecoNormalizado,
    zona,
    cidade: "Porto Alegre",
    estado: "RS",
    pais: "Brasil",
    semNumero,
    geocodeQuery: `${enderecoNormalizado}, Porto Alegre, RS, Brasil`,
    lat: null,
    lng: null,
    geocodeStatus: "pending",
  });

  results.push({
    locationId: id,
    votos,
    pctTotal: Number(((votos / totalVotos) * 100).toFixed(2)),
  });
}

function normalizeEndereco(endereco) {
  // A few source rows lack a comma before the house number
  // ("EDUARDO CHARTTIER N 360", "IBIRAPUITA N 65 VILA SESI"). Leave as-is;
  // Nominatim tolerates minor formatting differences reasonably well.
  return endereco.replace(/\s+/g, " ").trim();
}

// --- Validation --------------------------------------------------------------
const errors = [];
if (totalVotos !== 8603) {
  errors.push(`Soma de votos por local = ${totalVotos}, esperado 8603`);
}
const votosPorZona = new Map();
const locaisPorZona = new Map();
for (const r of results) {
  const loc = locations.find((l) => l.id === r.locationId);
  votosPorZona.set(loc.zona, (votosPorZona.get(loc.zona) || 0) + r.votos);
  locaisPorZona.set(loc.zona, (locaisPorZona.get(loc.zona) || 0) + 1);
}
for (const z of zonas) {
  const v = votosPorZona.get(z.zona) || 0;
  const l = locaisPorZona.get(z.zona) || 0;
  if (v !== z.votos) errors.push(`Zona ${z.zona}: votos calculados=${v} vs CSV=${z.votos}`);
  if (l !== z.locais) errors.push(`Zona ${z.zona}: locais calculados=${l} vs CSV=${z.locais}`);
}
if (locations.length !== 339) {
  errors.push(`Total de locais = ${locations.length}, esperado 339`);
}

if (errors.length) {
  console.error("Falhas de validação:");
  errors.forEach((e) => console.error(" - " + e));
  process.exit(1);
}

fs.writeFileSync(path.join(OUT, "zonas.json"), JSON.stringify(zonas, null, 2));
fs.writeFileSync(path.join(OUT, "locations.json"), JSON.stringify(locations, null, 2));
fs.writeFileSync(
  path.join(OUT, "results-2024-vereador.json"),
  JSON.stringify(
    {
      eleicaoId: "2024-vereador",
      ano: 2024,
      cargo: "Vereador",
      cidade: "Porto Alegre",
      estado: "RS",
      totalVotos,
      zonas,
      locais: results,
    },
    null,
    2
  )
);

const semNumeroCount = locations.filter((l) => l.semNumero).length;
console.log(`OK: ${locations.length} locais, ${totalVotos} votos, validação passou.`);
console.log(`Endereços sem número (S/N): ${semNumeroCount} — vão exigir atenção na geocodificação.`);
