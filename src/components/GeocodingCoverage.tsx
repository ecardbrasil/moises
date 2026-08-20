import type { LocationWithVotes } from "@/lib/types";

interface GeocodingCoverageProps {
  ok: number;
  approx: number;
  failed: number;
  total: number;
  failedLocations: LocationWithVotes[];
}

export default function GeocodingCoverage({ ok, approx, failed, total, failedLocations }: GeocodingCoverageProps) {
  if (failed === 0 && approx === 0) return null;

  const votosNaoPlotados = failedLocations.reduce((s, l) => s + l.votos, 0);

  return (
    <details className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 open:pb-3">
      <summary className="cursor-pointer select-none font-medium">
        Cobertura de geocodificação: {ok} exatos, {approx} aproximados, {failed} sem coordenadas (de {total} locais)
        {failed > 0 ? ` — ${votosNaoPlotados} votos não aparecem no mapa` : ""}
      </summary>
      {failed > 0 && (
        <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
          {failedLocations.map((l) => (
            <li key={l.id} className="flex justify-between gap-2">
              <span className="truncate">
                {l.nome} — {l.endereco}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{l.votos}v</span>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
