# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

Internal campaign dashboard: heat map of the 2024 city council (vereador)
vote results in Porto Alegre, tracking progress toward a 2026 state
deputy (deputado estadual) goal. Next.js App Router + TypeScript +
Tailwind, `react-leaflet` + `leaflet.heat` for the map. Election results
are static JSON (no database). The windbanner-routes feature (see below)
is the one part of the app backed by a real database (Supabase/Postgres)
and API routes — everything else is still static JSON. Deploy target:
Vercel.

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

## Windbanner routes (admin feature)

Tracks the daily routes field volunteers walk to place campaign
windbanners, so progress shows up on the same map as the vote heat map.
Unlike the rest of the app, this is backed by a real database:

- **Database**: Supabase project `moises-windbanners` (Postgres), tables
  `windbanner_routes` and `windbanner_points` (see the migration applied
  via the Supabase MCP tool — there's no `supabase/migrations` folder in
  this repo, the schema lives only in the hosted project). RLS is enabled
  with a fully-open policy (`using (true) with check (true)`) because
  there is no authentication yet — anyone with the link can read/write.
  Tighten these policies first if auth is ever added.
- **Env vars**: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (see `.env.example`). Required in Vercel project settings for
  production, and in `.env.local` for local dev (gitignored).
- **Data layer**: `src/lib/windbanners.ts` (server-side Supabase queries,
  camelCase mapping), `src/lib/windbanner-client.ts` (fetch wrappers used
  by client components), `src/lib/windbanner-types.ts`.
- **API routes**: `/api/windbanner-routes` (list/create),
  `/api/windbanner-routes/[id]` (get/update/delete),
  `/api/windbanner-routes/[id]/points` (add point — geocodes the address
  server-side via `src/lib/geocode.ts` if lat/lng aren't given),
  `/api/windbanner-routes/[id]/points/reorder`,
  `/api/windbanner-points/[id]` (update/delete a single point).
- **Admin UI**: `/admin` (list/create routes), `/admin/rotas/[id]` (edit a
  route: add points by address, reorder, delete, change route status).
  No authentication — don't link this URL anywhere public.
- **Field UI**: `/campo/[id]` — a compact, large-tap-target checklist for
  whoever is out placing banners to mark each point
  pendente/colocado/problema from their phone as they go.
- **Map layer**: `src/components/map/WindbannerLayer.tsx` renders each
  route as a dashed polyline connecting its geocoded points, plus a
  `CircleMarker` per point colored by status
  (`src/lib/windbanner-status.ts` has the shared status→color/label
  maps). Toggled on/off independently of the heatmap/markers `mode` via
  the "Windbanners" button in `DashboardClient`, which fetches all routes
  client-side with `fetchRoutes()`.
- **Sandbox network note**: like `nominatim.openstreetmap.org`, direct
  outbound HTTPS to `*.supabase.co` is blocked in this sandboxed
  environment's default egress policy, so the app can't be smoke-tested
  end-to-end here without `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`
  routing Node's fetch through the agent proxy — and even then the
  destination host still needs to be allowlisted. Use the Supabase MCP
  tools (`execute_sql`, etc.) to verify schema/data directly instead. This
  isn't a problem on Vercel or on a contributor's own machine, both of
  which have normal internet access.
