# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

Internal campaign dashboard: heat map of the 2024 city council (vereador)
vote results in Porto Alegre, tracking progress toward a 2026 state
deputy (deputado estadual) goal. Next.js App Router + TypeScript +
Tailwind, `react-leaflet` + `leaflet.heat` for the map, all data served
from static JSON (no database, no API routes). Deploy target: Vercel.

## Commands

```bash
npm run dev      # dev server (Turbopack), http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint      # eslint
```

There is no test suite in this repo.

## Data pipeline

Source of truth is `data/raw/*.csv` (pre-processed/verified from the raw
TSE export). Two scripts regenerate `data/processed/`:

1. **`node scripts/build-data.mjs`** — reads `data/raw/`, validates against
   official totals, and writes `zonas.json`, `locations.json` (339 unique
   locations, `geocodeStatus: "pending"`, no lat/lng yet), and
   `results-2024-vereador.json`. Re-running **wipes any existing
   geocoding** in `locations.json` — only run it if the source CSVs change.
2. **`node scripts/geocode.mjs`** — geocodes addresses via Nominatim
   (OpenStreetMap), rate-limited to ~1 req/s, writing lat/lng directly into
   `locations.json`. Idempotent — only re-geocodes entries without status
   `"ok"` (`--force` to redo all). **Needs network access to
   `nominatim.openstreetmap.org`, which is blocked in sandboxed
   environments (Claude Code on the web) — run this one locally.** Takes
   ~10-12 min for the full set. Prints a summary of `ok` (exact match),
   `approx` (fallback, e.g. TSE addresses with no house number), and
   `failed` counts; commit the resulting `locations.json` after running.

### Schema: locations vs. results

`locations.json` is the master list of physical polling locations
(address + geocoding), keyed by stable `id` (`{zona}-{slug-do-nome}`) and
reused across elections. Each `results-<ano>-<cargo>.json` holds only the
vote counts (`locationId` → `votos`/`pctTotal`) for one election/candidate.
`src/lib/data.ts` joins the two via `getLocationsWithVotes(eleicaoId)`.

To add a new election (e.g. 2022 deputado estadual): generate a new
`results-2022-deputado-estadual.json` in the same shape (see
`scripts/build-data.mjs` for the shape), register it in the `elections`
map in `src/lib/data.ts`, and geocode any newly-introduced addresses only
— existing locations are reused automatically by `id`.

Candidate display info (name, cargo2024/2026, city, meta2026) lives in
`data/config/candidate.json` — the only place the candidate's name is
hardcoded.

## Architecture

- `src/lib/data.ts` is the single data-access layer: it imports the JSON
  under `data/`, exposes `getCandidateConfig`, `getZonas`,
  `getElectionResults`, `getLocationsWithVotes`, `getGeocodingSummary`.
  All components read through here, never straight from `data/processed/*.json`.
- `src/app/page.tsx` (server component) calls into `src/lib/data.ts` and
  passes the results into `DashboardClient` (client component), which owns
  all interactive state: selected zonas, map mode, selected location.
- `src/components/map/MapView.tsx` wraps `MapContainer` and switches
  between `HeatLayer` (leaflet.heat) and `MarkersLayer` (proportional
  `CircleMarker`s) based on `mode`; `MapLegend` renders as an overlay.
  `MapView` is loaded via `next/dynamic` with `ssr: false` (Leaflet needs
  `window`).
- **Stacking context gotcha**: `.leaflet-container` is `position: relative`
  with `z-index: auto`, so it does *not* isolate its own stacking context —
  Leaflet's internal panes (up to z-index 700, e.g. marker pane at 600) can
  leak out and out-stack sibling UI outside the map (dropdowns, panels)
  even when those siblings have a numerically higher `z-index`. The map's
  wrapper div uses Tailwind's `isolate` (`isolation: isolate`) to contain
  Leaflet's internal z-index inside the map. Keep that class if you touch
  `MapView.tsx`, and prefer fixing new leaks the same way over bumping
  z-index values further.
- `LocationWithVotes` (in `src/lib/types.ts`) is the shape almost every
  component consumes: a `Location` (address + geocoding) merged with that
  location's `votos`/`pctTotal` for the active election.
