"use client";

import { useState } from "react";
import type { Zona } from "@/lib/types";

interface ZonaFilterProps {
  zonas: Zona[];
  selected: Set<number>;
  onChange: (selected: Set<number>) => void;
}

export default function ZonaFilter({ zonas, selected, onChange }: ZonaFilterProps) {
  const [open, setOpen] = useState(false);
  const allSelected = selected.size === zonas.length;

  function toggleZona(zona: number) {
    const next = new Set(selected);
    if (next.has(zona)) next.delete(zona);
    else next.add(zona);
    onChange(next);
  }

  function toggleAll() {
    onChange(allSelected ? new Set() : new Set(zonas.map((z) => z.zona)));
  }

  const label = allSelected
    ? "Todas as zonas"
    : selected.size === 0
      ? "Nenhuma zona"
      : `${selected.size} de ${zonas.length} zonas`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        {label}
        <svg width="12" height="12" viewBox="0 0 12 12" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-50 mt-1 w-72 max-w-[90vw] rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            <button
              type="button"
              onClick={toggleAll}
              className="mb-1 w-full rounded-md px-2 py-1.5 text-left text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              {allSelected ? "Desmarcar todas" : "Marcar todas"}
            </button>
            <div className="max-h-72 overflow-y-auto">
              {zonas
                .slice()
                .sort((a, b) => b.votos - a.votos)
                .map((z) => (
                  <label
                    key={z.zona}
                    className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(z.zona)}
                      onChange={() => toggleZona(z.zona)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300"
                    />
                    <span className="flex-1">
                      <span className="font-medium text-slate-800">Zona {z.zona}</span>
                      <span className="block text-xs text-slate-500">{z.regiao}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-xs font-semibold text-slate-500">{z.votos}</span>
                  </label>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
