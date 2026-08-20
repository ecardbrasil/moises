import type { LocationWithVotes } from "@/lib/types";
import type { ImpactResult } from "@/lib/windbanner-impact";

interface ImpactSummaryPanelProps {
  impact: ImpactResult;
  locations: LocationWithVotes[];
}

export default function ImpactSummaryPanel({ impact, locations }: ImpactSummaryPanelProps) {
  if (impact.impactedCount === 0 && impact.needsAttentionCount === 0) return null;

  const needsAttentionLocations = locations
    .filter((l) => impact.needsAttention.has(l.id))
    .slice()
    .sort((a, b) => b.votos - a.votos);

  return (
    <details className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 open:pb-3">
      <summary className="cursor-pointer select-none font-medium">
        Windbanners: {impact.impactedCount} {impact.impactedCount === 1 ? "local impactado" : "locais impactados"} —{" "}
        {impact.needsAttentionCount} {impact.needsAttentionCount === 1 ? "precisa" : "precisam"} de atenção — cobertura{" "}
        {impact.coveragePct.toFixed(0)}%
      </summary>
      {needsAttentionLocations.length > 0 && (
        <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
          {needsAttentionLocations.map((l) => (
            <li key={l.id} className="flex justify-between gap-2">
              <span className="truncate">{l.nome}</span>
              <span className="shrink-0 font-semibold tabular-nums">{l.votos}v</span>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
