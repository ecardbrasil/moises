export type MapViewMode = "heatmap" | "markers";

interface ViewToggleProps {
  mode: MapViewMode;
  onChange: (mode: MapViewMode) => void;
}

export default function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
      {(
        [
          { key: "heatmap", label: "Mapa de calor" },
          { key: "markers", label: "Marcadores" },
        ] as const
      ).map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === opt.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
