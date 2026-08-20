import type { MapViewMode } from "@/components/ViewToggle";

interface MapLegendProps {
  mode: MapViewMode;
}

const HEAT_GRADIENT = "linear-gradient(to right, #3b82f6, #22d3ee, #facc15, #fb923c, #ef4444)";

export default function MapLegend({ mode }: MapLegendProps) {
  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-[1000] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-600 shadow-sm">
      {mode === "heatmap" ? (
        <div className="w-36">
          <div className="mb-1 font-medium text-slate-700">Densidade de votos</div>
          <div className="h-2 w-full rounded-full" style={{ background: HEAT_GRADIENT }} />
          <div className="mt-1 flex justify-between text-[10px] text-slate-500">
            <span>menos</span>
            <span>mais</span>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-1.5 font-medium text-slate-700">Votos por local</div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />
              <span>até 33% do máximo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
              <span>33–66% do máximo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
              <span>acima de 66% do máximo</span>
            </div>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500">O tamanho do círculo também é proporcional aos votos</div>
        </div>
      )}
    </div>
  );
}
