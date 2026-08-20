"use client";

import { useMemo, useState } from "react";
import type { LocationWithVotes, Zona } from "@/lib/types";

interface LocationPanelProps {
  location: LocationWithVotes | null;
  zonas: Zona[];
  locations: LocationWithVotes[];
  onSelect: (location: LocationWithVotes) => void;
  onClose: () => void;
}

type SortBy = "votos" | "nome";

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function LocationPanel({ location, zonas, locations, onSelect, onClose }: LocationPanelProps) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("votos");

  const results = useMemo(() => {
    const q = normalize(query.trim());
    const filtered = q
      ? locations.filter((l) => normalize(l.nome).includes(q) || normalize(l.endereco).includes(q))
      : locations;
    return filtered
      .slice()
      .sort((a, b) => (sortBy === "nome" ? a.nome.localeCompare(b.nome, "pt-BR") : b.votos - a.votos));
  }, [locations, query, sortBy]);

  if (!location) {
    return (
      <div className="flex h-full flex-col overflow-hidden p-4">
        <h2 className="text-sm font-semibold text-slate-900">Locais de votação</h2>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou endereço…"
          className="mt-2 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
        />

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {results.length} de {locations.length} locais
          </span>
          <div className="inline-flex rounded-md border border-slate-200 p-0.5">
            {(
              [
                { key: "votos", label: "Votos" },
                { key: "nome", label: "A–Z" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSortBy(opt.key)}
                className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                  sortBy === opt.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-2 flex-1 space-y-1 overflow-y-auto">
          {results.length === 0 && (
            <li className="px-2 py-4 text-center text-xs text-slate-400">Nenhum local encontrado.</li>
          )}
          {results.map((loc, i) => (
            <li key={loc.id}>
              <button
                type="button"
                onClick={() => onSelect(loc)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-50"
              >
                <span className="w-5 shrink-0 text-xs font-semibold text-slate-400">
                  {sortBy === "votos" ? i + 1 : ""}
                </span>
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
