import type { LocationWithVotes, Zona } from "@/lib/types";

interface LocationPanelProps {
  location: LocationWithVotes | null;
  zonas: Zona[];
  topLocations: LocationWithVotes[];
  onSelect: (location: LocationWithVotes) => void;
  onClose: () => void;
}

export default function LocationPanel({ location, zonas, topLocations, onSelect, onClose }: LocationPanelProps) {
  if (!location) {
    return (
      <div className="flex h-full flex-col overflow-y-auto p-4">
        <h2 className="text-sm font-semibold text-slate-900">Locais com mais votos</h2>
        <p className="mt-1 text-xs text-slate-500">Clique num ponto do mapa para ver os detalhes aqui.</p>
        <ul className="mt-3 space-y-1">
          {topLocations.map((loc, i) => (
            <li key={loc.id}>
              <button
                type="button"
                onClick={() => onSelect(loc)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-50"
              >
                <span className="w-5 shrink-0 text-xs font-semibold text-slate-400">{i + 1}</span>
                <span className="flex-1 truncate text-slate-700">{loc.nome}</span>
                <span className="shrink-0 tabular-nums text-xs font-semibold text-slate-500">{loc.votos}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const zona = zonas.find((z) => z.zona === location.zona);

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-semibold leading-tight text-slate-900">{location.nome}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      <p className="mt-1 text-sm text-slate-500">{location.endereco}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <dt className="text-xs font-medium text-slate-500">Votos</dt>
          <dd className="mt-0.5 text-xl font-bold tabular-nums text-slate-900">{location.votos}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <dt className="text-xs font-medium text-slate-500">% do total</dt>
          <dd className="mt-0.5 text-xl font-bold tabular-nums text-slate-900">{location.pctTotal}%</dd>
        </div>
      </dl>

      <div className="mt-3 rounded-lg bg-slate-50 p-3">
        <dt className="text-xs font-medium text-slate-500">Zona eleitoral</dt>
        <dd className="mt-0.5 text-sm font-semibold text-slate-800">
          Zona {location.zona}
          {zona ? ` — ${zona.regiao}` : ""}
        </dd>
      </div>

      {location.geocodeStatus === "approx" && (
        <p className="mt-3 rounded-md bg-amber-50 px-2.5 py-2 text-xs text-amber-700">
          Localização aproximada — o endereço original não tinha número (S/N) ou não foi encontrado com
          exatidão.
        </p>
      )}
    </div>
  );
}
